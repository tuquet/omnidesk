use sqlx::SqlitePool;

use crate::db::models::workflow::WorkflowRun;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;
use crate::services::browser_launcher::LauncherFactory;
use crate::services::browser_profile_service::BrowserProfileService;
use crate::api::handlers::automa::AutomaEvent;
use tauri::AppHandle;
use tokio::sync::broadcast::Sender;
use std::time::Duration;

/// WorkflowExecutor orchestrates a single workflow execution:
///
/// 1. Load workflow from SQLite
/// 2. Load browser profile + config
/// 3. Create a WorkflowRun record (status=RUNNING)
/// 4. Launch browser with profile (fingerprint, proxy, extensions)
/// 5. Wait for Extension to connect via WebSocket
/// 6. Send `execute_workflow` event with workflow JSON
/// 7. Collect block logs from Extension
/// 8. Finalize WorkflowRun with status + summary
///
/// For Phase 4, we implement steps 1-3 and record-keeping.
/// Steps 4-7 require Phase 5 (Extension Integration) to fully work.
pub struct WorkflowExecutor;

impl WorkflowExecutor {
    /// Execute a workflow with a given browser profile.
    ///
    /// This creates a WorkflowRun record and prepares the execution.
    /// Full browser launch + Extension control is Phase 5.
    pub async fn execute(
        db: &SqlitePool,
        app: &AppHandle,
        ws_tx: &Sender<AutomaEvent>,
        workflow_id: &str,
        profile_id: &str,
        schedule_id: Option<&str>,
    ) -> Result<WorkflowRun, AppError> {
        // 1. Verify workflow exists
        let workflow = WorkflowService::get_by_id(db, workflow_id).await?;
        println!("[Executor] Starting workflow '{}' ({})", workflow.name, workflow.id);

        // 1.5. Profile Lock Check - fail if profile is already in use
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
        let run = WorkflowService::create_run(
            db,
            workflow_id,
            Some(profile_id),
            schedule_id,
        ).await?;

        println!("[Executor] Created run {} for workflow '{}'", run.id, workflow.name);

        // 3. Launch browser with profile
        let profile = BrowserProfileService::get_by_id(db, profile_id).await?;
        let data_dir = BrowserProfileService::resolve_data_dir(app, &profile)?;
        
        {
            let launcher = LauncherFactory::create(profile.browser_type.as_deref().unwrap_or("chrome"));
            let init_url = format!("http://localhost:1424/init?profile_id={}", profile_id);
            launcher.launch(&profile, app, &data_dir, Some(&init_url))?;
        }

        // 4. Send execute_workflow event to any waiting extension connected on WS
        // Note: The extension connection is asynchronous. The RuntimeBridge connects
        // when the browser opens the init_url.
        // We broadcast it to the WS channel. A robust implementation would wait for
        // the `extension_ready` event before sending `execute_workflow`.
        
        // Wait briefly for the browser to launch and connect
        tokio::time::sleep(Duration::from_secs(3)).await;

        let payload = serde_json::json!({
            "run_id": run.id,
            "workflow": workflow
        });
        
        let event = AutomaEvent {
            event_type: "execute_workflow".to_string(),
            payload,
        };
        
        if let Err(e) = ws_tx.send(event) {
            eprintln!("[Executor] Failed to send execute_workflow event to WS: {}", e);
        }

        // For now: mark as RUNNING. The Extension will send block_started / block_finished
        // and eventually workflow_finished.
        WorkflowService::finish_run(
            db,
            &run.id,
            "RUNNING",
            None,
            Some(&format!("{{\"workflow_name\":\"{}\"}}", workflow.name)),
        ).await?;

        // Return the run record
        WorkflowService::get_run_by_id(db, &run.id).await
    }
}
