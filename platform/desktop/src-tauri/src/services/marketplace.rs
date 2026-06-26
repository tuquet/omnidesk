use crate::error::AppError;
use sqlx::SqlitePool;
use reqwest::Client;
use serde_json::Value;

// Helper to get Supabase API URL and Key
fn get_supabase_config() -> Result<(String, String), AppError> {
    let url = std::env::var("VITE_SUPABASE_URL")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_URL".to_string()))?;
    let key = std::env::var("VITE_SUPABASE_ANON_KEY")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_ANON_KEY".to_string()))?;
    Ok((url, key))
}

pub async fn get_marketplace_apps() -> Result<Vec<Value>, AppError> {
    let (url, anon_key) = get_supabase_config()?;
    let client = Client::new();
    
    // Fetch apps from Supabase REST API
    let res = client.get(&format!("{}/rest/v1/marketplace_apps?select=*&order=sort_order.asc", url))
        .header("apikey", &anon_key)
        .header("Authorization", format!("Bearer {}", anon_key)) // Anonymous read
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch apps: {}", e)))?;
        
    if !res.status().is_success() {
        return Err(AppError::Internal(format!("Supabase API error: {}", res.status())));
    }
    
    let mut apps: Vec<Value> = res.json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse apps: {}", e)))?;
        
    // Filter out mock apps
    let mock_ids = vec!["lifecycle", "analytics", "projects", "documents", "showcase", "error-pages"];
    apps.retain(|app| {
        app.get("id")
            .and_then(|id| id.as_str())
            .map(|id_str| !mock_ids.contains(&id_str))
            .unwrap_or(true)
    });

    // Inject Automa E2E Orchestrator App
    let has_automa = apps.iter().any(|app| {
        app.get("id")
            .and_then(|id| id.as_str())
            .map(|id_str| id_str == "automa")
            .unwrap_or(false)
    });
    
    if !has_automa {
        apps.push(serde_json::json!({
            "id": "automa",
            "name": "Automa E2E",
            "description": "End-to-End Orchestrator and test execution automation.",
            "icon_name": "PlayCircle",
            "category": "Development",
            "is_core": false,
            "sort_order": 10,
            "created_at": chrono::Utc::now().to_rfc3339()
        }));
    }
        
    Ok(apps)
}

pub async fn get_installed_apps(pool: &SqlitePool, user_id: &str) -> Result<Vec<String>, AppError> {
    // Read from local SQLite
    let rows = sqlx::query(
        "SELECT app_id FROM user_installed_apps WHERE user_id = ?"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    
    let app_ids = rows.into_iter()
        .map(|row| {
            use sqlx::Row;
            row.get::<String, _>("app_id")
        })
        .collect();
    Ok(app_ids)
}

#[derive(serde::Serialize)]
pub struct InstalledAppDetails {
    pub app_id: String,
    pub version: String,
}

pub async fn get_installed_details(pool: &SqlitePool, user_id: &str) -> Result<Vec<InstalledAppDetails>, AppError> {
    // Read from local SQLite
    let rows = sqlx::query(
        "SELECT app_id, version FROM user_installed_apps WHERE user_id = ?"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    
    let details = rows.into_iter()
        .map(|row| {
            use sqlx::Row;
            InstalledAppDetails {
                app_id: row.get::<String, _>("app_id"),
                version: row.get::<String, _>("version"),
            }
        })
        .collect();
    Ok(details)
}

#[derive(serde::Deserialize)]
struct AppMetadata {
    current_version: String,
    download_url: Option<String>,
    package_hash: Option<String>,
}

async fn fetch_app_metadata_from_supabase(app_id: &str) -> Result<AppMetadata, AppError> {
    let (url, anon_key) = get_supabase_config()?;
    let client = Client::new();
    let res = client.get(&format!("{}/rest/v1/marketplace_apps?id=eq.{}&select=current_version,download_url,package_hash", url, app_id))
        .header("apikey", &anon_key)
        .header("Authorization", format!("Bearer {}", anon_key))
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to fetch app metadata: {}", e)))?;

    if !res.status().is_success() {
        return Err(AppError::Internal(format!("Supabase API error: {}", res.status())));
    }

    let list: Vec<AppMetadata> = res.json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse app metadata: {}", e)))?;

    list.into_iter().next().ok_or_else(|| AppError::Internal(format!("App {} not found in marketplace", app_id)))
}

pub async fn install_app_impl(
    pool: &SqlitePool,
    app_dir: &std::path::Path,
    user_id: &str,
    app_id: &str,
    _jwt: &str,
) -> Result<(), AppError> {
    let mut download_url = None;
    let mut version = "1.0.0".to_string();
    let mut expected_hash = None;

    // Fetch app metadata from Supabase
    if let Ok(meta) = fetch_app_metadata_from_supabase(app_id).await {
        version = meta.current_version;
        download_url = meta.download_url;
        expected_hash = meta.package_hash;
    } else {
        println!("[Marketplace] Warning: Failed to fetch metadata from Supabase for app '{}', using default version '1.0.0' and local package fallback", app_id);
    }

    // 1. Clean and recreate sandbox directory
    let sandbox_dir = app_dir.join("apps").join(app_id);
    if sandbox_dir.exists() {
        std::fs::remove_dir_all(&sandbox_dir)
            .map_err(|e| AppError::Internal(format!("Failed to clean existing sandbox: {}", e)))?;
    }
    std::fs::create_dir_all(&sandbox_dir)
        .map_err(|e| AppError::Internal(format!("Failed to create sandbox directory: {}", e)))?;

    // 2. Obtain ZIP bytes and extract
    if let Some(url) = download_url {
        println!("[Marketplace] Downloading package for '{}' (v{}) from {}", app_id, version, url);
        let client = Client::new();
        let res = client.get(&url)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to send download request: {}", e)))?;
            
          if !res.status().is_success() {
              return Err(AppError::Internal(format!("Supabase storage returned error code: {}", res.status())));
          }
          
          let bytes = res.bytes()
              .await
              .map_err(|e| AppError::Internal(format!("Failed to read package bytes: {}", e)))?;

          // Verify hash if present
          if let Some(ref hash) = expected_hash {
              use sha2::{Sha256, Digest};
              let mut hasher = Sha256::new();
              hasher.update(&bytes);
              let hash_result = hasher.finalize();
              let actual_hash = hash_result.iter().map(|b| format!("{:02x}", b)).collect::<String>();
              
              if actual_hash != *hash {
                  return Err(AppError::Internal(format!(
                      "Package integrity verification failed for app '{}'! Expected hash: {}, Got: {}",
                      app_id, hash, actual_hash
                  )));
              }
              println!("[Marketplace] Package integrity verified successfully for '{}' (v{})", app_id, version);
          } else {
              println!("[Marketplace] Warning: No package hash found for app '{}', skipping verification", app_id);
          }
              
          let reader = std::io::Cursor::new(bytes);
          extract_zip(reader, &sandbox_dir)?;
      } else {
          // Fallback: Look for local resources zip package
          println!("[Marketplace] Using local package fallback for '{}' (v{})", app_id, version);
          let zip_path = find_zip_package(app_id)?;
        let zip_file = std::fs::File::open(&zip_path)
            .map_err(|e| AppError::Internal(format!("Failed to open local package zip: {}", e)))?;
        extract_zip(zip_file, &sandbox_dir)?;
    }

    // 3. Insert/update locally in SQLite with version
    sqlx::query(
        "INSERT INTO user_installed_apps (user_id, app_id, version) VALUES (?, ?, ?) \
         ON CONFLICT(user_id, app_id) DO UPDATE SET version = excluded.version"
    )
    .bind(user_id)
    .bind(app_id)
    .bind(&version)
    .execute(pool)
    .await?;
    
    // 4. Queue for Cloud Sync (Encrypted)
    let job_id = uuid::Uuid::now_v7().to_string();
    let payload = serde_json::json!({
        "user_id": user_id,
        "app_id": app_id
    }).to_string();
    
    // Encrypt payload
    let (_priv, pub_key) = crate::services::crypto::get_or_generate_keypair(user_id)?;
    let encrypted_payload = crate::services::crypto::encrypt_payload(&pub_key, &payload)?;
    
    sqlx::query(
        "INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)"
    )
    .bind(job_id)
    .bind(user_id)
    .bind("INSTALL_APP")
    .bind(encrypted_payload)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn uninstall_app_impl(
    pool: &SqlitePool,
    app_dir: &std::path::Path,
    user_id: &str,
    app_id: &str,
    _jwt: &str,
) -> Result<(), AppError> {
    // 1. Delete locally from SQLite
    sqlx::query(
        "DELETE FROM user_installed_apps WHERE user_id = ? AND app_id = ?"
    )
    .bind(user_id)
    .bind(app_id)
    .execute(pool)
    .await?;

    // 2. Remove sandbox folder if wordpress-sync
    if app_id == "wordpress-sync" {
        let sandbox_dir = app_dir.join("apps").join(app_id);
        if sandbox_dir.exists() {
            std::fs::remove_dir_all(&sandbox_dir)
                .map_err(|e| AppError::Internal(format!("Failed to delete sandbox directory: {}", e)))?;
            println!("Deleted sandbox directory at {:?}", sandbox_dir);
        }
    }
    
    // 3. Queue for Cloud Sync (Encrypted)
    let job_id = uuid::Uuid::now_v7().to_string();
    let payload = serde_json::json!({
        "user_id": user_id,
        "app_id": app_id
    }).to_string();
    
    // Encrypt payload
    let (_priv, pub_key) = crate::services::crypto::get_or_generate_keypair(user_id)?;
    let encrypted_payload = crate::services::crypto::encrypt_payload(&pub_key, &payload)?;
    
    sqlx::query(
        "INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)"
    )
    .bind(job_id)
    .bind(user_id)
    .bind("UNINSTALL_APP")
    .bind(encrypted_payload)
    .execute(pool)
    .await?;

    Ok(())
}

fn find_zip_package(app_id: &str) -> Result<std::path::PathBuf, AppError> {
    let mut current = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    for _ in 0..10 {
        let test_paths = vec![
            current.join("apps/desktop/src-tauri/resources").join(format!("{}.zip", app_id)),
            current.join("src-tauri/resources").join(format!("{}.zip", app_id)),
            current.join("resources").join(format!("{}.zip", app_id)),
        ];
        for path in test_paths {
            if path.exists() {
                return Ok(path);
            }
        }
        if let Some(parent) = current.parent() {
            current = parent.to_path_buf();
        } else {
            break;
        }
    }
    Err(AppError::Internal(format!("Package {}.zip not found in workspace resources directory", app_id)))
}

fn extract_zip<R: std::io::Read + std::io::Seek>(
    reader: R,
    out_dir: &std::path::Path,
) -> Result<(), AppError> {
    let mut archive = zip::ZipArchive::new(reader)
        .map_err(|e| AppError::Internal(format!("Failed to parse zip archive: {}", e)))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| AppError::Internal(format!("Failed to read file from zip: {}", e)))?;
        
        let normalized_name = file.name().replace('\\', "/");
        if normalized_name.contains("..") {
            continue;
        }

        let outpath = out_dir.join(&normalized_name);

        if file.is_dir() || normalized_name.ends_with('/') {
            std::fs::create_dir_all(&outpath)
                .map_err(|e| AppError::Internal(format!("Failed to create folder in sandbox: {} (path: {:?})", e, outpath)))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p)
                        .map_err(|e| AppError::Internal(format!("Failed to create parent folder in sandbox: {} (path: {:?})", e, p)))?;
                }
            }
            let mut outfile = std::fs::File::create(&outpath)
                .map_err(|e| AppError::Internal(format!("Failed to create file in sandbox: {} (path: {:?})", e, outpath)))?;
            std::io::copy(&mut file, &mut outfile)
                .map_err(|e| AppError::Internal(format!("Failed to copy file to sandbox: {} (path: {:?})", e, outpath)))?;
        }
    }
    Ok(())
}
