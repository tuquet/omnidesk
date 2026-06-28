use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;
use crate::services::file_watcher::FileWatcherService;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/push", post(push_workflows))
        .route("/export/:id", get(export_workflow))
        .route("/import", post(import_workflow))
        .route("/status", get(sync_status))
}

/// Request payload for pushing workflows from the Extension
#[derive(Debug, Deserialize, ToSchema)]
pub struct PushWorkflowsPayload {
    pub workflows: Vec<Workflow>,
}

/// Response for sync status
#[derive(Debug, Serialize, ToSchema)]
pub struct SyncStatusResponse {
    pub watch_dir: String,
    pub workflow_count: usize,
    pub last_sync: Option<String>,
}

/// POST /api/automa/workflows/sync/push
/// Receives workflows from the Extension and upserts them into the database + files
#[utoipa::path(
    post,
    path = "/api/automa/workflows/sync/push",
    responses(
        (status = 200, description = "Workflows synced successfully")
    ),
    tag = "sync"
)]
async fn push_workflows(
    State(state): State<AppState>,
    Json(payload): Json<PushWorkflowsPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    let watch_dir = state.app_dir.join("automa-workflows");
    std::fs::create_dir_all(&watch_dir)
        .map_err(|e| AppError::Internal(format!("Failed to create watch dir: {}", e)))?;

    let mut upserted = 0;
    let mut synced_workflows = Vec::new();
    for workflow in &payload.workflows {
        // Upsert into SQLite
        if let Ok(wf) = WorkflowService::upsert(&state.db, workflow).await {
            // Export to file for OneDrive sync
            let _ = FileWatcherService::export_workflow_file(&watch_dir, &wf).await;
            synced_workflows.push(wf);
            upserted += 1;
        }
    }

    // Broadcast to WS clients (e.g., other connected Extensions)
    if !synced_workflows.is_empty() {
        let event = super::sync_ws::SyncEvent {
            event_type: "workflows_changed".to_string(),
            payload: serde_json::to_value(&synced_workflows).unwrap_or_default(),
        };
        let _ = state.sync_tx.send(event);
    }

    Ok(Json(serde_json::json!({
        "synced": upserted,
        "status": "ok"
    })))
}

/// GET /api/automa/workflows/sync/export/:id
/// Export a single workflow as downloadable JSON
#[utoipa::path(
    get,
    path = "/api/automa/workflows/sync/export/{id}",
    responses(
        (status = 200, description = "Workflow JSON exported")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "sync"
)]
async fn export_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Workflow>, AppError> {
    let workflow = WorkflowService::get_by_id(&state.db, &id).await?;

    // Also write to the watch directory
    let watch_dir = state.app_dir.join("automa-workflows");
    std::fs::create_dir_all(&watch_dir)
        .map_err(|e| AppError::Internal(format!("Failed to create watch dir: {}", e)))?;
    FileWatcherService::export_workflow_file(&watch_dir, &workflow).await?;

    Ok(Json(workflow))
}

/// POST /api/automa/workflows/sync/import
/// Import a workflow from JSON body
#[utoipa::path(
    post,
    path = "/api/automa/workflows/sync/import",
    responses(
        (status = 200, description = "Workflow imported")
    ),
    tag = "sync"
)]
async fn import_workflow(
    State(state): State<AppState>,
    Json(workflow): Json<Workflow>,
) -> Result<Json<Workflow>, AppError> {
    let upserted = WorkflowService::upsert(&state.db, &workflow).await?;
    Ok(Json(upserted))
}

/// GET /api/automa/workflows/sync/status
/// Returns current sync status
#[utoipa::path(
    get,
    path = "/api/automa/workflows/sync/status",
    responses(
        (status = 200, description = "Sync status")
    ),
    tag = "sync"
)]
async fn sync_status(
    State(state): State<AppState>,
) -> Result<Json<SyncStatusResponse>, AppError> {
    let watch_dir = state.app_dir.join("automa-workflows");
    let workflows = WorkflowService::get_all(&state.db).await?;

    Ok(Json(SyncStatusResponse {
        watch_dir: watch_dir.to_string_lossy().to_string(),
        workflow_count: workflows.len(),
        last_sync: None, // TODO: track last sync timestamp
    }))
}
