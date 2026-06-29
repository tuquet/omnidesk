use axum::{
    extract::{Path, Query, State},
    routing::{get, post, put},
    Json, Router,
};
use serde::Deserialize;
use crate::api::AppState;
use crate::db::models::workflow::{Workflow, WorkflowRun, WorkflowLog};
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_workflows).post(create_workflow))
        .route("/:id", get(get_workflow).put(update_workflow).delete(delete_workflow))
        .route("/runs", post(create_workflow_run))
        .route("/runs/:run_id", put(finish_workflow_run))
        .route("/runs/:run_id/logs", get(get_run_logs).post(add_workflow_log))
        .route("/:id/runs", get(get_workflow_runs))
}

// ─── Workflow CRUD ───────────────────────────────────────────

#[derive(Deserialize)]
pub struct ListWorkflowsQuery {
    /// If set, returns workflows changed since this ISO timestamp (for sync catch-up)
    pub since: Option<String>,
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows",
    params(
        ("since" = Option<String>, Query, description = "ISO timestamp — return only workflows changed after this time")
    ),
    responses(
        (status = 200, description = "List all workflows (or changed since timestamp)")
    ),
    tag = "workflows"
)]
async fn list_workflows(
    State(state): State<AppState>,
    Query(params): Query<ListWorkflowsQuery>,
) -> Result<Json<Vec<Workflow>>, AppError> {
    let workflows = if let Some(since) = params.since {
        WorkflowService::get_changed_since(&state.db, &since).await?
    } else {
        WorkflowService::get_all(&state.db).await?
    };
    Ok(Json(workflows))
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
) -> Result<Json<Workflow>, AppError> {
    let workflow = WorkflowService::get_by_id(&state.db, &id).await?;
    Ok(Json(workflow))
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
    Json(workflow): Json<Workflow>,
) -> Result<Json<Workflow>, AppError> {
    let created = WorkflowService::create(&state.db, &workflow).await?;
    Ok(Json(created))
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
    Json(workflow): Json<Workflow>,
) -> Result<Json<Workflow>, AppError> {
    let updated = WorkflowService::update(&state.db, &id, &workflow).await?;
    Ok(Json(updated))
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
    WorkflowService::delete(&state.db, &id).await?;
    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ─── Workflow Runs ───────────────────────────────────────────

#[derive(Deserialize)]
pub struct CreateRunPayload {
    pub workflow_id: String,
    pub profile_id: Option<String>,
    pub schedule_id: Option<String>,
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
) -> Result<Json<WorkflowRun>, AppError> {
    let run = WorkflowService::create_run(
        &state.db,
        &payload.workflow_id,
        payload.profile_id.as_deref(),
        payload.schedule_id.as_deref(),
    )
    .await?;
    Ok(Json(run))
}

#[derive(Deserialize)]
pub struct FinishRunPayload {
    pub status: String,
    pub error_message: Option<String>,
    pub summary: Option<String>,
}

#[utoipa::path(
    put,
    path = "/api/automa/workflows/runs/{run_id}",
    responses(
        (status = 200, description = "Run finished")
    ),
    params(
        ("run_id" = String, Path, description = "Run ID")
    ),
    tag = "workflows"
)]
async fn finish_workflow_run(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
    Json(payload): Json<FinishRunPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::finish_run(
        &state.db,
        &run_id,
        &payload.status,
        payload.error_message.as_deref(),
        payload.summary.as_deref(),
    )
    .await?;
    Ok(Json(serde_json::json!({ "success": true })))
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
) -> Result<Json<Vec<WorkflowRun>>, AppError> {
    let runs = WorkflowService::get_runs_by_workflow(&state.db, &id).await?;
    Ok(Json(runs))
}

// ─── Workflow Logs ───────────────────────────────────────────

#[derive(Deserialize)]
pub struct AddLogPayload {
    pub block_id: String,
    pub block_label: String,
    pub status: String,
    pub duration_ms: Option<i64>,
    pub data: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/automa/workflows/runs/{run_id}/logs",
    responses(
        (status = 201, description = "Log added")
    ),
    params(
        ("run_id" = String, Path, description = "Run ID")
    ),
    tag = "workflows"
)]
async fn add_workflow_log(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
    Json(payload): Json<AddLogPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    WorkflowService::add_log(
        &state.db,
        &run_id,
        &payload.block_id,
        &payload.block_label,
        &payload.status,
        payload.duration_ms,
        payload.data.as_deref(),
    )
    .await?;
    Ok(Json(serde_json::json!({ "success": true })))
}

#[utoipa::path(
    get,
    path = "/api/automa/workflows/runs/{run_id}/logs",
    responses(
        (status = 200, description = "List logs for a specific run")
    ),
    params(
        ("run_id" = String, Path, description = "Run ID")
    ),
    tag = "workflows"
)]
async fn get_run_logs(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
) -> Result<Json<Vec<WorkflowLog>>, AppError> {
    let logs = WorkflowService::get_logs_by_run(&state.db, &run_id).await?;
    Ok(Json(logs))
}
