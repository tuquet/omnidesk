use crate::api::AppState;
use axum::{
    routing::get,
    Router,
};

/// Studio's automa router — provides only the bridge page.
/// The Automa WebSocket (`/ws`) is exclusively handled by Omni Engine,
/// since Engine is the sole Executor. Studio is a Designer/Monitor only.
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/bridge", get(omni_shared::automa::api::bridge_html))
}
