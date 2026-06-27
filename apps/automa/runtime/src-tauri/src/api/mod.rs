pub mod auth;
pub mod handlers;

use axum::{Router, routing::{get, post}, response::IntoResponse, Json};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::path::PathBuf;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

use auth::Claims;

use std::{collections::HashMap, sync::Arc};
use tokio::sync::{mpsc, RwLock};
use tauri::AppHandle;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub mcp_sessions: Arc<RwLock<HashMap<String, mpsc::Sender<serde_json::Value>>>>,
    pub app_dir: PathBuf,
    pub app_handle: AppHandle,
    pub automa_ws_tx: tokio::sync::broadcast::Sender<handlers::automa::AutomaEvent>,
    /// Cron scheduler for automated workflow execution (None if startup failed)
    pub scheduler: Option<crate::services::scheduler::SchedulerService>,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health_check,
        ping,
        latest_update,
        me,
        handlers::apps::get_apps,
        handlers::apps::get_installed_apps,
        handlers::apps::get_installed_details,
        handlers::apps::install_app,
        handlers::apps::uninstall_app
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "auth", description = "Authenticated endpoints"),
        (name = "apps", description = "Marketplace apps endpoints")
    )
)]
pub struct ApiDoc;

pub async fn serve(pool: SqlitePool, app_dir: PathBuf, port: u16, app_handle: AppHandle) {
    let (automa_ws_tx, _rx) = tokio::sync::broadcast::channel(100);

    // Start the cron scheduler
    let scheduler = match crate::services::scheduler::SchedulerService::start(
        pool.clone(),
        app_handle.clone(),
        automa_ws_tx.clone()
    ).await {
        Ok(s) => {
            println!("[Runtime] Scheduler started successfully");
            Some(s)
        }
        Err(e) => {
            eprintln!("[Runtime] Failed to start scheduler: {:?}", e);
            None
        }
    };

    let state = AppState { 
        db: pool,
        mcp_sessions: Arc::new(RwLock::new(HashMap::new())),
        app_dir: app_dir.clone(),
        app_handle,
        automa_ws_tx,
        scheduler,
    };

    let apps_sandbox_dir = app_dir.join("apps");
    if let Err(e) = std::fs::create_dir_all(&apps_sandbox_dir) {
        eprintln!("Failed to create apps sandbox directory: {}", e);
    }

    let app = Router::new()
        .route("/", get(|| async { axum::response::Redirect::temporary("/scalar") }))
        .merge(Scalar::with_url("/scalar", ApiDoc::openapi()))
        .route("/openapi.json", get(|| async { Json(ApiDoc::openapi()) }))
        .route("/health", get(health_check))
        .route("/ping", get(ping))
        .route("/updates/latest.json", get(latest_update))
        .route("/api/me", get(me))
        .route("/api/apps", get(handlers::apps::get_apps))
        .route("/api/apps/installed", get(handlers::apps::get_installed_apps))
        .route("/api/apps/installed-details", get(handlers::apps::get_installed_details))
        .route("/api/apps/install/:id", post(handlers::apps::install_app).delete(handlers::apps::uninstall_app))
        .nest("/api/browser-profiles", handlers::browser_profiles::router())
        .nest("/api/automa", handlers::automa::router())
        .nest("/api/automa/workflows", handlers::workflows::router())
        .nest("/api/automa/schedules", handlers::schedules::router())
        .route("/mcp/sse", get(handlers::mcp::mcp_sse))
        .route("/mcp/messages", post(handlers::mcp::mcp_messages))
        .nest_service("/apps", ServeDir::new(apps_sandbox_dir))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("API Server running on http://{}", addr);

    if let Ok(listener) = TcpListener::bind(addr).await {
        let _ = axum::serve(listener, app).await;
    } else {
        eprintln!("Failed to bind to port {}", port);
    }
}

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Returns health status of the API")
    )
)]
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "omnidesk-backend"
    }))
}

#[utoipa::path(
    get,
    path = "/ping",
    responses(
        (status = 200, description = "Returns pong")
    )
)]
async fn ping() -> &'static str {
    "pong"
}

#[utoipa::path(
    get,
    path = "/updates/latest.json",
    responses(
        (status = 200, description = "Returns latest update info for dev")
    )
)]
async fn latest_update() -> impl IntoResponse {
    Json(serde_json::json!({
        "version": "0.1.1",
        "notes": "Test update from Dev Server",
        "pub_date": chrono::Utc::now().to_rfc3339(),
        "platforms": {
            "windows-x86_64": {
                "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVSdEw0U1Avc1JmNnBCbXNRb2QzNVRzWmlqUThlSWl6K3k0NllZVk10OUhPMnhyTElhK0E4aFFzTTVNTHBVT2pYOG90ZlRYak5mZExvWEdKSUh5am1kKzBHTTRKdjFldGdzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzE4MDI3MzQ5CWZpbGU6dXBkYXRlLnppcApaNklYcml3Vzlkd3J0N240aUVQakc2M0hCRWkyRVZBTnI5Mzl3YkoxSU03U3N6ckl2d2QvMnlGcnI0UldGQUcwUWR3a2JWMk05VHJlSHBBTVBNek5CQT09Cg==",
                "url": "http://127.0.0.1:1424/downloads/update.zip"
            }
        }
    }))
}

/// Protected: Returns the authenticated user's info from their JWT claims.
#[utoipa::path(
    get,
    path = "/api/me",
    responses(
        (status = 200, description = "Returns authenticated user info"),
        (status = 401, description = "Unauthorized — missing or invalid token")
    )
)]
async fn me(claims: Claims) -> impl IntoResponse {
    Json(serde_json::json!({
        "user_id": claims.user_id(),
        "email": claims.email,
        "is_admin": claims.is_admin(),
        "role": claims.role,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn export_openapi_json() {
        let doc = ApiDoc::openapi();
        let json = doc.to_pretty_json().expect("Failed to serialize OpenAPI spec");
        fs::write("../../../openapi.json", json).expect("Failed to write openapi.json");
    }
}
