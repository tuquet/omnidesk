use sqlx::SqlitePool;
use tauri::{AppHandle, Emitter};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{StreamExt, SinkExt};
use serde_json::{json, Value};
use url::Url;
use std::time::Duration;
use crate::error::AppError;

fn get_supabase_config() -> Result<(String, String), AppError> {
    let url = std::env::var("VITE_SUPABASE_URL")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_URL".to_string()))?;
    let key = std::env::var("VITE_SUPABASE_ANON_KEY")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_ANON_KEY".to_string()))?;
    Ok((url, key))
}

pub fn start_realtime_listener(app_handle: AppHandle, pool: SqlitePool) {
    tokio::spawn(async move {
        loop {
            if let Err(e) = connect_and_listen(app_handle.clone(), pool.clone()).await {
                eprintln!("[Realtime] Connection error: {:?}. Reconnecting in 5s...", e);
            }
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    });
}

async fn connect_and_listen(app_handle: AppHandle, pool: SqlitePool) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let (supabase_url, anon_key) = get_supabase_config().map_err(|e| format!("{:?}", e))?;
    
    let ws_url = if supabase_url.starts_with("http://") {
        supabase_url.replace("http://", "ws://")
    } else {
        supabase_url.replace("https://", "wss://")
    };
    
    let url_str = format!("{}/realtime/v1/websocket?apikey={}&vsn=1.0.0", ws_url, anon_key);
    let url = Url::parse(&url_str)?;
    
    println!("[Realtime] Connecting to {}", ws_url);
    
    let (ws_stream, _) = connect_async(url).await?;
    println!("[Realtime] Connected!");
    
    let (mut write, mut read) = ws_stream.split();
    
    let join_payload = json!({
        "topic": "realtime:public:user_installed_apps",
        "event": "phx_join",
        "payload": {
            "config": {
                "postgres_changes": [
                    {
                        "event": "*",
                        "schema": "public",
                        "table": "user_installed_apps"
                    }
                ]
            }
        },
        "ref": "1"
    });
    
    write.send(Message::Text(join_payload.to_string().into())).await?;
    
    let mut interval = tokio::time::interval(Duration::from_secs(30));
    
    loop {
        tokio::select! {
            _ = interval.tick() => {
                let heartbeat = json!({
                    "topic": "phoenix",
                    "event": "heartbeat",
                    "payload": {},
                    "ref": "2"
                });
                write.send(Message::Text(heartbeat.to_string().into())).await?;
            }
            msg = read.next() => {
                let msg = match msg {
                    Some(Ok(m)) => m,
                    Some(Err(e)) => return Err(Box::new(e)),
                    None => return Err("WebSocket stream closed".into()),
                };
                
                if let Ok(text) = msg.to_text() {
                    if let Ok(value) = serde_json::from_str::<Value>(text) {
                        if value["event"] == "postgres_changes" {
                            let payload = &value["payload"];
                            let event_type = payload["type"].as_str().unwrap_or("");
                            
                            println!("[Realtime] Received DB change: {}", event_type);
                            
                            match event_type {
                                "INSERT" | "UPDATE" => {
                                    let record = &payload["record"];
                                    if let (Some(user_id), Some(app_id)) = (record["user_id"].as_str(), record["app_id"].as_str()) {
                                        let _ = sqlx::query("INSERT INTO user_installed_apps (user_id, app_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
                                            .bind(user_id)
                                            .bind(app_id)
                                            .execute(&pool)
                                            .await;
                                        
                                        let _ = app_handle.emit("app-list-updated", json!({ "user_id": user_id, "action": "installed", "app_id": app_id }));
                                    }
                                }
                                "DELETE" => {
                                    let old_record = &payload["old_record"];
                                    if let (Some(user_id), Some(app_id)) = (old_record["user_id"].as_str(), old_record["app_id"].as_str()) {
                                        let _ = sqlx::query("DELETE FROM user_installed_apps WHERE user_id = ? AND app_id = ?")
                                            .bind(user_id)
                                            .bind(app_id)
                                            .execute(&pool)
                                            .await;
                                            
                                        let _ = app_handle.emit("app-list-updated", json!({ "user_id": user_id, "action": "uninstalled", "app_id": app_id }));
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }
}
