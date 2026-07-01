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

#[derive(serde::Deserialize)]
pub struct SyncQuery {
    pub profile_id: Option<String>,
}

/// WebSocket upgrade handler for sync
pub async fn ws_sync_handler(
    ws: WebSocketUpgrade,
    axum::extract::Query(query): axum::extract::Query<SyncQuery>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    println!("[SyncWS] Extension connecting... (profile_id: {:?})", query.profile_id);
    ws.on_upgrade(move |socket| handle_sync_socket(socket, state, query.profile_id))
}

async fn handle_sync_socket(socket: WebSocket, state: AppState, profile_id: Option<String>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.sync_tx.subscribe();

    println!("[SyncWS] Extension connected. Preparing sync payload...");

    // Send initial full sync on connect
    let workflows_to_sync = if let Some(ref pid) = profile_id {
        // Worker Mode: Selective Sync
        if let Ok(Some(run)) = WorkflowService::get_active_run_by_profile(&state.db, pid).await {
            println!("[SyncWS] Worker profile {} is running workflow {}. Extracting dependencies...", pid, run.workflow_id);
            WorkflowService::get_workflows_for_run(&state.db, &run.workflow_id).await.unwrap_or_default()
        } else {
            // No active run found for this profile, send empty
            println!("[SyncWS] Worker profile {} has no active run.", pid);
            vec![]
        }
    } else {
        // Master Mode: Full Sync
        WorkflowService::get_all(&state.db).await.unwrap_or_default()
    };

    let event = SyncEvent {
        event_type: "full_sync".to_string(),
        payload: serde_json::to_value(&workflows_to_sync).unwrap_or_default(),
    };
    if let Ok(msg) = serde_json::to_string(&event) {
        let _ = sender.send(Message::Text(msg)).await;
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
    let profile_id_clone = profile_id.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    if let Ok(ext_msg) = serde_json::from_str::<ExtensionMessage>(&text) {
                        handle_extension_message(&db, &sync_tx, &app_dir, ext_msg, profile_id_clone.as_deref()).await;
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
    profile_id: Option<&str>,
) {
    match msg.msg_type.as_str() {
        "push_workflows" => {
            if let Some(pid) = profile_id {
                println!("[SyncWS] Ignoring push_workflows from worker profile {}", pid);
                return;
            }

            if let Some(payload) = msg.payload {
                if let Ok(workflows) = serde_json::from_value::<Vec<Workflow>>(payload) {
                    let watch_dir = app_dir.join("workflows");
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
            println!("[SyncWS] Ignored delete_workflow request from Extension. Deletion must happen via Studio UI.");
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
        "workflow_run_started" => {
            if let Some(payload) = msg.payload {
                if let (Some(id), Some(workflow_id)) = (
                    payload.get("id").and_then(|v| v.as_str()),
                    payload.get("workflowId").and_then(|v| v.as_str()),
                ) {
                    let _ = WorkflowService::create_run(db, Some(id), workflow_id, profile_id, None).await;
                    println!("[SyncWS] Workflow run started: {}", id);
                }
            }
        }
        "workflow_log" => {
            if let Some(payload) = msg.payload {
                if let (Some(run_id), Some(block_id), Some(block_label), Some(status)) = (
                    payload.get("runId").and_then(|v| v.as_str()),
                    payload.get("blockId").and_then(|v| v.as_str()),
                    payload.get("blockLabel").and_then(|v| v.as_str()),
                    payload.get("status").and_then(|v| v.as_str()),
                ) {
                    let duration_ms = payload.get("durationMs").and_then(|v| v.as_i64());
                    let data = payload.get("data").map(|v| serde_json::to_string(v).unwrap_or_default());
                    
                    let _ = WorkflowService::add_log(
                        db, run_id, block_id, block_label, status, duration_ms, data.as_deref()
                    ).await;
                    println!("[SyncWS] Added log for run {}: block {}", run_id, block_id);
                }
            }
        }
        "workflow_run_finished" => {
            if let Some(payload) = msg.payload {
                if let (Some(run_id), Some(status)) = (
                    payload.get("runId").and_then(|v| v.as_str()),
                    payload.get("status").and_then(|v| v.as_str()),
                ) {
                    let error = payload.get("error").and_then(|v| v.as_str());
                    let summary = payload.get("summary").and_then(|v| v.as_str());
                    
                    let _ = WorkflowService::finish_run(db, run_id, status, error, summary).await;
                    println!("[SyncWS] Workflow run finished: {}", run_id);
                }
            }
        }
        _ => {
            println!("[SyncWS] Unknown message type: {}", msg.msg_type);
        }
    }
}
