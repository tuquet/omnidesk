use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
    http::HeaderMap,
    routing::{get, post},
    Router,
};
use std::fs;
use std::path::PathBuf;
use serde_json::Value;

use crate::{
    api::{AppState, auth::Claims},
    error::AppError,
    services::marketplace,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_apps))
        .route("/local", get(get_local_apps))
        .route("/installed", get(get_installed_apps))
        .route("/installed-details", get(get_installed_details))
        .route("/install/:id", post(install_app).delete(uninstall_app))
}


/// Fetch all apps from the marketplace (Cloud Supabase)
#[utoipa::path(
    get,
    path = "/api/apps",
    responses(
        (status = 200, description = "Returns all marketplace apps")
    )
)]
pub async fn get_apps() -> Result<impl IntoResponse, AppError> {
    let apps = marketplace::get_marketplace_apps().await?;
    Ok(Json(apps))
}

/// Fetch installed apps for the current user
#[utoipa::path(
    get,
    path = "/api/apps/installed",
    responses(
        (status = 200, description = "Returns list of installed app IDs")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn get_installed_apps(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<impl IntoResponse, AppError> {
    let installed = marketplace::get_installed_apps(&state.db, claims.user_id()).await?;
    Ok(Json(installed))
}

/// Fetch installed apps for the current user with versions
#[utoipa::path(
    get,
    path = "/api/apps/installed-details",
    responses(
        (status = 200, description = "Returns list of installed apps with versions")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn get_installed_details(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<impl IntoResponse, AppError> {
    let installed = marketplace::get_installed_details(&state.db, claims.user_id()).await?;
    Ok(Json(installed))
}

fn extract_jwt(headers: &HeaderMap) -> Result<String, AppError> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .ok_or_else(|| AppError::Unauthorized("Missing token".to_string()))
}

/// Install an app for the current user
#[utoipa::path(
    post,
    path = "/api/apps/install/{id}",
    responses(
        (status = 200, description = "App installed successfully"),
        (status = 401, description = "Unauthorized")
    ),
    params(
        ("id" = String, Path, description = "App ID to install")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn install_app(
    State(state): State<AppState>,
    headers: HeaderMap,
    claims: Claims,
    Path(app_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let jwt = extract_jwt(&headers)?;
    marketplace::install_app_impl(&state.db, &state.app_dir, claims.user_id(), &app_id, &jwt).await?;
    Ok(Json(serde_json::json!({ "status": "success", "app_id": app_id })))
}

/// Uninstall an app for the current user
#[utoipa::path(
    delete,
    path = "/api/apps/install/{id}",
    responses(
        (status = 200, description = "App uninstalled successfully"),
        (status = 401, description = "Unauthorized")
    ),
    params(
        ("id" = String, Path, description = "App ID to uninstall")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn uninstall_app(
    State(state): State<AppState>,
    headers: HeaderMap,
    claims: Claims,
    Path(app_id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let jwt = extract_jwt(&headers)?;
    marketplace::uninstall_app_impl(&state.db, &state.app_dir, claims.user_id(), &app_id, &jwt).await?;
    Ok(Json(serde_json::json!({ "status": "success", "app_id": app_id })))
}


/// Fetch local installed apps
#[utoipa::path(
    get,
    path = "/api/apps/local",
    responses(
        (status = 200, description = "Returns list of local apps")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn get_local_apps(
    State(state): State<AppState>,
    _claims: Claims,
) -> Result<impl IntoResponse, AppError> {
    let mut apps = Vec::new();
    
    let installed_apps_dir = state.app_dir.join("InstalledApps");
        
    if installed_apps_dir.exists() {
        if let Ok(entries) = fs::read_dir(installed_apps_dir) {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if path.is_dir() {
                        let manifest_path = path.join("manifest.json");
                        if manifest_path.exists() {
                            if let Ok(content) = fs::read_to_string(&manifest_path) {
                                if let Ok(json) = serde_json::from_str::<Value>(&content) {
                                    apps.push(json);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // IN DEVELOPMENT: Also read from the monorepo's `apps/` folder.
    #[cfg(debug_assertions)]
    {
        let workspace_apps_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../apps");
        if workspace_apps_dir.exists() {
            if let Ok(entries) = fs::read_dir(workspace_apps_dir) {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_dir() {
                            let manifest_path = path.join("manifest.json");
                            if manifest_path.exists() {
                                if let Ok(content) = fs::read_to_string(&manifest_path) {
                                    if let Ok(mut json) = serde_json::from_str::<Value>(&content) {
                                        // Inject local dev path to indicate it's a workspace app
                                        if let Some(obj) = json.as_object_mut() {
                                            obj.insert("devPath".to_string(), Value::String(path.to_string_lossy().to_string()));
                                        }
                                        apps.push(json);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(Json(apps))
}
