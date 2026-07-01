use sqlx::SqlitePool;
use tauri::{State, command};

use crate::db::models::browser_profile::{BrowserProfile, CreateBrowserProfilePayload, UpdateBrowserProfilePayload};
use crate::services::browser_profile_service::BrowserProfileService;

#[command]
pub async fn get_browser_profiles(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BrowserProfile>, String> {
    BrowserProfileService::get_all(&pool, None, None)
        .await
        .map_err(String::from)
}

#[command]
pub async fn create_browser_profile(
    payload: CreateBrowserProfilePayload,
    pool: State<'_, SqlitePool>,
) -> Result<BrowserProfile, String> {
    BrowserProfileService::create(&pool, payload)
        .await
        .map_err(String::from)
}

#[command]
pub async fn update_browser_profile(
    payload: UpdateBrowserProfilePayload,
    pool: State<'_, SqlitePool>,
) -> Result<BrowserProfile, String> {
    BrowserProfileService::update(&pool, payload)
        .await
        .map_err(String::from)
}

#[command]
pub async fn delete_browser_profile(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    BrowserProfileService::delete(&pool, &id)
        .await
        .map_err(String::from)
}

#[command]
pub async fn launch_browser_profile(
    id: String,
    pool: State<'_, SqlitePool>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    BrowserProfileService::launch(&pool, &app, &id, None)
        .await
        .map_err(String::from)
}

#[command]
pub async fn stop_browser_profile(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    BrowserProfileService::stop(&pool, &id)
        .await
        .map_err(String::from)
}

pub fn get_handlers() -> impl Fn(tauri::ipc::Invoke) -> bool {
    tauri::generate_handler![
        get_browser_profiles,
        create_browser_profile,
        update_browser_profile,
        delete_browser_profile,
        launch_browser_profile,
        stop_browser_profile,
    ]
}
