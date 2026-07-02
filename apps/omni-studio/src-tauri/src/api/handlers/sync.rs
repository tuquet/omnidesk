use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use omni_shared::services::workflow_service::WorkflowService;
use axum::{
    extract::{Path, State, Query},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

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
        if let Ok(existing) = WorkflowService::get_by_id(&state.db, &workflow.id).await {
            if existing.is_identical_data(workflow) {
                continue;
            }
        }

        // Upsert into SQLite
        if let Ok(wf) = WorkflowService::upsert(&state.db, workflow).await {
            // File Watcher is removed.
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
    // File Watcher is removed.

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
    Query(_params): Query<crate::api::handlers::workflows::WorkspaceQuery>,
    Json(mut payload): Json<omni_shared::automa::workflow::WorkflowPayload>,
) -> Result<Json<Workflow>, AppError> {
    if payload.id.trim().is_empty() {
        payload.id = uuid::Uuid::new_v4().to_string();
    }
    if payload.name.trim().is_empty() {
        payload.name = "Untitled Workflow".to_string();
    }

    if payload.created_at.as_deref().map(|s| s.trim().is_empty()).unwrap_or(false) {
        payload.created_at = None;
    }
    if payload.updated_at.as_deref().map(|s| s.trim().is_empty()).unwrap_or(false) {
        payload.updated_at = None;
    }

    let workflow: Workflow = payload.into();

    if let Ok(existing) = WorkflowService::get_by_id(&state.db, &workflow.id).await {
        if existing.is_identical_data(&workflow) {
            return Ok(Json(existing));
        }
    }

    let upserted = WorkflowService::upsert(&state.db, &workflow).await?;
    // File Watcher is removed.

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
async fn sync_status(State(state): State<AppState>) -> Result<Json<SyncStatusResponse>, AppError> {
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
            return Err(AppError::Internal(format!(
                "Failed to create workflows folder: {}",
                e
            )));
        }
    }

    // 2. Get all active workflows in DB
    let active_workflows = WorkflowService::get_all(&state.db)
        .await
        .unwrap_or_default();
    let db_ids: std::collections::HashSet<String> =
        active_workflows.into_iter().map(|w| w.id).collect();

    let walker = walkdir::WalkDir::new(&watch_dir).into_iter();

    let mut count = 0;
    let mut file_ids = std::collections::HashSet::new();
    let mut walker_error = false;

    for entry_res in walker {
        let entry = match entry_res {
            Ok(e) => e,
            Err(e) => {
                log::error!("Error reading workflows directory: {}", e);
                walker_error = true;
                break;
            }
        };

        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "json") {
            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            // First try to parse as strict Workflow
            if let Ok(workflow) = serde_json::from_str::<Workflow>(&content) {
                if workflow.id.trim().is_empty() {
                    continue;
                }
                
                // Do not resurrect soft-deleted workflows from local disk
                if let Ok(existing) = WorkflowService::get_by_id(&state.db, &workflow.id).await {
                    if existing.deleted_at.is_some() {
                        continue;
                    }
                }

                if WorkflowService::upsert(&state.db, &workflow).await.is_ok() {
                    file_ids.insert(workflow.id.clone());
                    count += 1;
                }
            } else if let Ok(mut value) = serde_json::from_str::<serde_json::Value>(&content) {
                // Try parsing as raw Automa export format
                if let Some(obj) = value.as_object_mut() {
                    let name_str = obj
                        .get("name")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Untitled Workflow");
                    let id = obj
                        .get("id")
                        .and_then(|v| v.as_str())
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                        .unwrap_or_else(|| {
                            uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_OID, name_str.as_bytes())
                                .to_string()
                        });
                    let name = name_str.to_string();
                    let icon = obj
                        .get("icon")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());
                    let description = obj
                        .get("description")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());
                    let drawflow = obj
                        .get("drawflow")
                        .map(|v| {
                            if let Some(s) = v.as_str() {
                                serde_json::from_str(s).unwrap_or_else(|_| serde_json::json!({}))
                            } else {
                                v.clone()
                            }
                        })
                        .map(sqlx::types::Json)
                        .unwrap_or_else(|| sqlx::types::Json(serde_json::json!({})));
                    let settings = obj
                        .get("settings")
                        .map(|v| {
                            if let Some(s) = v.as_str() {
                                serde_json::from_str(s).unwrap_or_else(|_| serde_json::json!({}))
                            } else {
                                v.clone()
                            }
                        })
                        .map(sqlx::types::Json)
                        .unwrap_or_else(|| sqlx::types::Json(serde_json::json!({})));
                    let _is_disabled = obj.get("isDisabled").and_then(|v| v.as_bool()).unwrap_or(false);

                    if id.trim().is_empty() {
                        continue;
                    }

                    // Do not resurrect soft-deleted workflows from local disk
                    if let Ok(existing) = WorkflowService::get_by_id(&state.db, &id).await {
                        if existing.deleted_at.is_some() {
                            continue;
                        }
                    }

                    let global_data = obj.get("globalData").map(|v| {
                        if let Some(s) = v.as_str() {
                            serde_json::from_str(s).unwrap_or_else(|_| serde_json::json!({}))
                        } else {
                            v.clone()
                        }
                    }).map(sqlx::types::Json);
                    let version = obj
                        .get("version")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());

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
                        content: None,
                        connected_table: None,
                        version,
                        is_disabled: Some(0),
                        source: Some("local_sync".to_string()),
                        created_at: None,
                        updated_at: None,
                        deleted_at: None,
                        delete_source: None,
                    };

                    if WorkflowService::upsert(&state.db, &workflow).await.is_ok() {
                        file_ids.insert(id);
                        count += 1;
                    }
                }
            }
        }
    }

    if walker_error {
        return Err(AppError::Internal("Failed to read workflow directory completely. Aborting sync reconciliation to prevent data loss.".to_string()));
    }

    // 3. Reconcile: Soft-delete DB workflows not found in the filesystem
    let mut deleted_count = 0;
    for id in db_ids {
        if !file_ids.contains(&id) {
            if WorkflowService::soft_delete(&state.db, &id, "sync_reconciliation")
                .await
                .is_ok()
            {
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
