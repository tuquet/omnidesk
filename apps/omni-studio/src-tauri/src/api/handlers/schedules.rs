use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};

use crate::api::AppState;
use crate::error::AppError;
use omni_shared::models::workflow::Schedule;
use omni_shared::services::schedules_service::{self, CreateSchedulePayload, UpdateSchedulePayload};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_schedules).post(create_schedule))
        .route(
            "/:id",
            get(get_schedule)
                .put(update_schedule)
                .delete(delete_schedule),
        )
        .route("/:id/toggle", axum::routing::post(toggle_schedule))
}

// ─── Handlers (pure CRUD, no scheduler interaction) ──────────

#[utoipa::path(
    get,
    path = "/api/automa/schedules",
    responses(
        (status = 200, description = "List all schedules")
    ),
    tag = "schedules"
)]
async fn list_schedules(State(state): State<AppState>) -> Result<Json<Vec<Schedule>>, AppError> {
    let schedules = schedules_service::list_schedules(&state.db).await?;
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
    let schedule = schedules_service::create_schedule(&state.db, &payload).await?;
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
    let schedule = schedules_service::get_schedule(&state.db, &id).await?;
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
    let schedule = schedules_service::update_schedule(&state.db, &id, &payload).await?;
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
    schedules_service::delete_schedule(&state.db, &id).await?;
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
    let schedule = schedules_service::toggle_schedule(&state.db, &id).await?;
    Ok(Json(schedule))
}
