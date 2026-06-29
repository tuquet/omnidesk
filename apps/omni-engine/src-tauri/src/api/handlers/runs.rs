use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::Row;
use crate::api::AppState;
use crate::error::AppError;

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

#[derive(Deserialize)]
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
            eprintln!("Failed to execute workflow: {}", e);
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
    let run_id = params.get("run_id");
    
    let query = if let Some(id) = run_id {
        sqlx::query(
            "SELECT id, run_id, block_id, block_label, status, duration_ms, data, CAST(created_at AS TEXT) as created_at FROM workflow_logs WHERE run_id = ? ORDER BY created_at ASC"
        ).bind(id)
    } else {
        sqlx::query(
            "SELECT id, run_id, block_id, block_label, status, duration_ms, data, CAST(created_at AS TEXT) as created_at FROM workflow_logs ORDER BY created_at ASC LIMIT 100"
        )
    };

    let rows = query.fetch_all(&state.db).await?;
    
    let mut logs = Vec::new();
    for row in rows {
        let duration_ms: Option<i64> = row.try_get("duration_ms").ok();
        let data: Option<String> = row.try_get("data").ok();
        
        logs.push(serde_json::json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "run_id": row.try_get::<String, _>("run_id").unwrap_or_default(),
            "block_id": row.try_get::<String, _>("block_id").unwrap_or_default(),
            "block_label": row.try_get::<String, _>("block_label").unwrap_or_default(),
            "status": row.try_get::<String, _>("status").unwrap_or_default(),
            "duration_ms": duration_ms,
            "data": data,
            "created_at": row.try_get::<String, _>("created_at").ok(),
        }));
    }

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
    let workflow_id = params.get("workflow_id");
    
    let query = if let Some(id) = workflow_id {
        sqlx::query(
            "SELECT id, workflow_id, profile_id, schedule_id, status, CAST(started_at AS TEXT) as started_at, CAST(finished_at AS TEXT) as finished_at FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 50"
        ).bind(id)
    } else {
        sqlx::query(
            "SELECT id, workflow_id, profile_id, schedule_id, status, CAST(started_at AS TEXT) as started_at, CAST(finished_at AS TEXT) as finished_at FROM workflow_runs ORDER BY started_at DESC LIMIT 50"
        )
    };

    let rows = query.fetch_all(&state.db).await?;
    
    let mut runs = Vec::new();
    for row in rows {
        runs.push(WorkflowRun {
            id: row.try_get("id").unwrap_or_default(),
            workflow_id: row.try_get("workflow_id").unwrap_or_default(),
            profile_id: row.try_get("profile_id").ok(),
            schedule_id: row.try_get("schedule_id").ok(),
            status: row.try_get("status").unwrap_or_default(),
            started_at: row.try_get("started_at").ok(),
            finished_at: row.try_get("finished_at").ok(),
        });
    }

    Ok(Json(runs))
}
