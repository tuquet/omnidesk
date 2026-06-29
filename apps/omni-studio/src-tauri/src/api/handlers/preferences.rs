use axum::{
    extract::State,
    http::StatusCode,
    routing::get,
    Router,
    Json,
};
use serde::Deserialize;
use utoipa::ToSchema;
use crate::api::{AppState, auth::Claims};
use crate::services::preferences_service;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/home-layout", get(get_home_layout).put(update_home_layout))
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
) -> Result<StatusCode, StatusCode> {
    let pool = &state.db;
    let user_id = claims.user_id();
    
    match preferences_service::update_home_layout(pool, &user_id, &payload.home_screen_order).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            eprintln!("Failed to update home screen order in DB: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
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
) -> Result<Json<String>, StatusCode> {
    let pool = &state.db;
    let user_id = claims.user_id();
    
    match preferences_service::get_home_layout(pool, &user_id).await {
        Ok(layout) => Ok(Json(layout)),
        Err(e) => {
            eprintln!("Failed to get home layout: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
