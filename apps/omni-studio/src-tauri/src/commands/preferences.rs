use crate::services::preferences_service;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_user_preferences(
    user_id: String,
    db: State<'_, SqlitePool>,
) -> Result<String, crate::error::AppError> {
    let result = preferences_service::get_home_layout(&db, &user_id).await?;

    Ok(result)
}

#[tauri::command]
pub async fn update_home_screen_order(
    user_id: String,
    home_screen_order: String,
    db: State<'_, SqlitePool>,
) -> Result<(), crate::error::AppError> {
    preferences_service::update_home_layout(&db, &user_id, &home_screen_order).await?;

    Ok(())
}
