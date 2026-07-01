use crate::api::AppState;
use crate::error::AppError;
use crate::services::runs_service;
use axum::{extract::State, Json, Router};
use serde::{Deserialize, Serialize};
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
    pub variables: Option<serde_json::Value>,
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

    // Fetch full workflow
    let record = crate::services::runs_service::get_workflow(&db, &payload.workflow_id)
        .await
        .unwrap_or_default();

    let (workflow_name, workflow_json) = if let Some(w) = record {
        let payload = omni_shared::automa::workflow::WorkflowPayload::from_raw(
            w.id,
            w.name.clone(),
            w.icon,
            w.folder_id,
            w.description,
            w.drawflow,
            w.settings,
            w.trigger,
            w.global_data,
            w.table_data,
            w.data_columns,
            w.content,
            w.connected_table,
            w.version,
            w.is_disabled,
            w.source,
            w.created_at,
            w.updated_at,
            w.deleted_at,
            w.delete_source,
        );
        (
            w.name,
            Some(serde_json::to_value(&payload).unwrap_or(serde_json::json!({}))),
        )
    } else {
        ("Unknown Workflow".to_string(), None)
    };

    match omni_shared::automa::executor::SharedWorkflowExecutor::execute(
        &db,
        &ws_tx,
        &payload.workflow_id,
        &workflow_name,
        workflow_json,
        &p_id,
        payload.schedule_id.as_deref(),
        payload.variables,
        omni_tauri_core::constants::RUNTIME_PORT,
        omni_tauri_core::constants::PROFILE_PORT,
    )
    .await
    {
        Ok(exec_result) => {
            let run_id = match exec_result {
                omni_shared::automa::executor::ExecutionResult::NeedsDefaultBrowser {
                    run_id,
                    bridge_url,
                } => {
                    use tauri_plugin_opener::OpenerExt;
                    if let Err(e) = app.opener().open_url(&bridge_url, None::<&str>) {
                        eprintln!("[Runs] Failed to open default browser: {}", e);
                    }
                    run_id
                }
                omni_shared::automa::executor::ExecutionResult::LaunchedProfile { run_id } => {
                    run_id
                }
            };
            Ok(Json(
                serde_json::json!({ "id": run_id, "status": "LAUNCHING" }),
            ))
        }
        Err(e) => {
            eprintln!("Failed to execute workflow: {:?}", e);
            Err(crate::error::AppError::Internal(format!("{:?}", e)))
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
