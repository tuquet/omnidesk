use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use crate::api::AppState;
use crate::db::models::workflow::{Workflow, WorkflowRun, WorkflowLog};
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_workflows).post(create_workflow))
        .route("/:id", get(get_workflow).put(update_workflow).delete(delete_workflow))
        .route("/:id/runs", get(get_workflow_runs))
        .route("/runs/:run_id/logs", get(get_run_logs))
}

// ─── Workflow CRUD ───────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/automa/workflows",
    responses(
        (status = 200, description = "List all workflows")
    ),
    tag = "workflows"
)]
async fn list_workflows(
    State(state): State<AppState>,
) -> Result<Json<Vec<Workflow>>, AppError> {
    let workflows = WorkflowService::get_all(&state.db).await?;
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
