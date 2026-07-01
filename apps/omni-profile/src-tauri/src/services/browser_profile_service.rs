use sqlx::SqlitePool;
use uuid::Uuid;
use crate::error::AppError;
use crate::db::models::browser_profile::{BrowserProfile, CreateBrowserProfilePayload, UpdateBrowserProfilePayload};
use std::path::PathBuf;

pub struct BrowserProfileService;

impl BrowserProfileService {
    pub async fn get_all(pool: &SqlitePool, sort_by: Option<&str>, sort_order: Option<&str>) -> Result<Vec<BrowserProfile>, AppError> {
        let valid_columns = ["name", "os", "browser_type", "status", "last_used_at", "created_at", "updated_at"];
        let order_col = sort_by.unwrap_or("created_at");
        let order_col = if valid_columns.contains(&order_col) { order_col } else { "created_at" };
        
        let order_dir = sort_order.unwrap_or("desc").to_uppercase();
        let order_dir = if order_dir == "ASC" { "ASC" } else { "DESC" };

        let query = format!(
            r#"
            SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version
            FROM browser_profiles
            ORDER BY {} {}
            "#,
            order_col, order_dir
        );

        let mut profiles = sqlx::query_as::<_, BrowserProfile>(&query)
        .fetch_all(pool)
        .await?;

        for p in &mut profiles {
            let _ = Self::sync_status(pool, p).await;
        }

        Ok(profiles)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<BrowserProfile, AppError> {
        let mut profile = sqlx::query_as::<_, BrowserProfile>(
            r#"
            SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version
            FROM browser_profiles
            WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Profile {} not found", id)))?;

        let _ = Self::sync_status(pool, &mut profile).await;

        Ok(profile)
    }

    pub async fn sync_status(pool: &SqlitePool, profile: &mut BrowserProfile) -> Result<(), AppError> {
        if profile.status.as_deref() == Some("RUNNING") {
            if let Some(pid) = profile.pid {
                let mut sys = sysinfo::System::new_all();
                sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
                
                let sys_pid = sysinfo::Pid::from_u32(pid as u32);
                let mut is_alive = false;
                
                if let Some(process) = sys.process(sys_pid) {
                    let name = process.name().to_string_lossy().to_lowercase();
                    // Avoid PID collision by checking if process is actually a browser
                    if name.contains("chrome") || name.contains("msedge") || name.contains("firefox") || name.contains("chromium") {
                        is_alive = true;
                    }
                }
                
                if !is_alive {
                    profile.status = Some("IDLE".to_string());
                    profile.pid = None;
                    
                    sqlx::query("UPDATE browser_profiles SET status = 'IDLE', pid = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                        .bind(&profile.id)
                        .execute(pool)
                        .await?;
                }
            } else {
                profile.status = Some("IDLE".to_string());
                sqlx::query("UPDATE browser_profiles SET status = 'IDLE', pid = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .bind(&profile.id)
                    .execute(pool)
                    .await?;
            }
        }
        Ok(())
    }

    pub fn monitor_process(pool: SqlitePool, app: tauri::AppHandle, profile_id: String, pid: u32, data_dir_path: String) {
        tokio::spawn(async move {
            let mut sys = sysinfo::System::new_all();
            let sys_pid = sysinfo::Pid::from_u32(pid);
            
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
                
                let mut is_alive = false;
                if let Some(process) = sys.process(sys_pid) {
                    let name = process.name().to_string_lossy().to_lowercase();
                    if name.contains("chrome") || name.contains("msedge") || name.contains("firefox") || name.contains("chromium") {
                        is_alive = true;
                    }
                }
                
                if !is_alive {
                    let _ = sqlx::query("UPDATE browser_profiles SET status = 'IDLE', pid = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
                        .bind(&profile_id)
                        .execute(&pool)
                        .await;
                    
                    let data_dir = std::path::PathBuf::from(&data_dir_path);
                    let zip_path = std::path::PathBuf::from(format!("{}.zip", data_dir.display()));
                    
                    if let Err(e) = crate::services::storage_optimizer::StorageOptimizer::clean_storage(&data_dir) {
                        log::error!("Failed to clean storage: {:?}", e);
                    }
                    if let Err(e) = crate::services::storage_optimizer::StorageOptimizer::zip_dir(&data_dir, &zip_path) {
                        log::error!("Failed to zip directory: {:?}", e);
                    }
                    
                    if let Err(e) = std::fs::remove_dir_all(&data_dir) {
                        log::error!("Failed to remove data dir: {}", e);
                    }
                    
                    use tauri::Emitter;
                    let _ = app.emit("profile-status-changed", serde_json::json!({
                        "id": profile_id,
                        "status": "IDLE"
                    }));
                    
                    break;
                }
            }
        });
    }

    pub async fn create(pool: &SqlitePool, payload: CreateBrowserProfilePayload) -> Result<BrowserProfile, AppError> {
        let id = Uuid::now_v7().to_string();
        let os = payload.os.unwrap_or_else(|| "win".to_string());
        let browser_type = payload.browser_type.unwrap_or_else(|| "chrome".to_string());
        let status = payload.status.unwrap_or_else(|| "IDLE".to_string());
        
        sqlx::query(
            r#"
            INSERT INTO browser_profiles (id, name, group_id, os, browser_type, data_dir_path, status, notes, tags, browser_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&payload.name)
        .bind(&payload.group_id)
        .bind(&os)
        .bind(&browser_type)
        .bind(&payload.data_dir_path)
        .bind(&status)
        .bind(&payload.notes)
        .bind(&payload.tags)
        .bind(&payload.browser_version)
        .execute(pool)
        .await?;

        Self::get_by_id(pool, &id).await
    }

    pub async fn update(pool: &SqlitePool, payload: UpdateBrowserProfilePayload) -> Result<BrowserProfile, AppError> {
        let result = sqlx::query(
            r#"
            UPDATE browser_profiles
            SET name = ?, group_id = ?, os = ?, browser_type = ?, data_dir_path = ?, status = ?, notes = ?, tags = ?, browser_version = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(&payload.name)
        .bind(&payload.group_id)
        .bind(&payload.os)
        .bind(&payload.browser_type)
        .bind(&payload.data_dir_path)
        .bind(&payload.status)
        .bind(&payload.notes)
        .bind(&payload.tags)
        .bind(&payload.browser_version)
        .bind(&payload.id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Profile {} not found", payload.id)));
        }

        Self::get_by_id(pool, &payload.id).await
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        let result = sqlx::query(
            r#"
            DELETE FROM browser_profiles
            WHERE id = ?
            "#
        )
        .bind(id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Profile {} not found", id)));
        }

        Ok(())
    }

    pub async fn stop(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        let profile = Self::get_by_id(pool, id).await?;
        
        if let Some(pid) = profile.pid {
            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("taskkill")
                    .args(["/F", "/T", "/PID", &pid.to_string()])
                    .output();
            }
            #[cfg(not(target_os = "windows"))]
            {
                let _ = std::process::Command::new("kill")
                    .args(["-9", &pid.to_string()])
                    .output();
            }
        }
        
        sqlx::query("UPDATE browser_profiles SET status = 'IDLE', pid = NULL, cdp_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
            
        Ok(())
    }

    pub async fn launch(pool: &SqlitePool, app: &tauri::AppHandle, id: &str, startup_url: Option<&str>) -> Result<(), AppError> {
        let profile = Self::get_by_id(pool, id).await?;
        
        use crate::services::browser_launcher::LauncherFactory;
        let browser_type = profile.browser_type.clone().unwrap_or_else(|| "chrome".to_string());
        let launcher = LauncherFactory::create(&browser_type);
        let data_dir = Self::resolve_data_dir(app, &profile)?;
        let zip_path = std::path::PathBuf::from(format!("{}.zip", data_dir.display()));
        
        if data_dir.exists() {
            log::warn!("Found existing unzipped data dir, assuming recovery from unexpected crash: {:?}", data_dir);
        } else if zip_path.exists() {
            let _ = sqlx::query("UPDATE browser_profiles SET status = 'PREPARING' WHERE id = ?").bind(id).execute(pool).await;
            use tauri::Emitter;
            let _ = app.emit("profile-status-changed", serde_json::json!({
                "id": id,
                "status": "PREPARING"
            }));
            
            if let Err(e) = crate::services::storage_optimizer::StorageOptimizer::unzip_dir(&zip_path, &data_dir) {
                log::error!("Failed to unzip profile: {:?}", e);
            }
        } else {
            std::fs::create_dir_all(&data_dir)
                .map_err(|e| crate::error::AppError::Internal(format!("Failed to create data dir: {}", e)))?;
        }
        
        let pid = launcher.launch(&profile, app, &data_dir, startup_url).await?;
        
        let _ = sqlx::query("UPDATE browser_profiles SET status = 'RUNNING', pid = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(pid as i32)
            .bind(id)
            .execute(pool)
            .await?;
            
        Self::monitor_process(pool.clone(), app.clone(), id.to_string(), pid, data_dir.to_string_lossy().to_string());
        
        Ok(())
    }

    pub fn resolve_data_dir(app: &tauri::AppHandle, profile: &BrowserProfile) -> Result<PathBuf, AppError> {
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        let data_dir = if profile.data_dir_path.contains(":") || profile.data_dir_path.starts_with("/") {
            std::path::PathBuf::from(&profile.data_dir_path)
        } else {
            app_dir.join(&profile.data_dir_path)
        };

        Ok(data_dir)
    }
}
