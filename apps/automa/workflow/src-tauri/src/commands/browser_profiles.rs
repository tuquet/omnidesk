use serde::Deserialize;
use sqlx::SqlitePool;
use tauri::{State, command};

use crate::db::models::browser_profile::BrowserProfile;
use crate::services::browser_profile_service::BrowserProfileService;
use crate::services::browser_launcher::LauncherFactory;

#[derive(Debug, Deserialize)]
pub struct CreateBrowserProfilePayload {
    pub name: String,
    pub browser_type: Option<String>,
    pub data_dir_path: String,
    pub group_id: Option<String>,
    pub os: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBrowserProfilePayload {
    pub id: String,
    pub name: String,
    pub browser_type: Option<String>,
    pub data_dir_path: String,
    pub group_id: Option<String>,
    pub os: Option<String>,
    pub status: Option<String>,
}

#[command]
pub async fn get_browser_profiles(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BrowserProfile>, String> {
    BrowserProfileService::get_all(&pool)
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
    // 1. Get profile from service
    let profile = BrowserProfileService::get_by_id(&pool, &id)
        .await
        .map_err(String::from)?;

    // 2. Resolve Data Dir
    let data_dir = BrowserProfileService::resolve_data_dir(&app, &profile)
        .map_err(String::from)?;

    // 3. Delegate to Strategy/Factory
    let browser_type = profile.browser_type.clone().unwrap_or_else(|| "chrome".to_string());
    let launcher = LauncherFactory::create(&browser_type);
    
    // We may need to map BrowserProfile to the old struct expected by launcher,
    // or update LauncherFactory to accept our new BrowserProfile model.
    launcher.launch(&profile, &app, &data_dir)
        .map_err(String::from)
}
