use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_user_preferences(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<String, String> {
    let result: Option<String> = sqlx::query_scalar("SELECT home_screen_order FROM user_preferences WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(&*db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.unwrap_or_else(|| "[]".to_string()))
}

#[tauri::command]
pub async fn update_home_screen_order(
    user_id: String,
    home_screen_order: String,
    db: State<'_, SqlitePool>,
) -> Result<(), String> {
    sqlx::query("INSERT INTO user_preferences (user_id, home_screen_order) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET home_screen_order = excluded.home_screen_order, updated_at = CURRENT_TIMESTAMP")
        .bind(&user_id)
        .bind(&home_screen_order)
        .execute(&*db)
        .await
        .map_err(|e| e.to_string())?;

    let job_id = uuid::Uuid::now_v7().to_string();
    let payload = serde_json::json!({
        "user_id": user_id,
        "home_screen_order": serde_json::from_str::<serde_json::Value>(&home_screen_order).unwrap_or(serde_json::json!([]))
    });

    if let Ok((priv_key, pub_key)) = crate::services::crypto::get_or_generate_keypair(&user_id) {
        if let Ok(encrypted_payload) = crate::services::crypto::encrypt_payload(&pub_key, &payload.to_string()) {
            let _ = sqlx::query("INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)")
                .bind(job_id)
                .bind(&user_id)
                .bind("UPDATE_PREFERENCES")
                .bind(encrypted_payload)
                .execute(&*db)
                .await;
        }
    }

    Ok(())
}
