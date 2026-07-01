use crate::api::AppState;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use omni_shared::automa::AutomaEvent;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/ws", get(ws_handler))
        .route("/bridge", get(omni_shared::automa::api::bridge_html))
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
    let app_clone = state.app_handle.clone();

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

                use tauri::Emitter;
                let _ = app_clone.emit(
                    omni_tauri_core::constants::E2E_LOG_EVENT,
                    format!("[AUTOMA] Received event: {}", event.event_type),
                );

                // Process events directly in Studio DB
                let db = state.db.clone();
                match event.event_type.as_str() {
                    "run_started" => {
                        let _ = app_clone.emit(
                            omni_tauri_core::constants::E2E_LOG_EVENT,
                            "Run started (tracked in studio DB)",
                        );
                    }
                    "run_finished" => {
                        if let Some(run_id) = event.payload.get("run_id").and_then(|v| v.as_str()) {
                            let status = event
                                .payload
                                .get("status")
                                .and_then(|v| v.as_str())
                                .unwrap_or("COMPLETED");
                            let _ = crate::services::workflow_service::WorkflowService::finish_run(
                                &db, run_id, status, None, None,
                            )
                            .await;
                            let _ = app_clone.emit(
                                omni_tauri_core::constants::E2E_LOG_EVENT,
                                "Run finished (saved to studio DB)",
                            );
                        }
                    }
                    "log_added" => {
                        if let Some(run_id) = event.payload.get("run_id").and_then(|v| v.as_str()) {
                            let block_id = event
                                .payload
                                .get("block_id")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let block_label = event
                                .payload
                                .get("block_label")
                                .and_then(|v| v.as_str())
                                .unwrap_or("");
                            let status = event
                                .payload
                                .get("status")
                                .and_then(|v| v.as_str())
                                .unwrap_or("SUCCESS");

                            // Optional data parsing
                            let duration_ms =
                                event.payload.get("duration_ms").and_then(|v| v.as_i64());
                            let data = event.payload.get("data").and_then(|v| v.as_str());

                            let _ = crate::services::workflow_service::WorkflowService::add_log(
                                &db,
                                run_id,
                                block_id,
                                block_label,
                                status,
                                duration_ms,
                                data,
                            )
                            .await;
                        }
                    }

                    _ => {}
                }
            }
        }
    });

    // If either task finishes, abort the other one
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
}
