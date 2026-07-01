use sqlx::SqlitePool;
use reqwest::Client;
use tokio::sync::broadcast::Sender;
use std::time::Duration;
use crate::error::AppError;
use serde_json::Value;

// Provide the AutomaEvent structure so we can use it across apps
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AutomaEvent {
    pub event_type: String,
    pub payload: Value,
}

pub enum ExecutionResult {
    NeedsDefaultBrowser { run_id: String, bridge_url: String },
    LaunchedProfile { run_id: String },
}

pub struct SharedWorkflowExecutor;

impl SharedWorkflowExecutor {
    /// Executes a workflow, returning the intent for the caller to handle side-effects (e.g. launching a browser).
    #[allow(clippy::too_many_arguments)]
    pub async fn execute(
        db: &SqlitePool,
        ws_tx: &Sender<AutomaEvent>,
        workflow_id: &str,
        workflow_name: &str,
        workflow_json: Option<Value>,
        profile_id: &str,
        schedule_id: Option<&str>,
        variables: Option<Value>,
        server_port: u16,
        profile_port: u16,
    ) -> Result<ExecutionResult, AppError> {
        
        // 1. Profile Lock Check
        let active_runs: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM workflow_runs WHERE profile_id = ? AND status = 'RUNNING'"
        )
        .bind(profile_id)
        .fetch_one(db)
        .await
        .unwrap_or(0);

        if active_runs > 0 && profile_id != "default" {
            eprintln!("[SharedExecutor] Profile {} is already in use.", profile_id);
            return Err(AppError::BadRequest(format!("Profile {} is currently in use.", profile_id)));
        }

        // 2. Create run record in the local database
        let run_id = uuid::Uuid::new_v4().to_string();
        
        sqlx::query(
            "INSERT INTO workflow_runs (id, workflow_id, profile_id, schedule_id, status, started_at) 
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
        )
        .bind(&run_id)
        .bind(workflow_id)
        .bind(profile_id)
        .bind(schedule_id)
        .bind("RUNNING")
        .execute(db)
        .await?;

        println!("[SharedExecutor] Created run {} for workflow '{}'", run_id, workflow_name);

        // 3. Prepare launch instructions
        let bridge_url = format!("http://127.0.0.1:{}/api/automa/bridge?run_id={}&profile_id={}", server_port, run_id, profile_id);
        
        let exec_result = if profile_id == "default" {
            ExecutionResult::NeedsDefaultBrowser { run_id: run_id.clone(), bridge_url }
        } else {
            let client = Client::new();
            let profile_api_url = format!("http://127.0.0.1:{}/api/browser-profiles/{}/launch", profile_port, profile_id);
            
            let launch_res = client.post(&profile_api_url)
                .query(&[("startup_url", &bridge_url)])
                .send()
                .await;
                
            if let Err(e) = launch_res {
                eprintln!("[SharedExecutor] Failed to call Profile API to launch browser: {}", e);
                return Err(AppError::Internal(format!("Failed to launch profile: {}", e)));
            }
            ExecutionResult::LaunchedProfile { run_id: run_id.clone() }
        };

        // Spawn the waiting and broadcasting logic in the background
        // so we can return immediately and allow the caller to open the browser.
        let ws_tx_clone = ws_tx.clone();
        let run_id_inner = run_id.clone();
        let workflow_id_inner = workflow_id.to_string();
        let workflow_name_inner = workflow_name.to_string();
        let db_clone = db.clone();
        tokio::spawn(async move {
            // Wait dynamically for the browser to launch and connect to the WebSocket.
            // We poll receiver_count() up to 10 seconds.
            let mut connected = false;
            for _ in 0..20 {
                if ws_tx_clone.receiver_count() > 0 {
                    connected = true;
                    break;
                }
                tokio::time::sleep(Duration::from_millis(500)).await;
            }

            if !connected {
                eprintln!("[SharedExecutor] Timeout waiting for browser to connect to Automa Bridge. URL might not have opened correctly.");
                let _ = sqlx::query("UPDATE workflow_runs SET status = 'ERROR', error_message = 'Timeout: Browser failed to connect to the Bridge (The URL may not have opened correctly in your default browser). Try keeping the browser open before running.', finished_at = CURRENT_TIMESTAMP WHERE id = ?")
                    .bind(&run_id_inner)
                    .execute(&db_clone)
                    .await;
                return;
            }

            // Add a safe buffer to ensure the extension has fully initialized its message listeners
            // after the socket is established.
            tokio::time::sleep(Duration::from_secs(2)).await;

            // If the caller provided the full workflow_json, we send it, otherwise we just send id and name.
            let workflow_payload = workflow_json.unwrap_or_else(|| {
                serde_json::json!({
                    "id": workflow_id_inner,
                    "name": workflow_name_inner
                })
            });
            
            let payload = serde_json::json!({
                "run_id": run_id_inner,
                "workflow": workflow_payload,
                "variables": variables
            });
            
            let event = AutomaEvent {
                event_type: omni_tauri_core::constants::WS_EXECUTE_WORKFLOW.to_string(),
                payload,
            };

            let _ = ws_tx_clone.send(event);
            println!("[SharedExecutor] Broadcasted execute_workflow for run {}", run_id_inner);
        });

        Ok(exec_result)
    }
}
