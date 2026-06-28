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
    let schedules = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await?;
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
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    
    sqlx::query(
        "INSERT INTO schedules (id, name, workflow_id, profile_id, cron_expr, is_enabled, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.workflow_id)
    .bind(&payload.profile_id)
    .bind(&payload.cron_expr)
    .bind(now)
    .bind(now)
    .execute(&state.db)
    .await?;

    let schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await?;

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
    let schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| AppError::NotFound(format!("Schedule {} not found", id)))?;
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
    let now = chrono::Utc::now().timestamp_millis();
    let now_str = chrono::Utc::now().to_rfc3339();
    let mut schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| AppError::NotFound(format!("Schedule {} not found", id)))?;

    if let Some(n) = payload.name { schedule.name = n; }
    if let Some(w) = payload.workflow_id { schedule.workflow_id = w; }
    if let Some(p) = payload.profile_id { schedule.profile_id = p; }
    if let Some(c) = payload.cron_expr { schedule.cron_expr = c; }
    schedule.updated_at = Some(now_str);

    sqlx::query(
        "UPDATE schedules SET name = ?, workflow_id = ?, profile_id = ?, cron_expr = ?, updated_at = ? WHERE id = ?"
    )
    .bind(&schedule.name)
    .bind(&schedule.workflow_id)
    .bind(&schedule.profile_id)
    .bind(&schedule.cron_expr)
    .bind(now)
    .bind(&id)
    .execute(&state.db)
    .await?;

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

    let rows_affected = sqlx::query("DELETE FROM schedules WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await?
        .rows_affected();
        
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Schedule {} not found", id)));
    }
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
    let mut schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| AppError::NotFound(format!("Schedule {} not found", id)))?;

    let new_val = if schedule.is_enabled == Some(1) { 0 } else { 1 };
    let now = chrono::Utc::now().timestamp_millis();
    let now_str = chrono::Utc::now().to_rfc3339();
    
    sqlx::query("UPDATE schedules SET is_enabled = ?, updated_at = ? WHERE id = ?")
        .bind(new_val)
        .bind(now)
        .bind(&id)
        .execute(&state.db)
        .await?;
        
    schedule.is_enabled = Some(new_val);
    schedule.updated_at = Some(now_str);

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
    let schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|_| AppError::NotFound(format!("Schedule {} not found", id)))?;

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
