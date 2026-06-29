use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// Global application error type.
/// Wraps all lower-level errors (SQLx, IO, Auth) into a unified type that can be
/// converted into an HTTP Response for Axum, or a String for Tauri Commands.
#[derive(Debug)]
pub enum AppError {
    /// Database errors
    Database(sqlx::Error),
    /// Authentication/Authorization errors
    Unauthorized(String),
    /// Resource not found
    NotFound(String),
    /// Invalid request or business logic failure
    BadRequest(String),
    /// Internal server errors
    Internal(String),
}

// Map sqlx::Error into our AppError automatically
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Database(err)
    }
}

// Convert our AppError into an Axum Response automatically
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(err) => {
                eprintln!("Database error: {:?}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal database error".to_string())
            }
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => {
                eprintln!("Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        let body = Json(json!({
            "error": {
                "message": error_message
            }
        }));

        (status, body).into_response()
    }
}

// Convert AppError into a String for Tauri IPC (Tauri commands require errors to implement Serialize, 
// but returning a String is the most common pattern).
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        match err {
            AppError::Database(e) => format!("Database error: {}", e),
            AppError::Unauthorized(msg) => format!("Unauthorized: {}", msg),
            AppError::NotFound(msg) => format!("Not found: {}", msg),
            AppError::BadRequest(msg) => format!("Bad request: {}", msg),
            AppError::Internal(msg) => format!("Internal error: {}", msg),
        }
    }
}
