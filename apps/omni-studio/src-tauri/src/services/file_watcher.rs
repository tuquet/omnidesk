use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use sqlx::SqlitePool;
use std::path::{Path, PathBuf};
use tokio::sync::mpsc;

use crate::db::models::workflow::Workflow;
use crate::error::AppError;
use crate::services::workflow_service::WorkflowService;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// FileWatcherService watches a local folder for .json workflow files.
/// When a file is created/modified/deleted, it syncs with the SQLite database.
/// The folder can be inside OneDrive for automatic cloud sync.
pub struct FileWatcherService {
    watch_dir: PathBuf,
    pool: SqlitePool,
    sync_tx: tokio::sync::broadcast::Sender<crate::api::handlers::sync_ws::SyncEvent>,
    path_to_id: Arc<Mutex<HashMap<PathBuf, String>>>,
}

impl FileWatcherService {
    pub fn new(
        watch_dir: PathBuf,
        pool: SqlitePool,
        sync_tx: tokio::sync::broadcast::Sender<crate::api::handlers::sync_ws::SyncEvent>,
    ) -> Self {
        Self {
            watch_dir,
            pool,
            sync_tx,
            path_to_id: Arc::new(Mutex::new(HashMap::new())),
        }
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
        let rt = tokio::runtime::Handle::current();
        std::thread::spawn(move || {
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
        log::info!("FileWatcher: Watching {:?} for workflow changes", watch_dir);
        while let Some(event) = rx.recv().await {
            self.handle_event(&pool, &event).await;
        }

        Ok(())
    }

    /// Import all .json files from the watched directory into SQLite on startup and reconcile deletions
    async fn import_all_from_dir(&self) -> Result<(), AppError> {
        // 1. Get all active workflows from DB
        let active_workflows = WorkflowService::get_all(&self.pool).await?;
        let db_ids: std::collections::HashSet<String> =
            active_workflows.into_iter().map(|w| w.id).collect();

        // 2. Read the directory and upsert files
        let entries = std::fs::read_dir(&self.watch_dir)
            .map_err(|e| AppError::Internal(format!("Failed to read dir: {}", e)))?;

        let mut file_ids = std::collections::HashSet::new();
        let mut count = 0;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().is_some_and(|ext| ext == "json") {
                match self.import_workflow_file(&path).await {
                    Ok(wf) => {
                        let expected_filename = format!("{}.automa.json", wf.id);
                        let mut final_path = path.clone();

                        if path.file_name().and_then(|s| s.to_str()) != Some(&expected_filename) {
                            let new_path = path.with_file_name(&expected_filename);
                            if std::fs::rename(&path, &new_path).is_ok() {
                                final_path = new_path;
                                log::info!(
                                    "FileWatcher: Auto-renamed {:?} to {:?}",
                                    path,
                                    final_path
                                );
                            }
                        }

                        self.path_to_id
                            .lock()
                            .unwrap()
                            .insert(final_path, wf.id.clone());
                        file_ids.insert(wf.id);
                        count += 1;
                    }
                    Err(e) => eprintln!("FileWatcher: Failed to import {:?}: {:?}", path, e),
                }
            }
        }

        // 3. Reconcile: Soft-delete DB workflows not found in the filesystem
        let mut deleted_count = 0;
        for id in db_ids {
            if !file_ids.contains(&id) {
                if WorkflowService::soft_delete(&self.pool, &id, "reconciliation")
                    .await
                    .is_ok()
                {
                    deleted_count += 1;
                }
            }
        }

        log::info!(
            "FileWatcher: Reconciled {:?} - Imported {}, Soft-deleted {} missing workflows",
            self.watch_dir,
            count,
            deleted_count
        );
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
                    log::info!("FileWatcher: Detected change in {:?}", path);
                    match self.import_workflow_file(path).await {
                        Ok(wf) => {
                            let expected_filename = format!("{}.automa.json", wf.id);
                            let mut final_path = path.clone();

                            if path.file_name().and_then(|s| s.to_str()) != Some(&expected_filename)
                            {
                                let new_path = path.with_file_name(&expected_filename);
                                if std::fs::rename(path, &new_path).is_ok() {
                                    final_path = new_path;
                                    log::info!(
                                        "FileWatcher: Auto-renamed {:?} to {:?}",
                                        path,
                                        final_path
                                    );
                                }
                            }

                            self.path_to_id
                                .lock()
                                .unwrap()
                                .insert(final_path, wf.id.clone());
                            log::info!("FileWatcher: Upserted workflow '{}' ({})", wf.name, wf.id);
                            // Broadcast change to WebSocket
                            let event = crate::api::handlers::sync_ws::SyncEvent {
                                event_type: "workflows_changed".to_string(),
                                payload: serde_json::to_value(vec![wf]).unwrap_or_default(),
                            };
                            let _ = self.sync_tx.send(event);
                        }
                        Err(e) => log::error!("FileWatcher: Failed to import {:?}: {:?}", path, e),
                    }
                }
                EventKind::Remove(_) => {
                    log::info!("FileWatcher: Detected deletion of {:?}", path);

                    // Retrieve the ID associated with this path, fallback to filename parsing
                    let id_opt = {
                        let mut map = self.path_to_id.lock().unwrap();
                        map.remove(path)
                            .or_else(|| Self::extract_id_from_filename(path))
                    };

                    if let Some(id) = id_opt {
                        // Soft delete — don't permanently remove, user may want to recover
                        match WorkflowService::soft_delete(pool, &id, "file_watcher").await {
                            Ok(_) => {
                                log::info!("FileWatcher: Soft-deleted workflow {}", id);
                                let event = crate::api::handlers::sync_ws::SyncEvent {
                                    event_type: "workflow_deleted".to_string(),
                                    payload: serde_json::json!({ "id": id, "source": "file_watcher" }),
                                };
                                let _ = self.sync_tx.send(event);
                            }
                            Err(e) => {
                                log::error!("FileWatcher: Failed to soft-delete {}: {:?}", id, e)
                            }
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
                let name_str = obj
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Untitled Workflow");
                let id = obj
                    .get("id")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        uuid::Uuid::new_v5(&uuid::Uuid::NAMESPACE_OID, name_str.as_bytes())
                            .to_string()
                    });
                let name = name_str.to_string();
                let icon = obj
                    .get("icon")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                let description = obj
                    .get("description")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                let drawflow = obj
                    .get("drawflow")
                    .map(|v| {
                        if v.is_string() {
                            v.as_str().unwrap().to_string()
                        } else {
                            v.to_string()
                        }
                    })
                    .unwrap_or_else(|| "{}".to_string());
                let settings = obj
                    .get("settings")
                    .map(|v| {
                        if v.is_string() {
                            v.as_str().unwrap().to_string()
                        } else {
                            v.to_string()
                        }
                    })
                    .unwrap_or_else(|| "{}".to_string());
                let global_data = obj.get("globalData").map(|v| {
                    if v.is_string() {
                        v.as_str().unwrap().to_string()
                    } else {
                        v.to_string()
                    }
                });
                let version = obj
                    .get("version")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

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
                    content: None,
                    connected_table: None,
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
    pub async fn export_workflow_file(
        watch_dir: &Path,
        workflow: &Workflow,
    ) -> Result<PathBuf, AppError> {
        let filename = format!("{}.automa.json", workflow.id);
        let path = watch_dir.join(&filename);

        let json = serde_json::to_string_pretty(workflow)
            .map_err(|e| AppError::Internal(format!("Failed to serialize workflow: {}", e)))?;

        std::fs::write(&path, &json)
            .map_err(|e| AppError::Internal(format!("Failed to write file: {}", e)))?;

        log::info!(
            "FileWatcher: Exported workflow '{}' to {:?}",
            workflow.name,
            path
        );
        Ok(path)
    }

    /// Helper to extract workflow ID from a filename (e.g. `uuid.automa.json` -> `uuid`)
    fn extract_id_from_filename(path: &Path) -> Option<String> {
        let filename = path.file_name()?.to_str()?;
        if filename.ends_with(".automa.json") {
            Some(filename.trim_end_matches(".automa.json").to_string())
        } else if filename.ends_with(".json") {
            Some(filename.trim_end_matches(".json").to_string())
        } else {
            None
        }
    }
}
