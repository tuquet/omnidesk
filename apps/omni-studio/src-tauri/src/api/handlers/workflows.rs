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
        .route("/:id/runs", get(get_workflow_runs))
        .route("/runs/:run_id/logs", get(get_run_logs))
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

#[derive(serde::Deserialize, serde::Serialize, utoipa::ToSchema)]
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
    Json(payload): Json<CreateRunPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = reqwest::Client::new();
    let engine_url = "http://127.0.0.1:1423/api/engine/runs";
    
    let res = client.post(engine_url).json(&payload).send().await;
    
    match res {
        Ok(r) if r.status().is_success() => {
            let run: serde_json::Value = r.json().await.map_err(|e| AppError::Internal(format!("Failed to parse run: {}", e)))?;
            Ok(Json(run))
        },
        Ok(r) => {
            Err(AppError::Internal(format!("Engine returned {}", r.status())))
        },
        Err(e) => {
            Err(AppError::Internal(format!("Failed to connect to Omni Engine: {}", e)))
        }
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
    Path(id): Path<String>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let client = reqwest::Client::new();
    let engine_url = format!("http://127.0.0.1:1423/api/engine/runs?workflow_id={}", id);
    
    let res = client.get(&engine_url).send().await;
    
    match res {
        Ok(r) if r.status().is_success() => {
            let runs: Vec<serde_json::Value> = r.json().await.map_err(|e| AppError::Internal(format!("Failed to parse runs: {}", e)))?;
            Ok(Json(runs))
        },
        Ok(r) => {
            Err(AppError::Internal(format!("Engine returned {}", r.status())))
        },
        Err(e) => {
            Err(AppError::Internal(format!("Failed to connect to Omni Engine: {}", e)))
        }
    }
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
    Path(run_id): Path<String>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let client = reqwest::Client::new();
    let engine_url = format!("http://127.0.0.1:1423/api/engine/logs?run_id={}", run_id);
    
    let res = client.get(&engine_url).send().await;
    
    match res {
        Ok(r) if r.status().is_success() => {
            let logs: Vec<serde_json::Value> = r.json().await.map_err(|e| AppError::Internal(format!("Failed to parse logs: {}", e)))?;
            Ok(Json(logs))
        },
        Ok(r) => {
            Err(AppError::Internal(format!("Engine returned {}", r.status())))
        },
        Err(e) => {
            Err(AppError::Internal(format!("Failed to connect to Omni Engine: {}", e)))
        }
    }
}
