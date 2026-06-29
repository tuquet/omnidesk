use axum::{
    extract::State,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use crate::api::AppState;
use crate::error::AppError;
use crate::services::runs_service;
use utoipa::ToSchema;

#[derive(Serialize)]
pub struct WorkflowRun {
    pub id: String,
    pub workflow_id: String,
    pub profile_id: Option<String>,
    pub schedule_id: Option<String>,
    pub status: String,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", axum::routing::get(get_runs).post(create_run))
        .route("/logs", axum::routing::get(get_logs))
}

#[derive(Deserialize, ToSchema)]
pub struct CreateRunPayload {
    pub workflow_id: String,
    pub profile_id: Option<String>,
    pub schedule_id: Option<String>,
}

#[utoipa::path(
    post,
    path = "/api/engine/runs",
    responses(
        (status = 201, description = "Run created and execution started")
    ),
    tag = "runs"
)]
async fn create_run(
    State(state): State<AppState>,
    Json(payload): Json<CreateRunPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    // We run this in background so we don't block the API
    let db = state.db.clone();
    let app = state.app_handle.clone();
    let ws_tx = state.automa_ws_tx.clone();
    
    let p_id = payload.profile_id.unwrap_or_else(|| "default".to_string());
    
    match crate::services::workflow_executor::WorkflowExecutor::execute(
        &db, &app, &ws_tx, &payload.workflow_id, &p_id, payload.schedule_id.as_deref()
    ).await {
        Ok(run) => Ok(Json(serde_json::json!({ "id": run.id, "status": run.status }))),
        Err(e) => {
            eprintln!("Failed to execute workflow: {:?}", e);
            Err(e)
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/engine/logs",
    responses(
        (status = 200, description = "List workflow logs")
    ),
    params(
        ("run_id" = Option<String>, Query, description = "Filter by run ID")
    ),
    tag = "runs"
)]
async fn get_logs(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let run_id = params.get("run_id").map(|s| s.as_str());
    let logs = runs_service::get_logs(&state.db, run_id).await?;

    Ok(Json(logs))
}

#[utoipa::path(
    get,
    path = "/api/engine/runs",
    responses(
        (status = 200, description = "List workflow runs")
    ),
    params(
        ("workflow_id" = Option<String>, Query, description = "Filter by workflow ID")
    ),
    tag = "runs"
)]
async fn get_runs(
    State(state): State<AppState>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<WorkflowRun>>, AppError> {
    let workflow_id = params.get("workflow_id").map(|s| s.as_str());
    let runs = runs_service::get_runs(&state.db, workflow_id).await?;

    Ok(Json(runs))
}
