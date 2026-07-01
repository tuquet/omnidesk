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
            let profile_api_url = format!("http://127.0.0.1:1421/api/browser-profiles/{}/launch", profile_id);
            
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

        // Wait briefly for the browser to launch and connect
        tokio::time::sleep(Duration::from_secs(3)).await;

        // If the caller provided the full workflow_json, we send it, otherwise we just send id and name.
        let workflow_payload = workflow_json.unwrap_or_else(|| {
            serde_json::json!({
                "id": workflow_id,
                "name": workflow_name
            })
        });
        
        let payload = serde_json::json!({
            "run_id": run_id,
            "workflow": workflow_payload,
            "variables": variables
        });
        
        let event = AutomaEvent {
            event_type: "execute_workflow".to_string(),
            payload,
        };
        
        if let Err(e) = ws_tx.send(event) {
            eprintln!("[SharedExecutor] Failed to send execute_workflow event to WS: {}", e);
        }

        Ok(exec_result)
    }
}
