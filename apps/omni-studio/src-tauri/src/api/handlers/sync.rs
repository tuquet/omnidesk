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
        .route("/local", post(sync_local))
}

/// Request payload for pushing workflows from the Extension
#[derive(Debug, Deserialize, ToSchema)]
pub struct PushWorkflowsPayload {
    pub workflows: Vec<Workflow>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SyncLocalPayload {
    pub folder_path: String,
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
    let watch_dir = state.app_dir.join("workflows");
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
    let watch_dir = state.app_dir.join("workflows");
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
    Json(payload): Json<omni_shared::automa::workflow::WorkflowPayload>,
) -> Result<Json<Workflow>, AppError> {
    let workflow: Workflow = payload.into();
    let upserted = WorkflowService::upsert(&state.db, &workflow).await?;
    let watch_dir = state.app_dir.join("workflows");
    let _ = std::fs::create_dir_all(&watch_dir);
    let _ = crate::services::file_watcher::FileWatcherService::export_workflow_file(&watch_dir, &upserted).await;
    
    // Broadcast to Extension that there's a new workflow
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflows_changed".to_string(),
        payload: serde_json::json!([upserted]),
    };
    let _ = state.sync_tx.send(event);

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
    let watch_dir = state.app_dir.join("workflows");
    let workflows = WorkflowService::get_all(&state.db).await?;

    Ok(Json(SyncStatusResponse {
        watch_dir: watch_dir.to_string_lossy().to_string(),
        workflow_count: workflows.len(),
        last_sync: None, // TODO: track last sync timestamp
    }))
}

/// POST /api/automa/workflows/sync/local
/// Reads workflows from a given local folder path and upserts to DB
#[utoipa::path(
    post,
    path = "/api/automa/workflows/sync/local",
    responses(
        (status = 200, description = "Local folder synced successfully")
    ),
    tag = "sync"
)]
async fn sync_local(
    State(state): State<AppState>,
    Json(payload): Json<SyncLocalPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    // 1. Read from the 'workflows' subfolder of the workspace
    let workspace_dir = std::path::PathBuf::from(payload.folder_path);
    let watch_dir = workspace_dir.join("workflows");
    
    if !watch_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(&watch_dir) {
            return Err(AppError::Internal(format!("Failed to create workflows folder: {}", e)));
        }
    }

    // 2. Get all active workflows in DB
    let active_workflows = WorkflowService::get_all(&state.db).await.unwrap_or_default();
    let db_ids: std::collections::HashSet<String> = active_workflows.into_iter().map(|w| w.id).collect();

    let entries = std::fs::read_dir(&watch_dir)
        .map_err(|e| AppError::Internal(format!("Failed to read dir: {}", e)))?;

    let mut count = 0;
    let mut file_ids = std::collections::HashSet::new();
    
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => continue,
            };
            
            // First try to parse as strict Workflow
            if let Ok(workflow) = serde_json::from_str::<Workflow>(&content) {
                if WorkflowService::upsert(&state.db, &workflow).await.is_ok() {
                    let expected_filename = format!("{}.automa.json", workflow.id);
                    if path.file_name().and_then(|s| s.to_str()) != Some(&expected_filename) {
                        let new_path = path.with_file_name(&expected_filename);
                        if let Ok(_) = std::fs::rename(&path, &new_path) {
                            log::info!("Sync: Auto-renamed {:?} to {:?}", path, new_path);
                        }
                    }
                    file_ids.insert(workflow.id.clone());
                    count += 1;
                }
            } else if let Ok(mut value) = serde_json::from_str::<serde_json::Value>(&content) {
                // Try parsing as raw Automa export format
                if let Some(obj) = value.as_object_mut() {
                    let name_str = obj.get("name").and_then(|v| v.as_str()).unwrap_or("Untitled Workflow");
                    let id = obj.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or_else(|| {
                        uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_OID, name_str.as_bytes()).to_string()
                    });
                    let name = name_str.to_string();
                    let icon = obj.get("icon").and_then(|v| v.as_str()).map(|s| s.to_string());
                    let description = obj.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
                    let drawflow = obj.get("drawflow").map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string());
                    let settings = obj.get("settings").map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string());
                    let global_data = obj.get("globalData").map(|v| {
                        if v.is_string() { v.as_str().unwrap().to_string() } else { v.to_string() }
                    });
                    let version = obj.get("version").and_then(|v| v.as_str()).map(|s| s.to_string());
                    
                    let workflow = Workflow {
                        id: id.clone(),
                        name,
                        icon,
                        folder_id: None,
                        description,
                        drawflow,
                        settings,
                        trigger: None,
                        global_data,
                        table_data: None,
                        data_columns: None,
                        version,
                        is_disabled: Some(0),
                        source: Some("local_sync".to_string()),
                        created_at: None,
                        updated_at: None,
                        deleted_at: None,
                        delete_source: None,
                    };

                    if WorkflowService::upsert(&state.db, &workflow).await.is_ok() {
                        let expected_filename = format!("{}.automa.json", id);
                        if path.file_name().and_then(|s| s.to_str()) != Some(&expected_filename) {
                            let new_path = path.with_file_name(&expected_filename);
                            if let Ok(_) = std::fs::rename(&path, &new_path) {
                                log::info!("Sync: Auto-renamed {:?} to {:?}", path, new_path);
                            }
                        }
                        
                        file_ids.insert(id);
                        count += 1;
                    }
                }
            }
        }
    }

    // 3. Reconcile: Soft-delete DB workflows not found in the filesystem
    let mut deleted_count = 0;
    for id in db_ids {
        if !file_ids.contains(&id) {
            if WorkflowService::soft_delete(&state.db, &id, "sync_reconciliation").await.is_ok() {
                deleted_count += 1;
            }
        }
    }

    Ok(Json(serde_json::json!({
        "synced": count,
        "deleted": deleted_count,
        "status": "ok"
    })))
}
