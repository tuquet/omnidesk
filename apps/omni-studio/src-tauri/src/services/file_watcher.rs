use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher, EventKind};
use std::path::{Path, PathBuf};
use tokio::sync::mpsc;
use sqlx::SqlitePool;

use crate::error::AppError;
use crate::db::models::workflow::Workflow;
use crate::services::workflow_service::WorkflowService;

/// FileWatcherService watches a local folder for .json workflow files.
/// When a file is created/modified/deleted, it syncs with the SQLite database.
/// The folder can be inside OneDrive for automatic cloud sync.
pub struct FileWatcherService {
    watch_dir: PathBuf,
    pool: SqlitePool,
    sync_tx: tokio::sync::broadcast::Sender<crate::api::handlers::sync_ws::SyncEvent>,
}

impl FileWatcherService {
    pub fn new(watch_dir: PathBuf, pool: SqlitePool, sync_tx: tokio::sync::broadcast::Sender<crate::api::handlers::sync_ws::SyncEvent>) -> Self {
        Self { watch_dir, pool, sync_tx }
    }

    /// Start watching the directory. Returns a handle to stop watching.
    /// This should be spawned as a tokio task.
    pub async fn start(self) -> Result<(), AppError> {
        let watch_dir = self.watch_dir.clone();

        // Ensure directory exists
        std::fs::create_dir_all(&watch_dir)
            .map_err(|e| AppError::Internal(format!("Failed to create watch dir: {}", e)))?;

        // Do initial import on startup
        self.import_all_from_dir().await?;

        let pool = self.pool.clone();
        let (tx, mut rx) = mpsc::channel::<Event>(100);

        // Spawn blocking watcher thread
        let watch_path = watch_dir.clone();
        std::thread::spawn(move || {
            let rt = tokio::runtime::Handle::current();
            let tx_clone = tx.clone();

            let mut watcher = RecommendedWatcher::new(
                move |res: Result<Event, notify::Error>| {
                    if let Ok(event) = res {
                        let _ = rt.block_on(async { tx_clone.send(event).await });
                    }
                },
                Config::default(),
            )
            .expect("Failed to create file watcher");

            watcher
                .watch(&watch_path, RecursiveMode::NonRecursive)
                .expect("Failed to start watching directory");

            // Keep thread alive — watcher drops when thread exits
            loop {
                std::thread::sleep(std::time::Duration::from_secs(3600));
            }
        });

        // Process events
        println!("FileWatcher: Watching {:?} for workflow changes", watch_dir);
        while let Some(event) = rx.recv().await {
            self.handle_event(&pool, &event).await;
        }

        Ok(())
    }

    /// Import all .json files from the watched directory into SQLite on startup
    async fn import_all_from_dir(&self) -> Result<(), AppError> {
        let entries = std::fs::read_dir(&self.watch_dir)
            .map_err(|e| AppError::Internal(format!("Failed to read dir: {}", e)))?;

        let mut count = 0;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "json") {
                match self.import_workflow_file(&path).await {
                    Ok(_) => count += 1,
                    Err(e) => eprintln!("FileWatcher: Failed to import {:?}: {:?}", path, e),
                }
            }
        }
        println!("FileWatcher: Imported {} workflows from {:?}", count, self.watch_dir);
        Ok(())
    }

    /// Handle a file system event
    async fn handle_event(&self, pool: &SqlitePool, event: &Event) {
        for path in &event.paths {
            // Only care about .json files
            if path.extension().is_none_or(|ext| ext != "json") {
                continue;
            }

            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) => {
                    println!("FileWatcher: Detected change in {:?}", path);
                    match self.import_workflow_file(path).await {
                        Ok(wf) => {
                            println!("FileWatcher: Upserted workflow '{}' ({})", wf.name, wf.id);
                            // Broadcast change to WebSocket
                            let event = crate::api::handlers::sync_ws::SyncEvent {
                                event_type: "workflows_changed".to_string(),
                                payload: serde_json::to_value(vec![wf]).unwrap_or_default(),
                            };
                            let _ = self.sync_tx.send(event);
                        }
                        Err(e) => eprintln!("FileWatcher: Failed to import {:?}: {:?}", path, e),
                    }
                }
                EventKind::Remove(_) => {
                    println!("FileWatcher: Detected deletion of {:?}", path);
                    if let Some(id) = Self::extract_id_from_filename(path) {
                        // Soft delete — don't permanently remove, user may want to recover
                        match WorkflowService::soft_delete(pool, &id, "file_watcher").await {
                            Ok(_) => {
                                println!("FileWatcher: Soft-deleted workflow {}", id);
                                let event = crate::api::handlers::sync_ws::SyncEvent {
                                    event_type: "workflow_deleted".to_string(),
                                    payload: serde_json::json!({ "id": id, "source": "file_watcher" }),
                                };
                                let _ = self.sync_tx.send(event);
                            }
                            Err(e) => eprintln!("FileWatcher: Failed to soft-delete {}: {:?}", id, e),
                        }
                    }
                }
                _ => {}
            }
        }
    }

    /// Read a .json file and upsert it into the database
    async fn import_workflow_file(&self, path: &Path) -> Result<Workflow, AppError> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| AppError::Internal(format!("Failed to read file: {}", e)))?;

        // First try to parse as strict Workflow
        if let Ok(workflow) = serde_json::from_str::<Workflow>(&content) {
            return WorkflowService::upsert(&self.pool, &workflow).await;
        }

        // Fallback to raw Automa export format
        if let Ok(mut value) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(obj) = value.as_object_mut() {
                let name_str = obj.get("name").and_then(|v| v.as_str()).unwrap_or("Untitled Workflow");
                let id = obj.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()).unwrap_or_else(|| {
                    uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_OID, name_str.as_bytes()).to_string()
                });
                let name = name_str.to_string();
                let icon = obj.get("icon").and_then(|v| v.as_str()).map(|s| s.to_string());
                let description = obj.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
                let drawflow = obj.get("drawflow").map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string());
                let settings = obj.get("settings").map(|v| v.to_string()).unwrap_or_else(|| "{}".to_string());
                let global_data = obj.get("globalData").map(|v| {
                    if v.is_string() { v.as_str().unwrap().to_string() } else { v.to_string() }
                });
                let version = obj.get("version").and_then(|v| v.as_str()).map(|s| s.to_string());
                
                let workflow = Workflow {
                    id,
                    name,
                    icon,
                    folder_id: None,
                    description,
                    drawflow,
                    settings,
                    trigger: None,
                    global_data,
                    table_data: None,
                    data_columns: None,
                    version,
                    is_disabled: Some(0),
                    source: Some("local_sync".to_string()),
                    created_at: None,
                    updated_at: None,
                    deleted_at: None,
                    delete_source: None,
                };

                return WorkflowService::upsert(&self.pool, &workflow).await;
            }
        }

        Err(AppError::BadRequest("Invalid workflow JSON".to_string()))
    }

    /// Export a workflow from the database to a .json file
    pub async fn export_workflow_file(watch_dir: &Path, workflow: &Workflow) -> Result<PathBuf, AppError> {
        let filename = format!("{}.json", workflow.id);
        let path = watch_dir.join(&filename);

        let json = serde_json::to_string_pretty(workflow)
            .map_err(|e| AppError::Internal(format!("Failed to serialize workflow: {}", e)))?;

        std::fs::write(&path, &json)
            .map_err(|e| AppError::Internal(format!("Failed to write file: {}", e)))?;

        println!("FileWatcher: Exported workflow '{}' to {:?}", workflow.name, path);
        Ok(path)
    }

    /// Extract workflow ID from filename: "uuid.json" → "uuid"
    fn extract_id_from_filename(path: &Path) -> Option<String> {
        path.file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
    }
}
