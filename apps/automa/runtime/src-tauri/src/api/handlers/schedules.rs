use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use utoipa::ToSchema;

use crate::api::AppState;
use crate::db::models::workflow::Schedule;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_schedules).post(create_schedule))
        .route("/:id", get(get_schedule).put(update_schedule).delete(delete_schedule))
        .route("/:id/toggle", post(toggle_schedule))
        .route("/:id/run-now", post(run_now))
}

// ─── Types ───────────────────────────────────────────

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateSchedulePayload {
    pub name: String,
    pub workflow_id: String,
    pub profile_id: String,
    pub cron_expr: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateSchedulePayload {
    pub name: Option<String>,
    pub workflow_id: Option<String>,
    pub profile_id: Option<String>,
    pub cron_expr: Option<String>,
}

// ─── Handlers ───────────────────────────────────────────

#[utoipa::path(
    get,
    path = "/api/automa/schedules",
    responses(
        (status = 200, description = "List all schedules")
    ),
    tag = "schedules"
)]
async fn list_schedules(
    State(state): State<AppState>,
) -> Result<Json<Vec<Schedule>>, AppError> {
    let schedules = WorkflowService::get_all_schedules(&state.db).await?;
    Ok(Json(schedules))
}

#[utoipa::path(
    post,
    path = "/api/automa/schedules",
    responses(
        (status = 201, description = "Schedule created")
    ),
    tag = "schedules"
)]
async fn create_schedule(
    State(state): State<AppState>,
    Json(payload): Json<CreateSchedulePayload>,
) -> Result<Json<Schedule>, AppError> {
    let schedule = WorkflowService::create_schedule(
        &state.db,
        &payload.name,
        &payload.workflow_id,
        &payload.profile_id,
        &payload.cron_expr,
    ).await?;

    // Register with the live scheduler
    if let Some(scheduler) = &state.scheduler {
        scheduler.add_schedule(&schedule).await?;
    }

    Ok(Json(schedule))
}

#[utoipa::path(
    get,
    path = "/api/automa/schedules/{id}",
    params(("id" = String, Path, description = "Schedule ID")),
    responses(
        (status = 200, description = "Get schedule"),
        (status = 404, description = "Not found")
    ),
    tag = "schedules"
)]
async fn get_schedule(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Schedule>, AppError> {
    let schedule = WorkflowService::get_schedule_by_id(&state.db, &id).await?;
    Ok(Json(schedule))
}

#[utoipa::path(
    put,
    path = "/api/automa/schedules/{id}",
    params(("id" = String, Path, description = "Schedule ID")),
    responses(
        (status = 200, description = "Schedule updated"),
        (status = 404, description = "Not found")
    ),
    tag = "schedules"
)]
async fn update_schedule(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateSchedulePayload>,
) -> Result<Json<Schedule>, AppError> {
    let schedule = WorkflowService::update_schedule(
        &state.db,
        &id,
        payload.name.as_deref(),
        payload.workflow_id.as_deref(),
        payload.profile_id.as_deref(),
        payload.cron_expr.as_deref(),
    ).await?;

    // Re-register with the live scheduler
    if let Some(scheduler) = &state.scheduler {
        scheduler.update_schedule(&schedule).await?;
    }

    Ok(Json(schedule))
}

#[utoipa::path(
    delete,
    path = "/api/automa/schedules/{id}",
    params(("id" = String, Path, description = "Schedule ID")),
    responses(
        (status = 200, description = "Schedule deleted"),
        (status = 404, description = "Not found")
    ),
    tag = "schedules"
)]
async fn delete_schedule(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Remove from live scheduler first
    if let Some(scheduler) = &state.scheduler {
        scheduler.remove_schedule(&id).await;
    }

    WorkflowService::delete_schedule(&state.db, &id).await?;
    Ok(Json(serde_json::json!({ "deleted": id })))
}

#[utoipa::path(
    post,
    path = "/api/automa/schedules/{id}/toggle",
    params(("id" = String, Path, description = "Schedule ID")),
    responses(
        (status = 200, description = "Schedule toggled")
    ),
    tag = "schedules"
)]
async fn toggle_schedule(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Schedule>, AppError> {
    let schedule = WorkflowService::toggle_schedule(&state.db, &id).await?;

    // Update live scheduler
    if let Some(scheduler) = &state.scheduler {
        if schedule.is_enabled == Some(1) {
            scheduler.add_schedule(&schedule).await?;
        } else {
            scheduler.remove_schedule(&id).await;
        }
    }

    Ok(Json(schedule))
}

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
    let schedule = WorkflowService::get_schedule_by_id(&state.db, &id).await?;

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
