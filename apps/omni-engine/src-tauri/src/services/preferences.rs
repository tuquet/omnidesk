use sqlx::SqlitePool;
use crate::error::AppError;

pub async fn get_home_layout(pool: &SqlitePool, user_id: &str) -> Result<String, AppError> {
    let result: Option<String> = sqlx::query_scalar("SELECT home_screen_order FROM user_preferences WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    Ok(result.unwrap_or_else(|| "[]".to_string()))
}

pub async fn update_home_layout(pool: &SqlitePool, user_id: &str, home_screen_order: &str) -> Result<(), AppError> {
    sqlx::query("INSERT INTO user_preferences (user_id, home_screen_order) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET home_screen_order = excluded.home_screen_order, updated_at = CURRENT_TIMESTAMP")
        .bind(user_id)
        .bind(home_screen_order)
        .execute(pool)
        .await?;

    let job_id = uuid::Uuid::now_v7().to_string();
    let payload = serde_json::json!({
        "user_id": user_id,
        "home_screen_order": serde_json::from_str::<serde_json::Value>(home_screen_order).unwrap_or(serde_json::json!([]))
    });

    if let Ok((_priv_key, pub_key)) = omni_shared::crypto::get_or_generate_keypair(user_id) {
        if let Ok(encrypted_payload) = omni_shared::crypto::encrypt_payload(&pub_key, &payload.to_string()) {
            let _ = sqlx::query("INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)")
                .bind(job_id)
                .bind(user_id)
                .bind("UPDATE_PREFERENCES")
                .bind(encrypted_payload)
                .execute(pool)
                .await;
        }
    }

    Ok(())
}
