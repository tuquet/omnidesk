use sqlx::SqlitePool;
use tauri::State;
use crate::services::preferences_service;

#[tauri::command]
pub async fn get_user_preferences(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<String, String> {
    let result = preferences_service::get_home_layout(&db, &user_id).await
        .map_err(String::from)?;

    Ok(result)
}

#[tauri::command]
pub async fn update_home_screen_order(
    user_id: String,
    home_screen_order: String,
    db: State<'_, SqlitePool>,
) -> Result<(), String> {
    preferences_service::update_home_layout(&db, &user_id, &home_screen_order).await
        .map_err(String::from)?;

    Ok(())
}
