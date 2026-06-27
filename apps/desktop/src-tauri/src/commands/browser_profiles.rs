use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, FromRow};
use tauri::{State, command};

// Re-export struct for frontend compatibility
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct BrowserProfile {
    pub id: String,
    pub name: String,
    pub browser_type: String,
    pub executable_path: Option<String>,
    pub proxy: Option<String>,
    pub user_agent: Option<String>,
    pub fingerprint_config: Option<String>,
    pub data_dir_path: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateBrowserProfilePayload {
    pub name: String,
    pub browser_type: String,
    pub executable_path: Option<String>,
    pub proxy: Option<String>,
    pub user_agent: Option<String>,
    pub fingerprint_config: Option<String>,
    pub data_dir_path: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBrowserProfilePayload {
    pub id: String,
    pub name: String,
    pub browser_type: String,
    pub executable_path: Option<String>,
    pub proxy: Option<String>,
    pub user_agent: Option<String>,
    pub fingerprint_config: Option<String>,
    pub data_dir_path: String,
}

use crate::services::browser_profile_service::BrowserProfileService;
use crate::services::browser_launcher::LauncherFactory;

#[command]
pub async fn get_browser_profiles(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<BrowserProfile>, String> {
    BrowserProfileService::get_all(&pool)
        .await
        .map_err(|e| e.into())
}

#[command]
pub async fn create_browser_profile(
    payload: CreateBrowserProfilePayload,
    pool: State<'_, SqlitePool>,
) -> Result<BrowserProfile, String> {
    BrowserProfileService::create(&pool, payload)
        .await
        .map_err(|e| e.into())
}

#[command]
pub async fn update_browser_profile(
    payload: UpdateBrowserProfilePayload,
    pool: State<'_, SqlitePool>,
) -> Result<BrowserProfile, String> {
    BrowserProfileService::update(&pool, payload)
        .await
        .map_err(|e| e.into())
}

#[command]
pub async fn delete_browser_profile(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<(), String> {
    BrowserProfileService::delete(&pool, &id)
        .await
        .map_err(|e| e.into())
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
        .map_err(|e| Into::<String>::into(e))?;

    // 2. Resolve Data Dir
    let data_dir = BrowserProfileService::resolve_data_dir(&app, &profile)
        .map_err(|e| Into::<String>::into(e))?;

    // 3. Delegate to Strategy/Factory
    let launcher = LauncherFactory::create(&profile.browser_type);
    
    launcher.launch(&profile, &app, &data_dir)
        .map_err(|e| e.into())
}


