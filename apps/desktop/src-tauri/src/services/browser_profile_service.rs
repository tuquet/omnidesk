use sqlx::SqlitePool;
use uuid::Uuid;
use crate::error::AppError;
use crate::commands::browser_profiles::{BrowserProfile, CreateBrowserProfilePayload, UpdateBrowserProfilePayload};
use std::path::PathBuf;

pub struct BrowserProfileService;

impl BrowserProfileService {
    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<BrowserProfile>, AppError> {
        let profiles = sqlx::query_as::<_, BrowserProfile>(
            r#"
            SELECT id, name, browser_type, executable_path, proxy, user_agent, fingerprint_config, data_dir_path, 
                   CAST(created_at AS TEXT) as created_at, 
                   CAST(updated_at AS TEXT) as updated_at
            FROM browser_profiles
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(profiles)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<BrowserProfile, AppError> {
        let profile = sqlx::query_as::<_, BrowserProfile>(
            r#"
            SELECT id, name, browser_type, executable_path, proxy, user_agent, fingerprint_config, data_dir_path, 
                   CAST(created_at AS TEXT) as created_at, 
                   CAST(updated_at AS TEXT) as updated_at
            FROM browser_profiles
            WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Profile {} not found", id)))?;

        Ok(profile)
    }

    pub async fn create(pool: &SqlitePool, payload: CreateBrowserProfilePayload) -> Result<BrowserProfile, AppError> {
        let id = Uuid::now_v7().to_string();
        
        sqlx::query(
            r#"
            INSERT INTO browser_profiles (id, name, browser_type, executable_path, proxy, user_agent, fingerprint_config, data_dir_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&payload.name)
        .bind(&payload.browser_type)
        .bind(&payload.executable_path)
        .bind(&payload.proxy)
        .bind(&payload.user_agent)
        .bind(&payload.fingerprint_config)
        .bind(&payload.data_dir_path)
        .execute(pool)
        .await?;

        Self::get_by_id(pool, &id).await
    }

    pub async fn update(pool: &SqlitePool, payload: UpdateBrowserProfilePayload) -> Result<BrowserProfile, AppError> {
        let result = sqlx::query(
            r#"
            UPDATE browser_profiles
            SET name = ?, browser_type = ?, executable_path = ?, proxy = ?, user_agent = ?, fingerprint_config = ?, data_dir_path = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(&payload.name)
        .bind(&payload.browser_type)
        .bind(&payload.executable_path)
        .bind(&payload.proxy)
        .bind(&payload.user_agent)
        .bind(&payload.fingerprint_config)
        .bind(&payload.data_dir_path)
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
