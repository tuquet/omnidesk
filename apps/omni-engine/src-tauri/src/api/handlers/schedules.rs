use axum::{
    extract::{Path, State},
    routing::post,
    Json, Router,
};

use crate::api::AppState;
use crate::error::AppError;
use omni_shared::services::schedules_service;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/:id/run-now", post(run_now))
}

// ─── Types re-exported for OpenAPI ───────────────────────

pub use omni_shared::services::schedules_service::{CreateSchedulePayload, UpdateSchedulePayload};

// ─── Handler ───────────────────────────────────────────

#[utoipa::path(
    post,
    path = "/api/automa/schedules/{id}/run-now",
    params(("id" = String, Path, description = "Schedule ID")),
    responses(
        (status = 200, description = "Immediate run triggered")
    ),
    tag = "schedules"
)]
async fn run_now(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let schedule = schedules_service::get_schedule(&state.db, &id).await?;

    // Trigger immediate execution via the executor
    if let Some(scheduler) = &state.scheduler {
        let run = scheduler.execute_now(&state.db, &schedule).await?;
        Ok(Json(serde_json::json!({
            "status": "triggered",
            "run_id": run.id,
            "workflow_id": schedule.workflow_id,
            "profile_id": schedule.profile_id,
        })))
    } else {
        Err(AppError::Internal("Scheduler not running".to_string()))
    }
}
