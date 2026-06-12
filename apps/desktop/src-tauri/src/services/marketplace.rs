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
    
    let apps: Vec<Value> = res.json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse apps: {}", e)))?;
        
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

pub async fn install_app_impl(pool: &SqlitePool, user_id: &str, app_id: &str, _jwt: &str) -> Result<(), AppError> {
    // 1. Insert locally into SQLite
    sqlx::query(
        "INSERT INTO user_installed_apps (user_id, app_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
    )
    .bind(user_id)
    .bind(app_id)
    .execute(pool)
    .await?;
    
    // 2. Queue for Cloud Sync (Encrypted)
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

pub async fn uninstall_app_impl(pool: &SqlitePool, user_id: &str, app_id: &str, _jwt: &str) -> Result<(), AppError> {
    // 1. Delete locally from SQLite
    sqlx::query(
        "DELETE FROM user_installed_apps WHERE user_id = ? AND app_id = ?"
    )
    .bind(user_id)
    .bind(app_id)
    .execute(pool)
    .await?;

    
    // 2. Queue for Cloud Sync (Encrypted)
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
