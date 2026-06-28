use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use crate::db::models::browser_profile::BrowserProfile;
use crate::api::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_profiles).post(create_profile))
        .route("/:id", get(get_profile).put(update_profile).delete(delete_profile))
        .route("/:id/launch", post(launch_profile))
        .route("/:id/stop", post(stop_profile))
        .route("/:id/clean", post(clean_profile_storage))
        .route("/browser-engine", axum::routing::delete(delete_browser_engine))
        .route("/download-status", get(get_download_status))
        .route("/available-versions", get(get_available_versions))
        .route("/engine-status", get(get_engine_status))
}

async fn list_profiles(
    State(state): State<AppState>,
) -> Result<Json<Vec<BrowserProfile>>, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;
    
    let profiles = BrowserProfileService::get_all(pool).await
        .map_err(|e| {
            eprintln!("Error fetching profiles: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(profiles))
}

async fn create_profile(
    State(state): State<AppState>,
    Json(payload): Json<crate::db::models::browser_profile::CreateBrowserProfilePayload>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;

    let profile = BrowserProfileService::create(pool, payload).await
        .map_err(|e| {
            eprintln!("Error creating profile: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(profile))
}

async fn get_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;

    match BrowserProfileService::get_by_id(pool, &id).await {
        Ok(p) => Ok(Json(p)),
        Err(crate::error::AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("Error fetching profile: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn update_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(mut payload): Json<crate::db::models::browser_profile::UpdateBrowserProfilePayload>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;
    payload.id = id;

    match BrowserProfileService::update(pool, payload).await {
        Ok(p) => Ok(Json(p)),
        Err(crate::error::AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("Error updating profile: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn delete_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;
    
    match BrowserProfileService::delete(pool, &id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(crate::error::AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("Error deleting profile: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}


#[utoipa::path(
    post,
    path = "/api/browser-profiles/{id}/launch",
    responses(
        (status = 200, description = "Browser launched successfully")
    ),
    params(
        ("id" = String, Path, description = "Browser profile ID")
    )
)]
pub async fn launch_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let pool = &state.db;
    let app = state.app_handle.clone();
    
    use crate::services::browser_profile_service::BrowserProfileService;
    

    let _profile = match BrowserProfileService::get_by_id(pool, &id).await {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to get profile: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match BrowserProfileService::launch(pool, &app, &id).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            eprintln!("Failed to launch browser: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/browser-profiles/{id}/clean",
    tag = "profiles",
    params(
        ("id" = String, Path, description = "Profile ID")
    ),
    responses(
        (status = 200, description = "Storage cleaned"),
        (status = 404, description = "Profile not found")
    )
)]
async fn clean_profile_storage(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Result<StatusCode, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;
    let app = &state.app_handle;

    let profile = BrowserProfileService::get_by_id(pool, &id).await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let data_dir = BrowserProfileService::resolve_data_dir(app, &profile)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let zip_file = data_dir.with_extension("zip");
    
    let relative_path = &profile.data_dir_path;
    let storage_dir = crate::system::config::get_active_storage_path(app)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let run_dir = storage_dir.join("run").join(relative_path);

    if run_dir.exists() {
        let _ = crate::services::storage_optimizer::StorageOptimizer::clean_storage(&run_dir);
    } else if zip_file.exists() {
        if let Some(parent) = run_dir.parent() {
            std::fs::create_dir_all(parent).unwrap_or_default();
        }
        if crate::services::storage_optimizer::StorageOptimizer::unzip_dir(&zip_file, &run_dir).is_ok() {
            let _ = crate::services::storage_optimizer::StorageOptimizer::clean_storage(&run_dir);
            let _ = crate::services::storage_optimizer::StorageOptimizer::zip_dir(&run_dir, &zip_file);
            let _ = std::fs::remove_dir_all(&run_dir);
        }
    } else if data_dir.exists() {
        let _ = crate::services::storage_optimizer::StorageOptimizer::clean_storage(&data_dir);
    }

    Ok(StatusCode::OK)
}


#[utoipa::path(
    post,
    path = "/api/browser-profiles/{id}/stop",
    responses(
        (status = 200, description = "Browser stopped successfully"),
        (status = 404, description = "Profile not found")
    ),
    params(
        ("id" = String, Path, description = "Browser profile ID")
    )
)]
async fn stop_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    use crate::services::browser_profile_service::BrowserProfileService;
    let pool = &state.db;
    
    match BrowserProfileService::stop(pool, &id).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(crate::error::AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("Error stopping profile: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

use axum::response::sse::{Event, Sse};
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

#[utoipa::path(
    delete,
    path = "/api/browser-profiles/browser-engine",
    responses(
        (status = 200, description = "Browser engine deleted successfully")
    )
)]
pub async fn delete_browser_engine(
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    use tauri::Manager;
    let app_dir = crate::system::config::get_active_storage_path(&state.app_handle)
        .unwrap_or_else(|_| state.app_handle.path().app_data_dir().unwrap());
    
    let browser_dir = app_dir.join("browser");
    
    if browser_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&browser_dir) {
            log::error!("Failed to delete browser engine directory: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
    
    Ok(StatusCode::OK)
}

#[utoipa::path(
    get,
    path = "/api/browser-profiles/download-status",
    responses(
        (status = 200, description = "Download status stream")
    )
)]
pub async fn get_download_status(
    State(state): State<AppState>,
) -> Result<Sse<impl tokio_stream::Stream<Item = Result<Event, std::convert::Infallible>>>, StatusCode> {
    use tauri::Manager;
    let dl_state = state.app_handle.try_state::<crate::DownloadProgressState>()
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        
    let rx = dl_state.tx.subscribe();
    let stream = BroadcastStream::new(rx)
        .filter_map(|res| match res {
            Ok(progress) => {
                let json = serde_json::to_string(&progress).unwrap_or_default();
                Some(Ok(Event::default().data(json)))
            }
            Err(_) => None,
        });

    Ok(Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::new()))
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct BrowserVersion {
    pub version: String,
    pub is_downloaded: bool,
}

#[derive(serde::Serialize, utoipa::ToSchema)]
pub struct EngineStatusResponse {
    pub is_downloaded: bool,
    pub exe_path: Option<String>,
}

#[utoipa::path(
    get,
    path = "/api/browser-profiles/available-versions",
    responses(
        (status = 200, description = "List of available browser versions", body = [BrowserVersion])
    )
)]
pub async fn get_available_versions(
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<BrowserVersion>>, StatusCode> {
    let browser_type = params.get("browser_type").map(|s| s.as_str()).unwrap_or("chrome");
    
    let versions = match browser_type {
        "chrome" => vec![
            BrowserVersion { version: "130.0.6723.69".to_string(), is_downloaded: false },
            BrowserVersion { version: "129.0.6668.29".to_string(), is_downloaded: false },
        ],
        "firefox" => vec![
            BrowserVersion { version: "130.0".to_string(), is_downloaded: false },
        ],
        "webkit" => vec![
            BrowserVersion { version: "2056".to_string(), is_downloaded: false },
            BrowserVersion { version: "1944".to_string(), is_downloaded: false },
        ],
        "edge" => vec![
            BrowserVersion { version: "system".to_string(), is_downloaded: true },
        ],
        _ => vec![],
    };

    Ok(Json(versions))
}

#[utoipa::path(
    get,
    path = "/api/browser-profiles/engine-status",
    responses(
        (status = 200, description = "Status of browser engine", body = EngineStatusResponse)
    )
)]
pub async fn get_engine_status(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<EngineStatusResponse>, StatusCode> {
    use tauri::Manager;
    let browser_type = params.get("browser_type").map(|s| s.as_str()).unwrap_or("chrome");
    let version = params.get("version").map(|s| s.as_str()).unwrap_or("latest");

    let app_dir = crate::system::config::get_active_storage_path(&state.app_handle)
        .unwrap_or_else(|_| state.app_handle.path().app_data_dir().unwrap());
        
    let is_downloaded = match browser_type {
        "chrome" => {
            let v = if version == "latest" { "130.0.6723.69" } else { version };
            let exe = app_dir.join("browser").join(format!("chrome-{}", v)).join("chrome-win64").join("chrome.exe");
            exe.exists()
        },
        "firefox" => {
            let v = if version == "latest" { "130.0" } else { version };
            let exe = app_dir.join("browser").join(format!("firefox-{}", v)).join("firefox").join("firefox.exe");
            exe.exists()
        },
        "webkit" => {
            let driver_exe = app_dir.join("browser").join("playwright-driver").join("node.exe");
            driver_exe.exists()
        },
        "edge" => true,
        _ => false,
    };
    
    Ok(Json(EngineStatusResponse {
        is_downloaded,
        exe_path: None,
    }))
}

