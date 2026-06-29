use axum::{
    extract::State,
    routing::post,
    Json, Router,
};
use serde::Deserialize;
use crate::api::AppState;
use crate::error::AppError;
use utoipa::ToSchema;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(receive_report))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct AutomaReportPayload {
    pub detail: serde_json::Value,
    pub history: serde_json::Value,
    #[serde(rename = "ctxData")]
    pub ctx_data: serde_json::Value,
    pub data: serde_json::Value,
}

#[utoipa::path(
    post,
    path = "/api/reports",
    responses(
        (status = 200, description = "Report received successfully")
    ),
    tag = "reports"
)]
async fn receive_report(
    State(_state): State<AppState>,
    Json(payload): Json<AutomaReportPayload>,
) -> Result<Json<serde_json::Value>, AppError> {
    println!("[Engine] Received Automa Telemetry Report!");
    println!("[Engine] Detail keys: {:?}", payload.detail.as_object().map(|o| o.keys().collect::<Vec<_>>()));
    
    // TODO: Trigger AI Self-Healing logic here if the report indicates a failure.
    
    Ok(Json(serde_json::json!({
        "status": "received",
        "message": "Telemetry report processed"
    })))
}
