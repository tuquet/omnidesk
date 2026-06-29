use sqlx::SqlitePool;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::db::models::workflow::WorkflowRun;
use crate::error::AppError;
use crate::api::handlers::automa::AutomaEvent;
use tauri::AppHandle;
use tokio::sync::broadcast::Sender;
use std::time::Duration;

#[derive(Serialize, Deserialize)]
pub struct WorkflowResponse {
    pub id: String,
    pub name: String,
    // Add other fields as needed for the event
}

pub struct WorkflowExecutor;

impl WorkflowExecutor {
    pub async fn execute(
        db: &SqlitePool,
        _app: &AppHandle,
        ws_tx: &Sender<AutomaEvent>,
        workflow_id: &str,
        profile_id: &str,
        schedule_id: Option<&str>,
    ) -> Result<WorkflowRun, AppError> {
        // 1. Verify workflow exists by querying Omni Studio
        let client = Client::new();
        let studio_url = format!("http://127.0.0.1:1422/api/workflows/{}", workflow_id);
        
        let workflow_res = client.get(&studio_url).send().await;
        
        let workflow_name = match workflow_res {
            Ok(res) if res.status().is_success() => {
                let workflow: WorkflowResponse = res.json().await.map_err(|e| AppError::Internal(format!("Failed to parse workflow: {}", e)))?;
                workflow.name
            },
            Ok(res) => {
                return Err(AppError::NotFound(format!("Workflow {} not found (Studio returned {})", workflow_id, res.status())));
            },
            Err(e) => {
                return Err(AppError::Internal(format!("Failed to connect to Omni Studio: {}", e)));
            }
        };

        println!("[Executor] Starting workflow '{}' ({})", workflow_name, workflow_id);

        // 1.5. Profile Lock Check
        let active_runs: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM workflow_runs WHERE profile_id = ? AND status = 'RUNNING'"
        )
        .bind(profile_id)
        .fetch_one(db)
        .await
        .unwrap_or(0);

        if active_runs > 0 {
            eprintln!("[Executor] Profile {} is already in use by another workflow.", profile_id);
            return Err(AppError::BadRequest(format!("Profile {} is currently in use.", profile_id)));
        }

        // 2. Create run record
        let run_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        
        sqlx::query(
            "INSERT INTO workflow_runs (id, workflow_id, profile_id, schedule_id, status, started_at, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&run_id)
        .bind(workflow_id)
        .bind(profile_id)
        .bind(schedule_id)
        .bind("RUNNING")
        .bind(now)
        .bind(now)
        .bind(now)
        .execute(db)
        .await?;

        println!("[Executor] Created run {} for workflow '{}'", run_id, workflow_name);

        // 3. Launch browser via Profile Microservice (HTTP)
        let client = Client::new();
        let profile_api_url = format!("http://127.0.0.1:1421/api/browser-profiles/{}/launch", profile_id);
        
        let launch_res = client.post(&profile_api_url)
            .send()
            .await;
            
        if let Err(e) = launch_res {
            eprintln!("[Executor] Failed to call Profile API to launch browser: {}", e);
            return Err(AppError::Internal(format!("Failed to launch profile: {}", e)));
        }

        // Wait briefly for the browser to launch and connect
        tokio::time::sleep(Duration::from_secs(3)).await;

        let payload = serde_json::json!({
            "run_id": run_id,
            "workflow": {
                "id": workflow_id,
                "name": workflow_name
            }
        });
        
        let event = AutomaEvent {
            event_type: "execute_workflow".to_string(),
            payload,
        };
        
        if let Err(e) = ws_tx.send(event) {
            eprintln!("[Executor] Failed to send execute_workflow event to WS: {}", e);
        }

        // 4. Return the run record
        let run = sqlx::query_as::<_, WorkflowRun>("SELECT * FROM workflow_runs WHERE id = ?")
            .bind(&run_id)
            .fetch_one(db)
            .await?;

        Ok(run)
    }
}
