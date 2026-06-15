use axum::{
    extract::{State, Path},
    response::IntoResponse,
    Json,
    http::HeaderMap,
};
use crate::{
    api::{AppState, auth::Claims},
    error::AppError,
    services::marketplace,
};

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
