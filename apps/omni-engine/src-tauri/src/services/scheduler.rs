use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio_cron_scheduler::{Job, JobScheduler};
use sqlx::SqlitePool;
use uuid::Uuid as JobUuid;

use crate::db::models::workflow::Schedule;
use crate::error::AppError;
use omni_shared::automa::executor::{SharedWorkflowExecutor, ExecutionResult};
use crate::db::models::workflow::WorkflowRun;
use tauri::AppHandle;
use tokio::sync::broadcast::Sender;
use omni_shared::automa::AutomaEvent;

/// SchedulerService manages cron jobs for automated workflow execution.
///
/// It wraps `tokio-cron-scheduler` and maps Schedule IDs to internal Job UUIDs
/// so we can add/remove/update individual schedules at runtime.
#[derive(Clone)]
pub struct SchedulerService {
    scheduler: Arc<JobScheduler>,
    /// Maps schedule_id → internal job UUID (for removal)
    job_map: Arc<RwLock<HashMap<String, JobUuid>>>,
    db: SqlitePool,
    app_handle: AppHandle,
    automa_ws_tx: Sender<AutomaEvent>,
}

impl SchedulerService {
    /// Create and start the scheduler, loading all enabled schedules from DB
    pub async fn start(
        db: SqlitePool,
        app_handle: AppHandle,
        automa_ws_tx: Sender<AutomaEvent>
    ) -> Result<Self, AppError> {
        let scheduler = JobScheduler::new().await
            .map_err(|e| AppError::Internal(format!("Failed to create scheduler: {}", e)))?;

        let service = Self {
            scheduler: Arc::new(scheduler),
            job_map: Arc::new(RwLock::new(HashMap::new())),
            db: db.clone(),
            app_handle,
            automa_ws_tx,
        };

        let schedules = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE is_enabled = 1")
            .fetch_all(&db)
            .await
            .unwrap_or_default();
        println!("[Scheduler] Loading {} enabled schedules", schedules.len());

        for schedule in &schedules {
            if let Err(e) = service.add_schedule(schedule).await {
                eprintln!("[Scheduler] Failed to register '{}': {:?}", schedule.name, e);
            }
        }

        // Start the scheduler
        service.scheduler.start().await
            .map_err(|e| AppError::Internal(format!("Failed to start scheduler: {}", e)))?;

        println!("[Scheduler] Started successfully");
        Ok(service)
    }

    /// Add a new schedule as a cron job
    pub async fn add_schedule(&self, schedule: &Schedule) -> Result<(), AppError> {
        let schedule_id = schedule.id.clone();
        let workflow_id = schedule.workflow_id.clone();
        let profile_id = schedule.profile_id.clone();
        let schedule_name = schedule.name.clone();
        let db = self.db.clone();
        let app_handle = self.app_handle.clone();
        let ws_tx = self.automa_ws_tx.clone();

        let cron_expr = &schedule.cron_expr;

        let job = Job::new_async(cron_expr.as_str(), move |_uuid, _lock| {
            let db = db.clone();
            let app_handle = app_handle.clone();
            let ws_tx = ws_tx.clone();
            let schedule_id = schedule_id.clone();
            let workflow_id = workflow_id.clone();
            let profile_id = profile_id.clone();
            let schedule_name = schedule_name.clone();

            Box::pin(async move {
                println!("[Scheduler] Firing schedule '{}' (workflow={}, profile={})",
                    schedule_name, workflow_id, profile_id);

                // Update run stats
                let now = chrono::Utc::now().timestamp_millis();
                let _ = sqlx::query(
                    "UPDATE schedules SET last_run_at = ?, run_count = run_count + 1 WHERE id = ?"
                )
                .bind(now)
                .bind(&schedule_id)
                .execute(&db)
                .await;

                // Fetch full workflow payload
                // Fetch full workflow payload
                let record = sqlx::query_as::<_, crate::db::models::workflow::Workflow>(
                    "SELECT * FROM workflows WHERE id = ?"
                )
                .bind(&workflow_id)
                .fetch_optional(&db)
                .await
                .unwrap_or_default();
            
                let (workflow_name, workflow_json) = if let Some(w) = record {
                    let payload = omni_shared::automa::workflow::WorkflowPayload::from_raw(
                        w.id,
                        w.name.clone(),
                        w.icon,
                        w.folder_id,
                        w.description,
                        w.drawflow,
                        w.settings,
                        w.trigger,
                        w.global_data,
                        w.table_data,
                        w.data_columns,
                        w.version,
                        w.is_disabled,
                        w.source,
                        w.created_at,
                        w.updated_at,
                        w.deleted_at,
                        w.delete_source,
                    );
                    (w.name, Some(serde_json::to_value(&payload).unwrap_or(serde_json::json!({}))))
                } else {
                    (schedule_name.clone(), None)
                };

                match SharedWorkflowExecutor::execute(&db, &ws_tx, &workflow_id, &workflow_name, workflow_json, &profile_id, Some(&schedule_id), None, 1423).await {
                    Ok(exec_result) => {
                        let run_id = match exec_result {
                            ExecutionResult::NeedsDefaultBrowser { run_id, bridge_url } => {
                                use tauri_plugin_opener::OpenerExt;
                                if let Err(e) = app_handle.opener().open_url(&bridge_url, None::<&str>) {
                                    eprintln!("[Scheduler] Failed to open default browser: {}", e);
                                }
                                run_id
                            },
                            ExecutionResult::LaunchedProfile { run_id } => run_id,
                        };
                        println!("[Scheduler] Run {} started successfully.", run_id);
                    }
                    Err(e) => {
                        eprintln!("[Scheduler] Execution failed: {:?}", e);
                        // Still create a failed run record
                        let run_id = uuid::Uuid::new_v4().to_string();
                        let _ = sqlx::query(
                            "INSERT INTO workflow_runs (id, workflow_id, profile_id, schedule_id, status, started_at, created_at, updated_at) 
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                        )
                        .bind(&run_id)
                        .bind(&workflow_id)
                        .bind(&profile_id)
                        .bind(&schedule_id)
                        .bind("FAILED")
                        .bind(now)
                        .bind(now)
                        .bind(now)
                        .execute(&db)
                        .await;
                    }
                }
            })
        })
        .map_err(|e| AppError::Internal(format!("Invalid cron expression '{}': {}", cron_expr, e)))?;

        let job_uuid = job.guid();
        self.scheduler.add(job).await
            .map_err(|e| AppError::Internal(format!("Failed to add job: {}", e)))?;

        self.job_map.write().await.insert(schedule.id.clone(), job_uuid);
        println!("[Scheduler] Registered: '{}' [{}]", schedule.name, schedule.cron_expr);

        Ok(())
    }

    /// Remove a schedule's cron job
    pub async fn remove_schedule(&self, schedule_id: &str) {
        let mut map = self.job_map.write().await;
        if let Some(job_uuid) = map.remove(schedule_id) {
            if let Err(e) = self.scheduler.remove(&job_uuid).await {
                eprintln!("[Scheduler] Failed to remove job {}: {:?}", schedule_id, e);
            } else {
                println!("[Scheduler] Removed schedule {}", schedule_id);
            }
        }
    }

    /// Update a schedule: remove old job, add new one
    pub async fn update_schedule(&self, schedule: &Schedule) -> Result<(), AppError> {
        self.remove_schedule(&schedule.id).await;
        self.add_schedule(schedule).await
    }

    /// Execute a schedule immediately (bypass cron)
    pub async fn execute_now(&self, db: &SqlitePool, schedule: &Schedule) -> Result<WorkflowRun, AppError> {
        println!("[Scheduler] Manual trigger: '{}' (workflow={}, profile={})",
            schedule.name, schedule.workflow_id, schedule.profile_id);

        // Update run stats
        let now = chrono::Utc::now().timestamp_millis();
        let _ = sqlx::query(
            "UPDATE schedules SET last_run_at = ?, run_count = run_count + 1 WHERE id = ?"
        )
        .bind(now)
        .bind(&schedule.id)
        .execute(db)
        .await;

        let workflow_name = schedule.name.clone();
        let exec_result = SharedWorkflowExecutor::execute(
            db, 
            &self.automa_ws_tx, 
            &schedule.workflow_id, 
            &workflow_name, 
            None, 
            &schedule.profile_id, 
            Some(&schedule.id), 
            None, 
            1423
        ).await?;

        let run_id = match exec_result {
            ExecutionResult::NeedsDefaultBrowser { run_id, bridge_url } => {
                use tauri_plugin_opener::OpenerExt;
                if let Err(e) = self.app_handle.opener().open_url(&bridge_url, None::<&str>) {
                    eprintln!("[Scheduler] Failed to open default browser: {}", e);
                }
                run_id
            },
            ExecutionResult::LaunchedProfile { run_id } => run_id,
        };
        
        // Construct a dummy WorkflowRun for the response
        Ok(WorkflowRun {
            id: run_id,
            workflow_id: schedule.workflow_id.clone(),
            profile_id: Some(schedule.profile_id.clone()),
            schedule_id: Some(schedule.id.clone()),
            status: "LAUNCHING".to_string(),
            started_at: Some(chrono::Utc::now().to_rfc3339()),
            finished_at: None,
            created_at: Some(chrono::Utc::now().to_rfc3339()),
            error_message: None,
            summary: None,
        })
    }
}
