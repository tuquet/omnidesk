use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio_cron_scheduler::{Job, JobScheduler};
use sqlx::SqlitePool;
use uuid::Uuid as JobUuid;

use crate::db::models::workflow::Schedule;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;
use crate::services::workflow_executor::WorkflowExecutor;
use crate::db::models::workflow::WorkflowRun;
use tauri::AppHandle;
use tokio::sync::broadcast::Sender;
use crate::api::handlers::automa::AutomaEvent;

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

        // Load all enabled schedules
        let schedules = WorkflowService::get_enabled_schedules(&db).await?;
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
                if let Err(e) = WorkflowService::update_schedule_run_stats(&db, &schedule_id).await {
                    eprintln!("[Scheduler] Failed to update run stats: {:?}", e);
                }

                // Execute the workflow
                match WorkflowExecutor::execute(&db, &app_handle, &ws_tx, &workflow_id, &profile_id, Some(&schedule_id)).await {
                    Ok(run) => {
                        println!("[Scheduler] Run {} completed with status: {}", run.id, run.status);
                    }
                    Err(e) => {
                        eprintln!("[Scheduler] Execution failed: {:?}", e);
                        // Still create a failed run record
                        let _ = WorkflowService::create_run(&db, &workflow_id, Some(&profile_id), Some(&schedule_id)).await;
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
        WorkflowService::update_schedule_run_stats(db, &schedule.id).await?;

        // Execute
        WorkflowExecutor::execute(db, &self.app_handle, &self.automa_ws_tx, &schedule.workflow_id, &schedule.profile_id, Some(&schedule.id)).await
    }
}
