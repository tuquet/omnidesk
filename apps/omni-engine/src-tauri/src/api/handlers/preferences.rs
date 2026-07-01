use crate::{
    api::{auth::Claims, AppState},
    error::AppError,
    services::preferences,
};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;
use utoipa::ToSchema;

pub fn router() -> Router<AppState> {
    Router::new().route("/home-layout", get(get_home_layout).put(update_home_layout))
}

#[derive(Deserialize, ToSchema)]
pub struct UpdateLayoutPayload {
    pub home_screen_order: String,
}

#[utoipa::path(
    put,
    path = "/api/users/home-layout",
    request_body = UpdateLayoutPayload,
    responses(
        (status = 200, description = "Home layout updated")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn update_home_layout(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<UpdateLayoutPayload>,
) -> Result<StatusCode, AppError> {
    let pool = &state.db;
    let user_id = claims.user_id();

    preferences::update_home_layout(pool, user_id, &payload.home_screen_order).await?;

    Ok(StatusCode::OK)
}

#[utoipa::path(
    get,
    path = "/api/users/home-layout",
    responses(
        (status = 200, description = "Home layout retrieved")
    ),
    security(
        ("bearerAuth" = [])
    )
)]
pub async fn get_home_layout(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<String>, AppError> {
    let pool = &state.db;
    let user_id = claims.user_id();

    let result = preferences::get_home_layout(pool, user_id).await?;

    Ok(Json(result))
}
