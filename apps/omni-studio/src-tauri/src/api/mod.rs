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
    /// Broadcast channel for sync WS — notifies Extension of workflow changes
    pub sync_tx: tokio::sync::broadcast::Sender<handlers::sync_ws::SyncEvent>,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health_check,
        ping,
        me,
        handlers::workflows::list_workflows,
        handlers::workflows::create_workflow,
        handlers::workflows::get_workflow,
        handlers::workflows::update_workflow,
        handlers::workflows::delete_workflow,
        handlers::workflows::get_workflow_runs,
        handlers::workflows::get_run_logs,
        handlers::sync::push_workflows,
        handlers::sync::export_workflow,
        handlers::sync::import_workflow,
        handlers::sync::sync_status,
    ),
    components(
        schemas(
            crate::db::models::workflow::Workflow,
            crate::db::models::workflow::WorkflowRun,
            crate::db::models::workflow::WorkflowLog,
            crate::db::models::workflow::Schedule,
            handlers::sync::PushWorkflowsPayload,
            handlers::sync::SyncStatusResponse
        )
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "workflows", description = "Workflow management endpoints"),
        (name = "sync", description = "Sync endpoints")
    )
)]
pub struct ApiDoc;

pub async fn serve(pool: SqlitePool, app_dir: PathBuf, port: u16, app_handle: AppHandle) {
    let (sync_tx, _rx) = tokio::sync::broadcast::channel(100);
    let state = AppState { 
        db: pool,
        mcp_sessions: Arc::new(RwLock::new(HashMap::new())),
        app_dir: app_dir.clone(),
        app_handle,
        sync_tx,
    };

    let app = Router::new()
        .route("/", get(|| async { axum::response::Redirect::temporary("/scalar") }))
        .merge(Scalar::with_url("/scalar", ApiDoc::openapi()))
        .route("/openapi.json", get(|| async { Json(ApiDoc::openapi()) }))
        .route("/health", get(health_check))
        .route("/ping", get(ping))
        .route("/api/me", get(me))
        .route("/updates/latest.json", get(latest_update))
        // Workflow App: workflow CRUD + sync endpoints
        .nest("/api/automa/workflows", handlers::workflows::router())
        .nest("/api/automa/workflows/sync", handlers::sync::router())
        .nest("/api/git", handlers::git::router())
        .route("/api/automa/ws/sync", get(handlers::sync_ws::ws_sync_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Workflow App API running on http://{}", addr);

    if let Ok(listener) = TcpListener::bind(addr).await {
        let _ = axum::serve(listener, app).await;
    } else {
        eprintln!("Failed to bind to port {}", port);
    }
}

#[utoipa::path(get, path = "/health", responses((status = 200, description = "Health status")))]
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok", "service": "omni-studio" }))
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
