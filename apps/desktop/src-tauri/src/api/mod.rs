pub mod auth;

use axum::{Router, routing::get, response::IntoResponse, Json};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use utoipa::OpenApi;
use utoipa_scalar::{Scalar, Servable};

use auth::Claims;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health_check,
        ping,
        latest_update,
        me
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "auth", description = "Authenticated endpoints")
    )
)]
struct ApiDoc;

pub async fn serve(pool: SqlitePool, port: u16) {
    let state = AppState { db: pool };

    let app = Router::new()
        .route("/", get(|| async { axum::response::Redirect::temporary("/scalar") }))
        .merge(Scalar::with_url("/scalar", ApiDoc::openapi()))
        .route("/health", get(health_check))
        .route("/ping", get(ping))
        .route("/updates/latest.json", get(latest_update))
        .route("/api/me", get(me))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("API Server running on http://{}", addr);

    if let Ok(listener) = TcpListener::bind(addr).await {
        let _ = axum::serve(listener, app).await;
    } else {
        eprintln!("Failed to bind to port {}", port);
    }
}

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Returns health status of the API")
    )
)]
async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "kbm-backend"
    }))
}

#[utoipa::path(
    get,
    path = "/ping",
    responses(
        (status = 200, description = "Returns pong")
    )
)]
async fn ping() -> &'static str {
    "pong"
}

#[utoipa::path(
    get,
    path = "/updates/latest.json",
    responses(
        (status = 200, description = "Returns latest update info for dev")
    )
)]
async fn latest_update() -> impl IntoResponse {
    // Trong môi trường dev, luôn trả về version lớn hơn (ví dụ 0.1.1)
    Json(serde_json::json!({
        "version": "0.1.1",
        "notes": "Test update from Dev Server",
        "pub_date": chrono::Utc::now().to_rfc3339(),
        "platforms": {
            "windows-x86_64": {
                "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVSdEw0U1Avc1JmNnBCbXNRb2QzNVRzWmlqUThlSWl6K3k0NllZVk10OUhPMnhyTElhK0E4aFFzTTVNTHBVT2pYOG90ZlRYak5mZExvWEdKSUh5am1kKzBHTTRKdjFldGdzPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzE4MDI3MzQ5CWZpbGU6dXBkYXRlLnppcApaNklYcml3Vzlkd3J0N240aUVQakc2M0hCRWkyRVZBTnI5Mzl3YkoxSU03U3N6ckl2d2QvMnlGcnI0UldGQUcwUWR3a2JWMk05VHJlSHBBTVBNek5CQT09Cg==",
                "url": "http://127.0.0.1:1421/downloads/update.zip"
            }
        }
    }))
}

/// Protected: Returns the authenticated user's info from their JWT claims.
#[utoipa::path(
    get,
    path = "/api/me",
    responses(
        (status = 200, description = "Returns authenticated user info"),
        (status = 401, description = "Unauthorized — missing or invalid token")
    )
)]
async fn me(claims: Claims) -> impl IntoResponse {
    Json(serde_json::json!({
        "user_id": claims.user_id(),
        "email": claims.email,
        "is_admin": claims.is_admin(),
        "role": claims.role,
    }))
}
