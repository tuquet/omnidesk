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
                log::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Internal database error: {:?}", err),
                )
            }
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => {
                log::error!("Internal error: {}", msg);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
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

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Database(e) => write!(f, "Database error: {}", e),
            AppError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            AppError::NotFound(msg) => write!(f, "Not found: {}", msg),
            AppError::BadRequest(msg) => write!(f, "Bad request: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

// Convert AppError into a String for Tauri IPC (Tauri commands require errors to implement Serialize,
// but returning a String is the most common pattern).
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

// Implement Serialize so Tauri commands can return Result<T, AppError> natively.
impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<omni_shared::error::AppError> for AppError {
    fn from(err: omni_shared::error::AppError) -> Self {
        match err {
            omni_shared::error::AppError::Database(e) => AppError::Database(e),
            omni_shared::error::AppError::Unauthorized(msg) => AppError::Unauthorized(msg),
            omni_shared::error::AppError::NotFound(msg) => AppError::NotFound(msg),
            omni_shared::error::AppError::BadRequest(msg) => AppError::BadRequest(msg),
            omni_shared::error::AppError::Internal(msg) => AppError::Internal(msg),
        }
    }
}

impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::Internal(err)
    }
}

impl From<&str> for AppError {
    fn from(err: &str) -> Self {
        AppError::Internal(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}

