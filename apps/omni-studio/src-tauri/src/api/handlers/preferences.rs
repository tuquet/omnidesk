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
    let home_screen_order = payload.home_screen_order;
    
    let res = sqlx::query("INSERT INTO user_preferences (user_id, home_screen_order) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET home_screen_order = excluded.home_screen_order, updated_at = CURRENT_TIMESTAMP")
        .bind(&user_id)
        .bind(&home_screen_order)
        .execute(pool)
        .await;
        
    if let Err(e) = res {
        eprintln!("Failed to update home screen order in DB: {}", e);
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    }

    let job_id = uuid::Uuid::now_v7().to_string();
    let payload_json = serde_json::json!({
        "user_id": user_id,
        "home_screen_order": serde_json::from_str::<serde_json::Value>(&home_screen_order).unwrap_or(serde_json::json!([]))
    });

    if let Ok((_priv_key, pub_key)) = crate::services::crypto::get_or_generate_keypair(&user_id) {
        if let Ok(encrypted_payload) = crate::services::crypto::encrypt_payload(&pub_key, &payload_json.to_string()) {
            let _ = sqlx::query("INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)")
                .bind(job_id)
                .bind(&user_id)
                .bind("UPDATE_PREFERENCES")
                .bind(encrypted_payload)
                .execute(pool)
                .await;
        }
    }

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
) -> Result<Json<String>, StatusCode> {
    let pool = &state.db;
    let user_id = claims.user_id();
    
    let result: Option<String> = sqlx::query_scalar("SELECT home_screen_order FROM user_preferences WHERE user_id = ?")
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            eprintln!("Failed to get home layout: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(result.unwrap_or_else(|| "[]".to_string())))
}
