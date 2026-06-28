pub mod auth;
pub mod handlers;

use axum::{Router, routing::get, response::IntoResponse, Json};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::path::PathBuf;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
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
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health_check,
        ping,
        me,
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "profiles", description = "Browser profile management endpoints")
    )
)]
pub struct ApiDoc;

pub async fn serve(pool: SqlitePool, app_dir: PathBuf, port: u16, app_handle: AppHandle) {
    let state = AppState { 
        db: pool,
        mcp_sessions: Arc::new(RwLock::new(HashMap::new())),
        app_dir: app_dir.clone(),
        app_handle,
    };

    let app = Router::new()
        .route("/", get(|| async { axum::response::Redirect::temporary("/scalar") }))
        .merge(Scalar::with_url("/scalar", ApiDoc::openapi()))
        .route("/openapi.json", get(|| async { Json(ApiDoc::openapi()) }))
        .route("/health", get(health_check))
        .route("/ping", get(ping))
        .route("/api/me", get(me))
        // Profile App: only browser profile endpoints
        .nest("/api/browser-profiles", handlers::browser_profiles::router())
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Profile App API running on http://{}", addr);

    if let Ok(listener) = TcpListener::bind(addr).await {
        let _ = axum::serve(listener, app).await;
    } else {
        eprintln!("Failed to bind to port {}", port);
    }
}

#[utoipa::path(get, path = "/health", responses((status = 200, description = "Health status")))]
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok", "service": "omni-profile" }))
}

#[utoipa::path(get, path = "/ping", responses((status = 200, description = "Pong")))]
async fn ping() -> &'static str { "pong" }

#[utoipa::path(get, path = "/api/me", responses((status = 200, description = "User info")))]
async fn me(claims: Claims) -> impl IntoResponse {
    Json(serde_json::json!({
        "user_id": claims.user_id(),
        "email": claims.email,
        "is_admin": claims.is_admin(),
        "role": claims.role,
    }))
}
