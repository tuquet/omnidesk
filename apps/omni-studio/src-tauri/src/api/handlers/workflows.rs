use axum::{
    extract::{Path, Query, State},
    routing::{get, post, delete},
    Json, Router,
};
use serde::Deserialize;
use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

use omni_shared::automa::workflow::WorkflowPayload;

impl From<Workflow> for WorkflowPayload {
    fn from(w: Workflow) -> Self {
        WorkflowPayload::from_raw(
            w.id,
            w.name,
            w.icon,
            w.folder_id,
            w.description,
            w.drawflow,
            w.settings,
            w.trigger,
            w.global_data,
            w.table_data,
            w.data_columns,
            w.version,
            w.is_disabled,
            w.source,
            w.created_at,
            w.updated_at,
            w.deleted_at,
            w.delete_source,
        )
    }
}

impl From<WorkflowPayload> for Workflow {
    fn from(aw: WorkflowPayload) -> Self {
        Workflow {
            id: aw.id,
            name: aw.name,
            icon: aw.icon,
            folder_id: aw.folder_id,
            description: aw.description,
            drawflow: serde_json::to_string(&aw.drawflow).unwrap_or_else(|_| "{}".to_string()),
            settings: serde_json::to_string(&aw.settings).unwrap_or_else(|_| "{}".to_string()),
            trigger: aw.trigger.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            global_data: aw.global_data.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            table_data: aw.table_data.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            data_columns: aw.data_columns.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            version: aw.version,
            is_disabled: aw.is_disabled,
            source: aw.source,
            created_at: aw.created_at,
            updated_at: aw.updated_at,
            deleted_at: aw.deleted_at,
            delete_source: aw.delete_source,
        }
    }
}

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/sync", crate::api::handlers::sync::router())
        .route("/", get(list_workflows).post(create_workflow))
        .route("/shared", get(get_empty_list))
        .route("/hosted", get(get_empty_list))
        .route("/backup", get(get_empty_list))
        .route("/trash", get(list_trash_workflows))
        .route("/:id", get(get_workflow).put(update_workflow).delete(delete_workflow))
        .route("/:id/duplicate", post(duplicate_workflow))
        .route("/:id/restore", post(restore_workflow))
        .route("/:id/force", delete(force_delete_workflow))
        .route("/runs", post(create_workflow_run))
        .route("/:id/runs", get(get_workflow_runs))
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
    Ok(Json(workflows.into_iter().map(WorkflowPayload::from).collect()))
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
    Json(api_workflow): Json<WorkflowPayload>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let mut workflow: Workflow = api_workflow.into();
    workflow.id = id.clone();
    let updated = WorkflowService::upsert(&state.db, &workflow).await?;
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
    Query(query): Query<WorkspaceQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Soft Delete from SQLite
    WorkflowService::soft_delete(&state.db, &id, "api").await?;

    // Delete from Local File (if we do soft delete, we also delete the local JSON so it doesn't get synced back)
    let watch_dir = query.workspace_path
        .map(|p| std::path::PathBuf::from(p).join("workflows"))
        .unwrap_or_else(|| state.app_dir.join("workflows"));
        
    let file_path = watch_dir.join(format!("{}.automa.json", id));
    if file_path.exists() {
        if let Err(e) = std::fs::remove_file(&file_path) {
            eprintln!("Failed to delete workflow file {:?}: {}", file_path, e);
        }
    }

    // Broadcast to WebSocket so Extension deletes it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_deleted".to_string(),
        payload: serde_json::json!({ "id": id, "source": "studio" }),
    };
    let _ = state.sync_tx.send(event);

    Ok(Json(serde_json::json!({ "deleted": true })))
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows/{id}/restore",
    responses(
        (status = 200, description = "Workflow restored")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID"),
        ("workspacePath" = Option<String>, Query, description = "Workspace path")
    ),
    tag = "workflows"
)]
async fn restore_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<WorkspaceQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::restore(&state.db, &id).await?;
    
    // Fetch and export to JSON
    if let Ok(wf) = WorkflowService::get_by_id(&state.db, &id).await {
        let watch_dir = query.workspace_path
            .map(|p| std::path::PathBuf::from(p).join("workflows"))
            .unwrap_or_else(|| state.app_dir.join("workflows"));
        let _ = crate::services::file_watcher::FileWatcherService::export_workflow_file(&watch_dir, &wf).await;
    }

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
    Query(query): Query<WorkspaceQuery>,
) -> Result<Json<WorkflowPayload>, AppError> {
    let duplicated = WorkflowService::duplicate(&state.db, &id).await?;
    
    // Export new workflow to local JSON
    let watch_dir = query.workspace_path
        .map(|p| std::path::PathBuf::from(p).join("workflows"))
        .unwrap_or_else(|| state.app_dir.join("workflows"));
    let _ = crate::services::file_watcher::FileWatcherService::export_workflow_file(&watch_dir, &duplicated).await;

    // Broadcast to WebSocket so Extension adds it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_added".to_string(),
        payload: serde_json::json!({ "id": duplicated.id, "source": "studio" }),
    };
    let _ = state.sync_tx.send(event);

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
    Query(query): Query<WorkspaceQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::delete(&state.db, &id).await?;
    
    // Delete from Local File (if it exists)
    let watch_dir = query.workspace_path
        .map(|p| std::path::PathBuf::from(p).join("workflows"))
        .unwrap_or_else(|| state.app_dir.join("workflows"));
    let file_path = watch_dir.join(format!("{}.automa.json", id));
    if file_path.exists() {
        if let Err(e) = std::fs::remove_file(&file_path) {
            eprintln!("Failed to delete workflow file {:?}: {}", file_path, e);
        }
    }

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
    State(state): State<AppState>,
    Json(payload): Json<CreateRunPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = reqwest::Client::new();
    let engine_health_url = "http://127.0.0.1:1423/health";
    let engine_url = "http://127.0.0.1:1423/api/engine/runs";
    
    // Check if we should fallback immediately
    let is_default = payload.profile_id.as_deref() == Some("default");
    
    let fallback_reason = if !is_default {
        // Quick healthcheck to see if engine is alive
        let health_res = client.get(engine_health_url).timeout(std::time::Duration::from_millis(500)).send().await;
        if health_res.is_ok() && health_res.unwrap().status().is_success() {
            let res = client.post(engine_url).json(&payload).send().await;
            match res {
                Ok(r) if r.status().is_success() => {
                    let run: serde_json::Value = r.json().await.map_err(|e| AppError::Internal(format!("Failed to parse run: {}", e)))?;
                    return Ok(Json(run));
                },
                Ok(r) => {
                    // If it returned an error status, it means engine is reachable but rejected it.
                    return Err(AppError::Internal(format!("Engine returned {}", r.status())));
                },
                Err(e) => {
                    format!("Engine reachable but POST failed ({})", e)
                }
            }
        } else {
            "Engine unreachable (healthcheck failed)".to_string()
        }
    } else {
        "Default profile requested".to_string()
    };
    
    println!("[Studio] Fallback executing workflow locally. Reason: {}", fallback_reason);
        // Get the workflow to send down
        let workflow = WorkflowService::get_by_id(&state.db, &payload.workflow_id).await?;
        let api_workflow = WorkflowPayload::from(workflow.clone());
        let workflow_json = serde_json::to_value(api_workflow).unwrap_or(serde_json::json!({
            "id": payload.workflow_id,
            "name": workflow.name.clone()
        }));
        
        let exec_result = omni_shared::automa::executor::SharedWorkflowExecutor::execute(
            &state.db,
            &state.automa_ws_tx,
            &payload.workflow_id,
            &workflow.name,
            Some(workflow_json),
            payload.profile_id.as_deref().unwrap_or("default"),
            payload.schedule_id.as_deref(),
            payload.variables.clone(),
            1422, // Studio port
        ).await?;
        
        let run_id = match exec_result {
            omni_shared::automa::executor::ExecutionResult::NeedsDefaultBrowser { run_id, bridge_url } => {
                use tauri_plugin_opener::OpenerExt;
                if let Err(e) = state.app_handle.opener().open_url(&bridge_url, None::<&str>) {
                    eprintln!("[Studio] Failed to open default browser: {}", e);
                }
                run_id
            },
            omni_shared::automa::executor::ExecutionResult::LaunchedProfile { run_id } => run_id,
        };
        
        return Ok(Json(serde_json::json!({
            "run_id": run_id,
            "status": "LAUNCHING"
        })));

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
