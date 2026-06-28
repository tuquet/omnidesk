use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;
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
    let pool = &state.db;
    let profiles = sqlx::query_as::<_, BrowserProfile>(
        r#"
        SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version
        FROM browser_profiles
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        eprintln!("Error fetching profiles: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(profiles))
}

async fn create_profile(
    State(state): State<AppState>,
    Json(mut payload): Json<BrowserProfile>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    let id = Uuid::now_v7().to_string();
    payload.id = id.clone();
    
    // Set defaults if missing
    if payload.os.is_none() { payload.os = Some("win".to_string()); }
    if payload.browser_type.is_none() { payload.browser_type = Some("chrome".to_string()); }
    if payload.status.is_none() { payload.status = Some("IDLE".to_string()); }

    sqlx::query(
        r#"
        INSERT INTO browser_profiles (id, name, group_id, os, browser_type, data_dir_path, status, notes, tags, browser_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&payload.id)
    .bind(&payload.name)
    .bind(&payload.group_id)
    .bind(&payload.os)
    .bind(&payload.browser_type)
    .bind(&payload.data_dir_path)
    .bind(&payload.status)
    .bind(&payload.notes)
    .bind(&payload.tags)
    .bind(&payload.browser_version)
    .execute(pool)
    .await
    .map_err(|e| {
        eprintln!("Error creating profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(payload))
}

async fn get_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    let profile = sqlx::query_as::<_, BrowserProfile>(
        r#"
        SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version
        FROM browser_profiles
        WHERE id = ?
        "#
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        eprintln!("Error fetching profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match profile {
        Some(p) => Ok(Json(p)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<BrowserProfile>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    
    sqlx::query(
        r#"
        UPDATE browser_profiles
        SET name = ?, group_id = ?, os = ?, browser_type = ?, data_dir_path = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#
    )
    .bind(&payload.name)
    .bind(&payload.group_id)
    .bind(&payload.os)
    .bind(&payload.browser_type)
    .bind(&payload.data_dir_path)
    .bind(&payload.status)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| {
        eprintln!("Error updating profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    get_profile(State(state), Path(id)).await
}

async fn delete_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let pool = &state.db;
    
    sqlx::query("DELETE FROM browser_profiles WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            eprintln!("Error deleting profile: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
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
    use crate::services::browser_launcher::LauncherFactory;

    let profile = match BrowserProfileService::get_by_id(pool, &id).await {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to get profile: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let data_dir = match BrowserProfileService::resolve_data_dir(&app, &profile) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Failed to resolve data dir: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let browser_type = profile.browser_type.clone().unwrap_or_else(|| "chrome".to_string());
    let launcher = LauncherFactory::create(&browser_type);
    
    let launch_result = launcher.launch(&profile, &app, &data_dir);
    drop(launcher);
    
    match launch_result {
        Ok(pid) => {
            let _ = sqlx::query("UPDATE browser_profiles SET status = 'RUNNING', pid = ? WHERE id = ?")
                .bind(pid as i32)
                .bind(&id)
                .execute(pool)
                .await;
            BrowserProfileService::monitor_process(pool.clone(), app.clone(), id.clone(), pid);
            Ok(StatusCode::OK)
        },
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
        if let Ok(_) = crate::services::storage_optimizer::StorageOptimizer::unzip_dir(&zip_file, &run_dir) {
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
    let pool = &state.db;
    let profile = sqlx::query_as::<_, BrowserProfile>(
        "SELECT id, name, group_id, os, browser_type, data_dir_path, status, CAST(last_used_at AS TEXT) as last_used_at, CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at, notes, tags, pid, cdp_url, browser_version FROM browser_profiles WHERE id = ?"
    ).bind(&id).fetch_optional(pool).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let profile = match profile {
        Some(p) => p,
        None => return Err(StatusCode::NOT_FOUND),
    };
    
    if let Some(pid) = profile.pid {
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = std::process::Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
    }
    
    sqlx::query("UPDATE browser_profiles SET status = 'IDLE', pid = NULL, cdp_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(StatusCode::OK)
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

