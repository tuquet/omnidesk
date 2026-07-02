use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use omni_shared::services::workflow_service::WorkflowService;
use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post},
    Json, Router,
};
use serde::Deserialize;

use omni_shared::automa::workflow::WorkflowPayload;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/sync", crate::api::handlers::sync::router())
        .route("/", get(list_workflows).post(create_workflow))
        .route("/shared", get(get_empty_list))
        .route("/hosted", get(get_empty_list))
        .route("/backup", get(get_empty_list))
        .route("/trash", get(list_trash_workflows))
        .route(
            "/:id",
            get(get_workflow)
                .put(update_workflow)
                .delete(delete_workflow),
        )
        .route("/:id/duplicate", post(duplicate_workflow))
        .route("/:id/restore", post(restore_workflow))
        .route("/:id/force", delete(force_delete_workflow))
        .route("/runs", post(create_workflow_run))
        .route("/runs/:run_id", delete(delete_workflow_run))
        .route("/:id/runs", get(get_workflow_runs).delete(delete_all_workflow_runs))
        .route("/runs/:run_id/logs", get(get_run_logs))
}

async fn get_empty_list() -> Result<Json<Vec<serde_json::Value>>, AppError> {
    Ok(Json(vec![]))
}

// ─── Workflow CRUD ───────────────────────────────────────────

#[derive(Deserialize)]
pub struct ListWorkflowsQuery {
    pub since: Option<String>,
}

#[derive(Deserialize)]
pub struct WorkspaceQuery {
    #[serde(rename = "workspacePath")]
    pub workspace_path: Option<String>,
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows",
    params(
        ("since" = Option<String>, Query, description = "ISO timestamp - return only workflows changed after this time")
    ),
    responses(
        (status = 200, description = "List all workflows (or changed since timestamp)")
    ),
    tag = "workflows"
)]
async fn list_workflows(
    State(state): State<AppState>,
    Query(params): Query<ListWorkflowsQuery>,
) -> Result<Json<Vec<WorkflowPayload>>, AppError> {
    let workflows = if let Some(since) = params.since {
        WorkflowService::get_changed_since(&state.db, &since).await?
    } else {
        WorkflowService::get_all(&state.db).await?
    };
    Ok(Json(
        workflows.into_iter().map(WorkflowPayload::from).collect(),
    ))
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows/{id}",
    responses(
        (status = 200, description = "Get workflow by ID"),
        (status = 404, description = "Workflow not found")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn get_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let workflow = WorkflowService::get_by_id(&state.db, &id).await?;
    Ok(Json(WorkflowPayload::from(workflow)))
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows/trash",
    responses(
        (status = 200, description = "List of trashed workflows", body = Vec<WorkflowPayload>)
    ),
    tag = "workflows"
)]
async fn list_trash_workflows(
    State(state): State<AppState>,
) -> Result<Json<Vec<WorkflowPayload>>, AppError> {
    let workflows = WorkflowService::get_trash(&state.db).await?;
    let api_workflows = workflows.into_iter().map(WorkflowPayload::from).collect();
    Ok(Json(api_workflows))
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows",
    responses(
        (status = 201, description = "Workflow created")
    ),
    tag = "workflows"
)]
async fn create_workflow(
    State(state): State<AppState>,
    Json(api_workflow): Json<WorkflowPayload>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let workflow: Workflow = api_workflow.into();
    let created = WorkflowService::create(&state.db, &workflow).await?;
    Ok(Json(WorkflowPayload::from(created)))
}

#[utoipa::path(
    put,
    path = "/api/automa/workflows/{id}",
    responses(
        (status = 200, description = "Workflow updated"),
        (status = 404, description = "Workflow not found")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn update_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(_query): Query<WorkspaceQuery>,
    Json(api_workflow): Json<WorkflowPayload>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let mut workflow: Workflow = api_workflow.into();
    workflow.id = id.clone();
    
    // Explicitly bump the updated_at timestamp when saving from the Studio UI
    workflow.updated_at = Some(chrono::Utc::now().to_rfc3339());
    
    let updated = WorkflowService::upsert(&state.db, &workflow).await?;

    // Export new workflow to local JSON
    // File Watcher is removed.

    // Broadcast to WebSocket so Extension adds/updates it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflows_changed".to_string(),
        payload: serde_json::json!([WorkflowPayload::from(updated.clone())]),
    };
    if let Err(e) = state.sync_tx.send(event) {
        log::error!("Failed to broadcast workflows_changed event: {}", e);
    }

    Ok(Json(WorkflowPayload::from(updated)))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/{id}",
    responses(
        (status = 204, description = "Workflow deleted"),
        (status = 404, description = "Workflow not found")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID"),
        ("workspacePath" = Option<String>, Query, description = "Workspace path")
    ),
    tag = "workflows"
)]
async fn delete_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(_query): Query<WorkspaceQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Soft Delete from SQLite
    WorkflowService::soft_delete(&state.db, &id, "api").await?;

    // Delete from Local File (if we do soft delete, we also delete the local JSON so it doesn't get synced back)
    // USER INSTRUCTION: "khi xóa files ở db thì đừng xóa file ở folder nhé" -> commented out
    /*
    let watch_dir = query
        .workspace_path
        .map(|p| std::path::PathBuf::from(p).join("workflows"))
        .unwrap_or_else(|| state.app_dir.join("workflows"));

    let file_path = watch_dir.join(format!("{}.automa.json", id));
    if file_path.exists() {
        if let Err(e) = std::fs::remove_file(&file_path) {
            eprintln!("Failed to delete workflow file {:?}: {}", file_path, e);
        }
    }
    */

    // Broadcast to WebSocket so Extension deletes it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_deleted".to_string(),
        payload: serde_json::json!({ "id": id, "source": "studio" }),
    };
    if let Err(e) = state.sync_tx.send(event) {
        log::error!("Failed to broadcast workflow_deleted event: {}", e);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows/{id}/restore",
    responses(
        (status = 200, description = "Workflow restored")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn restore_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::restore(&state.db, &id).await?;

    Ok(Json(serde_json::json!({ "restored": true })))
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows/{id}/duplicate",
    responses(
        (status = 200, description = "Workflow duplicated")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID"),
        ("workspacePath" = Option<String>, Query, description = "Workspace path")
    ),
    tag = "workflows"
)]
async fn duplicate_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(_query): Query<WorkspaceQuery>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let duplicated = WorkflowService::duplicate(&state.db, &id).await?;

    // Export new workflow to local JSON
    // File Watcher is removed.

    // Broadcast to WebSocket so Extension adds it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_added".to_string(),
        payload: serde_json::json!({ "id": duplicated.id, "source": "studio" }),
    };
    if let Err(e) = state.sync_tx.send(event) {
        log::error!("Failed to broadcast workflow_added event: {}", e);
    }

    Ok(Json(WorkflowPayload::from(duplicated)))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/{id}/force",
    responses(
        (status = 200, description = "Workflow force deleted")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID"),
        ("workspacePath" = Option<String>, Query, description = "Workspace path")
    ),
    tag = "workflows"
)]
async fn force_delete_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(_query): Query<WorkspaceQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::delete(&state.db, &id).await?;

    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_deleted".to_string(),
        payload: serde_json::json!({ "id": id, "source": "studio" }),
    };
    if let Err(e) = state.sync_tx.send(event) {
        log::error!("Failed to broadcast workflow_deleted event: {}", e);
    }

    // Delete from Local File (if it exists)
    // USER INSTRUCTION: "khi xóa files ở db thì đừng xóa file ở folder nhé" -> commented out
    /*
    let watch_dir = query
        .workspace_path
        .map(|p| std::path::PathBuf::from(p).join("workflows"))
        .unwrap_or_else(|| state.app_dir.join("workflows"));
    let file_path = watch_dir.join(format!("{}.automa.json", id));
    if file_path.exists() {
        if let Err(e) = std::fs::remove_file(&file_path) {
            eprintln!("Failed to delete workflow file {:?}: {}", file_path, e);
        }
    }
    */

    Ok(Json(serde_json::json!({ "force_deleted": true })))
}

// ─── Workflow Runs ───────────────────────────────────────────

#[derive(serde::Deserialize, serde::Serialize, utoipa::ToSchema)]
pub struct CreateRunPayload {
    pub workflow_id: String,
    pub profile_id: Option<String>,
    pub schedule_id: Option<String>,
    pub variables: Option<serde_json::Value>,
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows/runs",
    responses(
        (status = 201, description = "Run created")
    ),
    tag = "workflows"
)]
async fn create_workflow_run(
    State(_state): State<AppState>,
    Json(payload): Json<CreateRunPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    static HTTP_CLIENT: std::sync::OnceLock<reqwest::Client> = std::sync::OnceLock::new();
    let client = HTTP_CLIENT.get_or_init(|| reqwest::Client::new());
    let runtime_api_url = omni_tauri_core::constants::get_runtime_api_url();
    let engine_health_url = format!("{}/health", runtime_api_url);
    let engine_url = format!("{}/api/engine/runs", runtime_api_url);

    // Healthcheck Engine
    let health_res = client
        .get(engine_health_url)
        .timeout(std::time::Duration::from_millis(500))
        .send()
        .await;

    if health_res.is_err() || !health_res.unwrap().status().is_success() {
        return Err(AppError::Internal(
            "Omni Engine is not running. Please start Omni Engine to execute workflows.".to_string(),
        ));
    }

    // Delegate execution to Engine (single source of truth)
    let res = client.post(engine_url).json(&payload).send().await
        .map_err(|e| AppError::Internal(format!("Failed to reach Engine: {}", e)))?;

    if res.status().is_success() {
        let run: serde_json::Value = res
            .json()
            .await
            .map_err(|e| AppError::Internal(format!("Failed to parse run: {}", e)))?;
        Ok(Json(run))
    } else {
        Err(AppError::Internal(format!(
            "Engine returned {}",
            res.status()
        )))
    }
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows/{id}/runs",
    responses(
        (status = 200, description = "List workflow runs")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn get_workflow_runs(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<crate::db::models::workflow::WorkflowRun>>, AppError> {
    let runs = WorkflowService::get_runs_by_workflow(&state.db, &id).await?;
    Ok(Json(runs))
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows/runs/{run_id}/logs",
    responses(
        (status = 200, description = "List workflow logs")
    ),
    params(
        ("run_id" = String, Path, description = "Run ID")
    ),
    tag = "workflows"
)]
async fn get_run_logs(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
) -> Result<Json<Vec<crate::db::models::workflow::WorkflowLog>>, AppError> {
    let logs = WorkflowService::get_logs_by_run(&state.db, &run_id).await?;
    Ok(Json(logs))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/runs/{run_id}",
    responses(
        (status = 200, description = "Run deleted successfully")
    ),
    tag = "workflows"
)]
async fn delete_workflow_run(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM workflow_runs WHERE id = ?")
        .bind(&run_id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({ "success": true })))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/{id}/runs",
    responses(
        (status = 200, description = "All runs for workflow deleted successfully")
    ),
    tag = "workflows"
)]
async fn delete_all_workflow_runs(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    sqlx::query("DELETE FROM workflow_runs WHERE workflow_id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({ "success": true })))
}
