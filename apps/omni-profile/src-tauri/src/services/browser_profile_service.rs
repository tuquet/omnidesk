use sqlx::SqlitePool;
use uuid::Uuid;
use crate::error::AppError;
use crate::db::models::browser_profile::{BrowserProfile, CreateBrowserProfilePayload, UpdateBrowserProfilePayload};
use std::path::PathBuf;

pub struct BrowserProfileService;

impl BrowserProfileService {
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<BrowserProfile>, AppError> {
        let mut profiles = sqlx::query_as::<_, BrowserProfile>(
            r#"
            SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version
            FROM browser_profiles
            ORDER BY created_at DESC
            "#
        )
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

    pub fn monitor_process(pool: SqlitePool, app: tauri::AppHandle, profile_id: String, pid: u32) {
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

    pub async fn launch(pool: &SqlitePool, app: &tauri::AppHandle, id: &str) -> Result<(), AppError> {
        let profile = Self::get_by_id(pool, id).await?;
        
        use crate::services::browser_launcher::LauncherFactory;
        let browser_type = profile.browser_type.clone().unwrap_or_else(|| "chrome".to_string());
        let launcher = LauncherFactory::create(&browser_type);
        let data_dir = Self::resolve_data_dir(app, &profile)?;
        
        let pid = launcher.launch(&profile, app, &data_dir).await?;
        
        let _ = sqlx::query("UPDATE browser_profiles SET status = 'RUNNING', pid = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(pid as i32)
            .bind(id)
            .execute(pool)
            .await?;
            
        Self::monitor_process(pool.clone(), app.clone(), id.to_string(), pid);
        
        Ok(())
    }

    pub fn resolve_data_dir(app: &tauri::AppHandle, profile: &BrowserProfile) -> Result<PathBuf, AppError> {
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        let data_dir = if profile.data_dir_path.contains(":") || profile.data_dir_path.starts_with("/") {
            PathBuf::from(&profile.data_dir_path)
        } else {
            app_dir.join(&profile.data_dir_path)
        };

        std::fs::create_dir_all(&data_dir)
            .map_err(|e| AppError::Internal(format!("Failed to create data dir: {}", e)))?;

        Ok(data_dir)
    }
}
