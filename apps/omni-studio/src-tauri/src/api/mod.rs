pub mod auth;
pub mod handlers;

use axum::{response::IntoResponse, routing::get, Json, Router};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::path::PathBuf;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

use auth::Claims;

use std::{collections::HashMap, sync::Arc};
use tauri::AppHandle;
use tokio::sync::{mpsc, RwLock};

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub mcp_sessions: Arc<RwLock<HashMap<String, mpsc::Sender<serde_json::Value>>>>,
    pub app_dir: PathBuf,
    pub app_handle: AppHandle,
    /// Broadcast channel for sync WS — notifies Extension of workflow changes
    pub sync_tx: tokio::sync::broadcast::Sender<handlers::sync_ws::SyncEvent>,
    /// Broadcast channel for automa WS — notifies Extension to execute workflows
    pub automa_ws_tx: tokio::sync::broadcast::Sender<omni_shared::automa::AutomaEvent>,
    pub active_sync_connections: Arc<std::sync::atomic::AtomicUsize>,
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
        handlers::workflows::delete_workflow_run,
        handlers::workflows::delete_all_workflow_runs,
        handlers::workflows::get_run_logs,
        handlers::sync::push_workflows,
        handlers::sync::export_workflow,
        handlers::sync::import_workflow,
        handlers::sync::sync_status,
        handlers::sync::sync_local,
    ),
    components(
        schemas(
            crate::db::models::workflow::Workflow,
            crate::db::models::workflow::WorkflowRun,
            crate::db::models::workflow::WorkflowLog,
            crate::db::models::workflow::Schedule,
            handlers::sync::PushWorkflowsPayload,
            handlers::sync::SyncStatusResponse,
            handlers::sync::SyncLocalPayload,
            omni_shared::automa::workflow::WorkflowPayload,
            omni_shared::automa::workflow::WorkflowParameter,
            omni_shared::automa::workflow::WorkflowTrigger,
            omni_shared::automa::workflow::DrawflowNodeData,
            omni_shared::automa::workflow::DrawflowNode,
            omni_shared::automa::workflow::DrawflowEdge,
              omni_shared::automa::workflow::Folder,
              omni_shared::automa::logs::LogItem,
              omni_shared::automa::logs::LogHistory,
              omni_shared::automa::logs::LogCtxData,
              omni_shared::automa::logs::LogData,
              omni_shared::automa::storage::TableItem,
              omni_shared::automa::storage::TableData,
              omni_shared::automa::storage::Variable,
              omni_shared::automa::storage::Credential,
            omni_shared::automa::workflow::DrawflowData,
            omni_shared::automa::workflow::TriggerData
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
    let mcp_sessions = Arc::new(RwLock::new(HashMap::new()));
    let (sync_tx, _rx) = tokio::sync::broadcast::channel(100);
    let (automa_ws_tx, _) = tokio::sync::broadcast::channel(100);

    let state = AppState {
        db: pool.clone(),
        mcp_sessions,
        app_dir: app_dir.clone(),
        app_handle,
        sync_tx: sync_tx.clone(),
        automa_ws_tx,
        active_sync_connections: Arc::new(std::sync::atomic::AtomicUsize::new(0)),
    };



    let app = Router::new()
        .route(
            "/",
            get(|| async { axum::response::Redirect::temporary("/scalar") }),
        )
        .merge(Scalar::with_url("/scalar", ApiDoc::openapi()))
        .route("/openapi.json", get(|| async { Json(ApiDoc::openapi()) }))
        .route("/health", get(health_check))
        .route("/ping", get(ping))
        .route("/api/me", get(me))
        .route("/updates/latest.json", get(latest_update))
        // Workflow App: workflow CRUD + sync endpoints
        .nest("/api/automa/workflows", handlers::workflows::router())
        .nest("/api/workflows", handlers::workflows::router()) // Alias for Automa Extension
        .nest("/api/me/workflows", handlers::workflows::router()) // Alias for Automa Extension's /me/workflows
        .nest("/api/mcp", handlers::mcp::router())
        .nest("/api/git", handlers::git::router())
        .nest("/api/automa", handlers::automa::router())
        .route(
            "/api/automa/ws/sync",
            get(handlers::sync_ws::ws_sync_handler),
        )
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
async fn ping() -> &'static str {
    "pong"
}

#[utoipa::path(get, path = "/api/me", responses((status = 200, description = "User info")))]
async fn me(claims: Option<Claims>) -> impl IntoResponse {
    if let Some(claims) = claims {
        Json(serde_json::json!({
            "user_id": claims.user_id(),
            "email": claims.email,
            "is_admin": claims.is_admin(),
            "role": claims.role,
        }))
        .into_response()
    } else {
        // Dummy local user for Automa Extension so it bypasses auth
        Json(serde_json::json!({
            "user_id": "local-studio-user",
            "email": "local@omnidesk.app",
            "is_admin": true,
            "role": "ADMIN",
        }))
        .into_response()
    }
}

#[utoipa::path(
    get,
    path = "/updates/latest.json",
    responses(
        (status = 200, description = "Returns latest update info for dev")
    )
)]
async fn latest_update() -> impl IntoResponse {
    (axum::http::StatusCode::NO_CONTENT, "")
}
