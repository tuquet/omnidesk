use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use serde_json::{json, Value};
use crate::{api::AppState, error::AppError, services::git_service::GitService};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/pull", post(git_pull))
        .route("/push", post(git_push))
}

#[utoipa::path(
    post,
    path = "/api/git/pull",
    responses(
        (status = 200, description = "Git pull successful")
    )
)]
async fn git_pull(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let watch_dir = state.app_dir.join("automa-workflows");
    let result = GitService::pull(&watch_dir)?;
    Ok(Json(json!({ "message": "Pull successful", "output": result })))
}

#[utoipa::path(
    post,
    path = "/api/git/push",
    responses(
        (status = 200, description = "Git commit and push successful")
    )
)]
async fn git_push(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let watch_dir = state.app_dir.join("automa-workflows");
    let message = format!("Update workflows from Omni-Studio at {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S"));
    let result = GitService::commit_and_push(&watch_dir, &message)?;
    Ok(Json(json!({ "message": "Push successful", "output": result })))
}
