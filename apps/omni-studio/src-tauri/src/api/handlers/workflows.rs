use axum::{
    extract::{Path, Query, State},
    routing::{get, post, delete},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ApiWorkflow {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    #[schema(value_type = Object)]
    pub drawflow: serde_json::Value,
    #[schema(value_type = Object)]
    pub settings: serde_json::Value,
    #[schema(value_type = Option<Object>)]
    pub trigger: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub global_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub table_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub data_columns: Option<serde_json::Value>,
    pub version: Option<String>,
    pub is_disabled: Option<i64>,
    pub source: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
    pub delete_source: Option<String>,
}

impl From<Workflow> for ApiWorkflow {
    fn from(w: Workflow) -> Self {
        ApiWorkflow {
            id: w.id,
            name: w.name,
            icon: w.icon,
            folder_id: w.folder_id,
            description: w.description,
            drawflow: serde_json::from_str(&w.drawflow).unwrap_or_else(|_| serde_json::json!({})),
            settings: serde_json::from_str(&w.settings).unwrap_or_else(|_| serde_json::json!({})),
            trigger: w.trigger.and_then(|s| serde_json::from_str(&s).ok()),
            global_data: w.global_data.and_then(|s| serde_json::from_str(&s).ok()),
            table_data: w.table_data.and_then(|s| serde_json::from_str(&s).ok()),
            data_columns: w.data_columns.and_then(|s| serde_json::from_str(&s).ok()),
            version: w.version,
            is_disabled: w.is_disabled,
            source: w.source,
            created_at: w.created_at,
            updated_at: w.updated_at,
            deleted_at: w.deleted_at,
            delete_source: w.delete_source,
        }
    }
}

impl From<ApiWorkflow> for Workflow {
    fn from(aw: ApiWorkflow) -> Self {
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
) -> Result<Json<Vec<ApiWorkflow>>, AppError> {
    let workflows = if let Some(since) = params.since {
        WorkflowService::get_changed_since(&state.db, &since).await?
    } else {
        WorkflowService::get_all(&state.db).await?
    };
    Ok(Json(workflows.into_iter().map(ApiWorkflow::from).collect()))
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
) -> Result<Json<ApiWorkflow>, AppError> {
    let workflow = WorkflowService::get_by_id(&state.db, &id).await?;
    Ok(Json(ApiWorkflow::from(workflow)))
}


#[utoipa::path(
    get,
    path = "/api/automa/workflows/trash",
    responses(
        (status = 200, description = "List of trashed workflows", body = Vec<ApiWorkflow>)
    ),
    tag = "workflows"
)]
async fn list_trash_workflows(
    State(state): State<AppState>,
) -> Result<Json<Vec<ApiWorkflow>>, AppError> {
    let workflows = WorkflowService::get_trash(&state.db).await?;
    let api_workflows = workflows.into_iter().map(ApiWorkflow::from).collect();
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
    Json(api_workflow): Json<ApiWorkflow>,
) -> Result<Json<ApiWorkflow>, AppError> {
    let workflow: Workflow = api_workflow.into();
    let created = WorkflowService::create(&state.db, &workflow).await?;
    Ok(Json(ApiWorkflow::from(created)))
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
    Json(api_workflow): Json<ApiWorkflow>,
) -> Result<Json<ApiWorkflow>, AppError> {
    let mut workflow: Workflow = api_workflow.into();
    workflow.id = id.clone();
    let updated = WorkflowService::upsert(&state.db, &workflow).await?;
    Ok(Json(ApiWorkflow::from(updated)))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/{id}",
    responses(
        (status = 204, description = "Workflow deleted"),
        (status = 404, description = "Workflow not found")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn delete_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Soft Delete from SQLite
    WorkflowService::soft_delete(&state.db, &id, "api").await?;

    // Delete from Local File (if we do soft delete, we also delete the local JSON so it doesn't get synced back)
    let watch_dir = state.app_dir.join("workflows");
    let file_path = watch_dir.join(format!("{}.json", id));
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
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn restore_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::restore(&state.db, &id).await?;
    
    // Fetch and export to JSON
    if let Ok(wf) = WorkflowService::get_by_id(&state.db, &id).await {
        let watch_dir = state.app_dir.join("workflows");
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
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn duplicate_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiWorkflow>, AppError> {
    let duplicated = WorkflowService::duplicate(&state.db, &id).await?;
    
    // Export new workflow to local JSON
    let watch_dir = state.app_dir.join("workflows");
    let _ = crate::services::file_watcher::FileWatcherService::export_workflow_file(&watch_dir, &duplicated).await;

    // Broadcast to WebSocket so Extension adds it
    let event = crate::api::handlers::sync_ws::SyncEvent {
        event_type: "workflow_added".to_string(),
        payload: serde_json::json!({ "id": duplicated.id, "source": "studio" }),
    };
    let _ = state.sync_tx.send(event);

    Ok(Json(ApiWorkflow::from(duplicated)))
}

#[utoipa::path(
    delete,
    path = "/api/automa/workflows/{id}/force",
    responses(
        (status = 200, description = "Workflow force deleted")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tag = "workflows"
)]
async fn force_delete_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::delete(&state.db, &id).await?;
    
    // Delete from Local File (if it exists)
    let watch_dir = state.app_dir.join("workflows");
    let file_path = watch_dir.join(format!("{}.json", id));
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
    
    let mut use_fallback = false;
    let mut fallback_reason = String::new();
    
    if !is_default {
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
                    use_fallback = true;
                    fallback_reason = format!("Engine reachable but POST failed ({})", e);
                }
            }
        } else {
            use_fallback = true;
            fallback_reason = "Engine unreachable (healthcheck failed)".to_string();
        }
    } else {
        use_fallback = true;
        fallback_reason = "Default profile requested".to_string();
    }
    
    if use_fallback {
        println!("[Studio] Fallback executing workflow locally. Reason: {}", fallback_reason);
        // Get the workflow to send down
        let workflow = WorkflowService::get_by_id(&state.db, &payload.workflow_id).await?;
        let api_workflow = ApiWorkflow::from(workflow.clone());
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
    
    Err(AppError::Internal("Unhandled fallback state".to_string()))
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
