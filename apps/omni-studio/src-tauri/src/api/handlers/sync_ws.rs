use axum::{
    extract::{State, ws::{WebSocket, WebSocketUpgrade, Message}},
    response::IntoResponse,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};

use crate::api::AppState;
use crate::db::models::workflow::Workflow;
use crate::services::workflow_service::WorkflowService;

/// Sync event sent via WebSocket to the Extension
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncEvent {
    /// Event type: "workflows_changed", "workflow_deleted", "full_sync"
    pub event_type: String,
    /// Payload containing workflow data
    pub payload: serde_json::Value,
}

/// Incoming message from Extension via WebSocket
#[derive(Debug, Deserialize)]
pub struct ExtensionMessage {
    /// Message type: "push_workflows", "delete_workflow", "request_full_sync"
    pub msg_type: String,
    pub payload: Option<serde_json::Value>,
}

/// WebSocket upgrade handler for sync
pub async fn ws_sync_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    println!("[SyncWS] Extension connecting...");
    ws.on_upgrade(|socket| handle_sync_socket(socket, state))
}

async fn handle_sync_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.sync_tx.subscribe();

    println!("[SyncWS] Extension connected. Sending full sync...");

    // Send initial full sync on connect
    if let Ok(workflows) = WorkflowService::get_all(&state.db).await {
        let event = SyncEvent {
            event_type: "full_sync".to_string(),
            payload: serde_json::to_value(&workflows).unwrap_or_default(),
        };
        if let Ok(msg) = serde_json::to_string(&event) {
            let _ = sender.send(Message::Text(msg)).await;
        }
    }

    // Task 1: broadcast channel → WS client (push to Extension)
    let mut send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(msg) = serde_json::to_string(&event) {
                if sender.send(Message::Text(msg)).await.is_err() {
                    break;
                }
            }
        }
    });

    // Task 2: WS client → server (receive from Extension)
    let db = state.db.clone();
    let sync_tx = state.sync_tx.clone();
    let app_dir = state.app_dir.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ext_msg) = serde_json::from_str::<ExtensionMessage>(&text) {
                        handle_extension_message(&db, &sync_tx, &app_dir, ext_msg).await;
                    }
                }
                Message::Ping(data) => {
                    // Pong is sent automatically by axum
                    println!("[SyncWS] Received ping ({} bytes)", data.len());
                }
                Message::Close(_) => {
                    println!("[SyncWS] Extension disconnected");
                    break;
                }
                _ => {}
            }
        }
    });

    // Cleanup: abort sibling when one finishes
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    println!("[SyncWS] Connection closed");
}

/// Handle a message received from the Extension
async fn handle_extension_message(
    db: &sqlx::SqlitePool,
    sync_tx: &tokio::sync::broadcast::Sender<SyncEvent>,
    app_dir: &std::path::Path,
    msg: ExtensionMessage,
) {
    match msg.msg_type.as_str() {
        "push_workflows" => {
            if let Some(payload) = msg.payload {
                if let Ok(workflows) = serde_json::from_value::<Vec<Workflow>>(payload) {
                    let watch_dir = app_dir.join("automa-workflows");
                    let _ = std::fs::create_dir_all(&watch_dir);

                    let mut count = 0;
                    for wf in &workflows {
                        if WorkflowService::upsert(db, wf).await.is_ok() {
                            // Export to JSON for OneDrive sync
                            let _ = crate::services::file_watcher::FileWatcherService::export_workflow_file(&watch_dir, wf).await;
                            count += 1;
                        }
                    }
                    println!("[SyncWS] Received {} workflows from Extension", count);
                }
            }
        }
        "delete_workflow" => {
            if let Some(payload) = msg.payload {
                if let Some(id) = payload.get("id").and_then(|v| v.as_str()) {
                    // Extension is master — hard delete when Extension says so
                    match WorkflowService::delete(db, id).await {
                        Ok(_) => {
                            // Remove JSON file too
                            let file_path = app_dir.join("automa-workflows").join(format!("{}.json", id));
                            let _ = std::fs::remove_file(&file_path);
                            println!("[SyncWS] Deleted workflow {} (from Extension)", id);
                        }
                        Err(e) => eprintln!("[SyncWS] Failed to delete {}: {:?}", id, e),
                    }
                }
            }
        }
        "request_full_sync" => {
            // Extension requesting all workflows (e.g., after reconnect)
            if let Ok(workflows) = WorkflowService::get_all(db).await {
                let event = SyncEvent {
                    event_type: "full_sync".to_string(),
                    payload: serde_json::to_value(&workflows).unwrap_or_default(),
                };
                let _ = sync_tx.send(event);
                println!("[SyncWS] Full sync requested, sent {} workflows", workflows.len());
            }
        }
        _ => {
            println!("[SyncWS] Unknown message type: {}", msg.msg_type);
        }
    }
}
