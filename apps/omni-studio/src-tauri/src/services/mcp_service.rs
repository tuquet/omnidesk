use sqlx::SqlitePool;
use crate::error::AppError;
use sqlx::Row;

pub async fn get_installed_apps(pool: &SqlitePool) -> Result<Vec<String>, AppError> {
    let mut apps: Vec<String> = Vec::new();
    
    let rows = sqlx::query("SELECT DISTINCT app_id FROM user_installed_apps")
        .fetch_all(pool)
        .await?;
        
    for row in rows {
        if let Ok(app_id) = row.try_get::<String, _>("app_id") {
            apps.push(app_id);
        }
    }
    
    Ok(apps)
}

pub async fn queue_sync_command(pool: &SqlitePool, cmd: &str, target_device: &str) -> Result<String, AppError> {
    let job_id = uuid::Uuid::now_v7().to_string();
    let user_id = "mcp-system-user";
    
    let payload = serde_json::json!({
        "command": cmd,
        "target_device": target_device,
    }).to_string();
    
    let (_priv, pub_key) = omni_shared::crypto::get_or_generate_keypair(user_id)
        .map_err(|e| AppError::Internal(format!("Failed to get keypair: {:?}", e)))?;
        
    let encrypted_payload = omni_shared::crypto::encrypt_payload(&pub_key, &payload)
        .map_err(|e| AppError::Internal(format!("Failed to encrypt: {:?}", e)))?;
        
    sqlx::query("INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)")
        .bind(&job_id)
        .bind(user_id)
        .bind("SYNC_COMMAND")
        .bind(encrypted_payload)
        .execute(pool)
        .await?;
        
    Ok(job_id)
}
