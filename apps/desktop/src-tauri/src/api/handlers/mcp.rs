use axum::{
    extract::{Query, State},
    response::sse::{Event, Sse},
    Json,
};
use futures_util::stream::Stream;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use tokio::sync::mpsc;
use uuid::Uuid;
use axum::http::StatusCode;

use crate::api::AppState;

#[derive(Deserialize)]
pub struct SessionQuery {
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: Option<serde_json::Value>,
    pub method: String,
    pub params: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<serde_json::Value>,
}

pub async fn mcp_sse(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let session_id = Uuid::now_v7().to_string();
    let (tx, mut rx) = mpsc::channel::<serde_json::Value>(32);

    // Register session
    state.mcp_sessions.write().await.insert(session_id.clone(), tx);

    let session_id_clone = session_id.clone();
    
    let stream = async_stream::stream! {
        // Send the endpoint event as required by MCP SSE transport
        let endpoint_event = Event::default()
            .event("endpoint")
            .data(format!("/mcp/messages?sessionId={}", session_id_clone));
        
        yield Ok(endpoint_event);

        while let Some(msg) = rx.recv().await {
            let msg_str = serde_json::to_string(&msg).unwrap_or_default();
            yield Ok(Event::default().event("message").data(msg_str));
        }
    };

    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(std::time::Duration::from_secs(15))
            .text("keep-alive-text"),
    )
}

pub async fn mcp_messages(
    State(state): State<AppState>,
    Query(query): Query<SessionQuery>,
    Json(payload): Json<JsonRpcRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let session_id = query.session_id.ok_or((StatusCode::BAD_REQUEST, "Missing sessionId".to_string()))?;
    
    let sessions = state.mcp_sessions.read().await;
    let tx = sessions.get(&session_id).ok_or((StatusCode::BAD_REQUEST, "Invalid sessionId".to_string()))?.clone();
    drop(sessions); // Release read lock

    // Process the MCP request in background to not block the POST response
    let db = state.db.clone();
    tokio::spawn(async move {
        let response = handle_mcp_request(payload, db).await;
        let _ = tx.send(serde_json::to_value(response).unwrap()).await;
    });

    Ok(StatusCode::ACCEPTED)
}

async fn handle_mcp_request(req: JsonRpcRequest, _db: sqlx::SqlitePool) -> JsonRpcResponse {
    let mut response = JsonRpcResponse {
        jsonrpc: "2.0".to_string(),
        id: req.id.clone().unwrap_or(serde_json::Value::Null),
        result: None,
        error: None,
    };

    match req.method.as_str() {
        "initialize" => {
            response.result = Some(serde_json::json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {}
                },
                "serverInfo": {
                    "name": "omnidesk-mcp",
                    "version": "0.1.0"
                }
            }));
        }
        "notifications/initialized" => {
            // Do nothing
        }
        "tools/list" => {
            response.result = Some(serde_json::json!({
                "tools": [
                    {
                        "name": "get_keyring",
                        "description": "Read an encrypted secret from the local OS Keyring via PKI",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "service": { "type": "string" },
                                "account": { "type": "string" }
                            },
                            "required": ["service", "account"]
                        }
                    },
                    {
                        "name": "sync_command",
                        "description": "Queue an AI command into the global sync_queue",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "target_device": { "type": "string" },
                                "command": { "type": "string" }
                            },
                            "required": ["command"]
                        }
                    }
                ]
            }));
        }
        "resources/list" => {
            response.result = Some(serde_json::json!({
                "resources": [
                    {
                        "uri": "sqlite://user_installed_apps",
                        "name": "Installed Apps",
                        "description": "List of currently installed apps in OmniDesk"
                    }
                ]
            }));
        }
        "resources/read" => {
            if let Some(params) = req.params {
                if let Some(uri) = params.get("uri").and_then(|u| u.as_str()) {
                    if uri == "sqlite://user_installed_apps" {
                        let mut apps: Vec<String> = Vec::new();
                        // Query actual installed apps from local SQLite DB
                        if let Ok(rows) = sqlx::query("SELECT DISTINCT app_id FROM user_installed_apps")
                            .fetch_all(&_db)
                            .await
                        {
                            use sqlx::Row;
                            for row in rows {
                                if let Ok(app_id) = row.try_get::<String, _>("app_id") {
                                    apps.push(app_id);
                                }
                            }
                        }
                        response.result = Some(serde_json::json!({
                            "contents": [
                                {
                                    "uri": uri,
                                    "mimeType": "application/json",
                                    "text": serde_json::to_string(&apps).unwrap_or_else(|_| "[]".to_string())
                                }
                            ]
                        }));
                    } else {
                        response.error = Some(serde_json::json!({"code": -32602, "message": "Resource not found"}));
                    }
                }
            }
        }
        "tools/call" => {
            if let Some(params) = req.params {
                let name = params.get("name").and_then(|n| n.as_str()).unwrap_or("");
                let args = params.get("arguments").cloned().unwrap_or(serde_json::Value::Null);
                
                match name {
                    "get_keyring" => {
                        let service = args.get("service").and_then(|s| s.as_str()).unwrap_or("");
                        let account = args.get("account").and_then(|a| a.as_str()).unwrap_or("");
                        
                        let result_text = if service.is_empty() || account.is_empty() {
                            "Service and account must not be empty.".to_string()
                        } else {
                            match keyring::Entry::new(service, account) {
                                Ok(entry) => match entry.get_password() {
                                    Ok(secret) => secret,
                                    Err(e) => format!("Error: Credential not found or inaccessible: {}", e),
                                },
                                Err(e) => format!("Error: Keyring access failed: {}", e),
                            }
                        };
                        
                        response.result = Some(serde_json::json!({
                            "content": [
                                {
                                    "type": "text",
                                    "text": result_text
                                }
                            ]
                        }));
                    }
                    "sync_command" => {
                        let cmd = args.get("command").and_then(|c| c.as_str()).unwrap_or("");
                        let target_device = args.get("target_device").and_then(|t| t.as_str()).unwrap_or("cloud");
                        
                        let result_text = if cmd.is_empty() {
                            "Command must not be empty.".to_string()
                        } else {
                            let job_id = uuid::Uuid::now_v7().to_string();
                            let user_id = "mcp-system-user";
                            
                            let payload = serde_json::json!({
                                "command": cmd,
                                "target_device": target_device,
                            }).to_string();
                            
                            match crate::services::crypto::get_or_generate_keypair(user_id) {
                                Ok((_priv, pub_key)) => {
                                    match crate::services::crypto::encrypt_payload(&pub_key, &payload) {
                                        Ok(encrypted_payload) => {
                                            let db_result = sqlx::query(
                                                "INSERT INTO sync_queue (id, user_id, action, payload) VALUES (?, ?, ?, ?)"
                                            )
                                            .bind(&job_id)
                                            .bind(user_id)
                                            .bind("SYNC_COMMAND")
                                            .bind(encrypted_payload)
                                            .execute(&_db)
                                            .await;
                                            
                                            match db_result {
                                                Ok(_) => format!("Queued command '{}' (job_id: {}) to sync_queue successfully.", cmd, job_id),
                                                Err(e) => format!("Failed to insert command into sync_queue: {}", e),
                                            }
                                        }
                                        Err(e) => format!("Failed to encrypt command: {:?}", e),
                                    }
                                }
                                Err(e) => format!("Failed to get/generate keypair for MCP user: {:?}", e),
                            }
                        };
                        
                        response.result = Some(serde_json::json!({
                            "content": [
                                {
                                    "type": "text",
                                    "text": result_text
                                }
                            ]
                        }));
                    }
                    _ => {
                        response.error = Some(serde_json::json!({"code": -32601, "message": "Tool not found"}));
                    }
                }
            } else {
                response.error = Some(serde_json::json!({"code": -32602, "message": "Missing params"}));
            }
        }
        _ => {
            response.error = Some(serde_json::json!({
                "code": -32601,
                "message": format!("Method {} not found", req.method)
            }));
        }
    }

    response
}
