use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Router,
};
use crate::api::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/run", post(run_e2e))
}

#[utoipa::path(
    post,
    path = "/api/automa/run",
    responses(
        (status = 200, description = "E2E Orchestrator launched")
    )
)]
pub async fn run_e2e(
    State(state): State<AppState>,
) -> Result<StatusCode, StatusCode> {
    let app = state.app_handle.clone();
    
    match crate::commands::e2e::run_e2e_orchestrator(app).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            eprintln!("Failed to run e2e: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
