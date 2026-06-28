use axum::{
    extract::{State, ws::{WebSocket, WebSocketUpgrade, Message}},
    http::StatusCode,
    routing::{get, post},
    response::IntoResponse,
    Router,
};
use crate::api::AppState;
use serde::{Deserialize, Serialize};
use futures_util::{sink::SinkExt, stream::StreamExt};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomaEvent {
    pub event_type: String,
    pub payload: serde_json::Value,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/run", post(run_e2e))
        .route("/ws", get(ws_handler))
}

#[utoipa::path(
    get,
    path = "/api/automa/ws",
    responses(
        (status = 101, description = "WebSocket connection established")
    )
)]
pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.automa_ws_tx.subscribe();

    // Spawn a task to receive messages from the broadcast channel and send to the WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(msg) = serde_json::to_string(&event) {
                if sender.send(Message::Text(msg)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Spawn a task to receive messages from the WebSocket client and process them
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            if let Ok(event) = serde_json::from_str::<AutomaEvent>(&text) {
                println!("Received event from Automa Extension: {}", event.event_type);
                // Here we can handle events coming FROM the browser extension
                // For example, workflow_finished, logs, etc.
            }
        }
    });

    // If either task finishes, abort the other one
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
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
    
    // Broadcast an event to all connected extensions to run a workflow (just as an example)
    let event = AutomaEvent {
        event_type: "execute_workflow".to_string(),
        payload: serde_json::json!({ "workflow_id": "test-id" }),
    };
    let _ = state.automa_ws_tx.send(event);

    match crate::commands::e2e::run_e2e_orchestrator(app).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            eprintln!("Failed to run e2e: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
