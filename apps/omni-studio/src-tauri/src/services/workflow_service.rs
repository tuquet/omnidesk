use sqlx::SqlitePool;
use uuid::Uuid;
use crate::error::AppError;
use crate::db::models::workflow::{Workflow, WorkflowRun, WorkflowLog};

pub struct WorkflowService;

impl WorkflowService {
    // ─── Workflow CRUD ───────────────────────────────────────────

    pub async fn get_all(pool: &SqlitePool) -> Result<Vec<Workflow>, AppError> {
        let workflows = sqlx::query_as::<_, Workflow>(
            r#"
            SELECT id, name, icon, folder_id, description, drawflow, settings, trigger,
                   global_data, table_data, data_columns, version, is_disabled, source,
                   CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at,
                   CAST(deleted_at AS TEXT) as deleted_at, delete_source
            FROM workflows
            WHERE deleted_at IS NULL
            ORDER BY updated_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(workflows)
    }

    pub async fn get_trash(pool: &SqlitePool) -> Result<Vec<Workflow>, AppError> {
        let workflows = sqlx::query_as::<_, Workflow>(
            r#"
            SELECT id, name, icon, folder_id, description, drawflow, settings, trigger,
                   global_data, table_data, data_columns, version, is_disabled, source,
                   CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at,
                   CAST(deleted_at AS TEXT) as deleted_at, delete_source
            FROM workflows
            WHERE deleted_at IS NOT NULL
            ORDER BY deleted_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(workflows)
    }

    pub async fn get_by_id(pool: &SqlitePool, id: &str) -> Result<Workflow, AppError> {
        let workflow = sqlx::query_as::<_, Workflow>(
            r#"
            SELECT id, name, icon, folder_id, description, drawflow, settings, trigger,
                   global_data, table_data, data_columns, version, is_disabled, source,
                   CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at,
                   CAST(deleted_at AS TEXT) as deleted_at, delete_source
            FROM workflows
            WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Workflow {} not found", id)))?;

        Ok(workflow)
    }

    pub async fn create(pool: &SqlitePool, workflow: &Workflow) -> Result<Workflow, AppError> {
        let id = if workflow.id.is_empty() {
            Uuid::now_v7().to_string()
        } else {
            workflow.id.clone()
        };

        sqlx::query(
            r#"
            INSERT INTO workflows (id, name, icon, folder_id, description, drawflow, settings,
                                   trigger, global_data, table_data, data_columns, version, is_disabled, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(&workflow.name)
        .bind(&workflow.icon)
        .bind(&workflow.folder_id)
        .bind(&workflow.description)
        .bind(&workflow.drawflow)
        .bind(&workflow.settings)
        .bind(&workflow.trigger)
        .bind(&workflow.global_data)
        .bind(&workflow.table_data)
        .bind(&workflow.data_columns)
        .bind(&workflow.version)
        .bind(workflow.is_disabled)
        .bind(&workflow.source)
        .execute(pool)
        .await?;

        Self::get_by_id(pool, &id).await
    }

    pub async fn update(pool: &SqlitePool, id: &str, workflow: &Workflow) -> Result<Workflow, AppError> {
        let result = sqlx::query(
            r#"
            UPDATE workflows
            SET name = ?, icon = ?, folder_id = ?, description = ?, drawflow = ?, settings = ?,
                trigger = ?, global_data = ?, table_data = ?, data_columns = ?, version = ?,
                is_disabled = ?, source = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(&workflow.name)
        .bind(&workflow.icon)
        .bind(&workflow.folder_id)
        .bind(&workflow.description)
        .bind(&workflow.drawflow)
        .bind(&workflow.settings)
        .bind(&workflow.trigger)
        .bind(&workflow.global_data)
        .bind(&workflow.table_data)
        .bind(&workflow.data_columns)
        .bind(&workflow.version)
        .bind(workflow.is_disabled)
        .bind(&workflow.source)
        .bind(id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Workflow {} not found", id)));
        }

        Self::get_by_id(pool, id).await
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM workflows WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Workflow {} not found", id)));
        }

        Ok(())
    }

    /// Upsert a workflow (used by sync from Extension — insert or update if exists)
    pub async fn upsert(pool: &SqlitePool, workflow: &Workflow) -> Result<Workflow, AppError> {
        sqlx::query(
            r#"
            INSERT INTO workflows (id, name, icon, folder_id, description, drawflow, settings,
                                   trigger, global_data, table_data, data_columns, version, is_disabled, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                icon = excluded.icon,
                folder_id = excluded.folder_id,
                description = excluded.description,
                drawflow = excluded.drawflow,
                settings = excluded.settings,
                trigger = excluded.trigger,
                global_data = excluded.global_data,
                table_data = excluded.table_data,
                data_columns = excluded.data_columns,
                version = excluded.version,
                is_disabled = excluded.is_disabled,
                source = excluded.source,
                updated_at = CURRENT_TIMESTAMP,
                deleted_at = NULL,
                delete_source = NULL
            "#
        )
        .bind(&workflow.id)
        .bind(&workflow.name)
        .bind(&workflow.icon)
        .bind(&workflow.folder_id)
        .bind(&workflow.description)
        .bind(&workflow.drawflow)
        .bind(&workflow.settings)
        .bind(&workflow.trigger)
        .bind(&workflow.global_data)
        .bind(&workflow.table_data)
        .bind(&workflow.data_columns)
        .bind(&workflow.version)
        .bind(workflow.is_disabled)
        .bind(&workflow.source)
        .execute(pool)
        .await?;

        Self::get_by_id(pool, &workflow.id).await
    }

    /// Soft delete — mark as deleted instead of removing from DB
    pub async fn soft_delete(pool: &SqlitePool, id: &str, source: &str) -> Result<(), AppError> {
        let result = sqlx::query(
            "UPDATE workflows SET deleted_at = CURRENT_TIMESTAMP, delete_source = ? WHERE id = ? AND deleted_at IS NULL"
        )
        .bind(source)
        .bind(id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Workflow {} not found or already deleted", id)));
        }

        Ok(())
    }

    /// Restore a soft-deleted workflow
    pub async fn restore(pool: &SqlitePool, id: &str) -> Result<Workflow, AppError> {
        sqlx::query(
            "UPDATE workflows SET deleted_at = NULL, delete_source = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(id)
        .execute(pool)
        .await?;

        Self::get_by_id(pool, id).await
    }

    /// Duplicate an existing workflow
    pub async fn duplicate(pool: &SqlitePool, id: &str) -> Result<Workflow, AppError> {
        let original = Self::get_by_id(pool, id).await?;
        
        let new_id = uuid::Uuid::new_v4().to_string();
        let new_name = format!("{} (Copy)", original.name);
        
        let mut new_workflow = original.clone();
        new_workflow.id = new_id.clone();
        new_workflow.name = new_name.clone();
        // Reset timestamps and source fields
        new_workflow.created_at = None;
        new_workflow.updated_at = None;
        new_workflow.deleted_at = None;
        new_workflow.delete_source = None;
        new_workflow.source = Some("studio".to_string());
        
        Self::create(pool, &new_workflow).await?;
        
        Self::get_by_id(pool, &new_id).await
    }

    /// Get workflows changed since a timestamp (for sync catch-up after reconnect)
    /// Returns both active and soft-deleted workflows so the client can apply deletions
    pub async fn get_changed_since(pool: &SqlitePool, since: &str) -> Result<Vec<Workflow>, AppError> {
        let workflows = sqlx::query_as::<_, Workflow>(
            r#"
            SELECT id, name, icon, folder_id, description, drawflow, settings, trigger,
                   global_data, table_data, data_columns, version, is_disabled, source,
                   CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at,
                   CAST(deleted_at AS TEXT) as deleted_at, delete_source
            FROM workflows
            WHERE updated_at > ? OR deleted_at > ?
            ORDER BY updated_at DESC
            "#
        )
        .bind(since)
        .bind(since)
        .fetch_all(pool)
        .await?;

        Ok(workflows)
    }

    // ─── Dependency Graph ────────────────────────────────────────

    /// Extracts dependencies recursively by parsing the `drawflow` JSON
    pub async fn get_dependencies(pool: &SqlitePool, root_id: &str) -> Result<std::collections::HashSet<String>, AppError> {
        let mut deps = std::collections::HashSet::new();
        let mut queue = vec![root_id.to_string()];
        
        while let Some(current_id) = queue.pop() {
            if deps.contains(&current_id) {
                continue;
            }
            
            // Mark as visited/required
            deps.insert(current_id.clone());

            // Fetch the workflow JSON
            let wf = match Self::get_by_id(pool, &current_id).await {
                Ok(w) => w,
                Err(_) => continue, // If missing, ignore
            };

            // Parse drawflow to find execute-workflow nodes
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&wf.drawflow) {
                // Format 1: drawflow.Home.data
                if let Some(nodes) = value.pointer("/drawflow/Home/data").and_then(|v| v.as_object()) {
                    for (_, node) in nodes {
                        if let Some(name) = node.get("name").and_then(|v| v.as_str()) {
                            if name == "execute-workflow" {
                                if let Some(dep_id) = node.pointer("/data/workflowId").and_then(|v| v.as_str()) {
                                    if !deps.contains(dep_id) {
                                        queue.push(dep_id.to_string());
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Format 2: nodes array
                if let Some(nodes) = value.get("nodes").and_then(|v| v.as_array()) {
                    for node in nodes {
                        if let Some(label) = node.get("label").and_then(|v| v.as_str()) {
                            if label == "execute-workflow" {
                                if let Some(dep_id) = node.pointer("/data/workflowId").and_then(|v| v.as_str()) {
                                    if !deps.contains(dep_id) {
                                        queue.push(dep_id.to_string());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        Ok(deps)
    }

    /// Fetches only the required workflows for a specific root workflow (Selective Sync)
    pub async fn get_workflows_for_run(pool: &SqlitePool, root_id: &str) -> Result<Vec<Workflow>, AppError> {
        let deps = Self::get_dependencies(pool, root_id).await?;
        if deps.is_empty() {
            return Ok(vec![]);
        }

        let ids_csv = deps.into_iter().map(|s| format!("'{}'", s.replace("'", "''"))).collect::<Vec<_>>().join(",");
        let query_str = format!(
            r#"
            SELECT id, name, icon, folder_id, description, drawflow, settings, trigger,
                   global_data, table_data, data_columns, version, is_disabled, source,
                   CAST(created_at AS TEXT) as created_at, CAST(updated_at AS TEXT) as updated_at,
                   CAST(deleted_at AS TEXT) as deleted_at, delete_source
            FROM workflows
            WHERE deleted_at IS NULL AND id IN ({})
            ORDER BY updated_at DESC
            "#,
            ids_csv
        );

        let workflows = sqlx::query_as::<_, Workflow>(&query_str)
            .fetch_all(pool)
            .await?;

        Ok(workflows)
    }

    // ─── Workflow Runs ───────────────────────────────────────────

    pub async fn create_run(pool: &SqlitePool, id_opt: Option<&str>, workflow_id: &str, profile_id: Option<&str>, schedule_id: Option<&str>) -> Result<WorkflowRun, AppError> {
        let id = id_opt.map(|s| s.to_string()).unwrap_or_else(|| Uuid::now_v7().to_string());

        sqlx::query(
            r#"
            INSERT INTO workflow_runs (id, workflow_id, profile_id, schedule_id, status, started_at)
            VALUES (?, ?, ?, ?, 'RUNNING', CURRENT_TIMESTAMP)
            "#
        )
        .bind(&id)
        .bind(workflow_id)
        .bind(profile_id)
        .bind(schedule_id)
        .execute(pool)
        .await?;

        Self::get_run_by_id(pool, &id).await
    }

    pub async fn get_run_by_id(pool: &SqlitePool, id: &str) -> Result<WorkflowRun, AppError> {
        let run = sqlx::query_as::<_, WorkflowRun>(
            r#"
            SELECT id, workflow_id, profile_id, schedule_id, status,
                   CAST(started_at AS TEXT) as started_at,
                   CAST(finished_at AS TEXT) as finished_at,
                   error_message, summary,
                   CAST(created_at AS TEXT) as created_at
            FROM workflow_runs
            WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Run {} not found", id)))?;

        Ok(run)
    }

    pub async fn get_runs_by_workflow(pool: &SqlitePool, workflow_id: &str) -> Result<Vec<WorkflowRun>, AppError> {
        let runs = sqlx::query_as::<_, WorkflowRun>(
            r#"
            SELECT id, workflow_id, profile_id, schedule_id, status,
                   CAST(started_at AS TEXT) as started_at,
                   CAST(finished_at AS TEXT) as finished_at,
                   error_message, summary,
                   CAST(created_at AS TEXT) as created_at
            FROM workflow_runs
            WHERE workflow_id = ?
            ORDER BY created_at DESC
            LIMIT 50
            "#
        )
        .bind(workflow_id)
        .fetch_all(pool)
        .await?;

        Ok(runs)
    }

    pub async fn get_active_run_by_profile(pool: &SqlitePool, profile_id: &str) -> Result<Option<WorkflowRun>, AppError> {
        let run = sqlx::query_as::<_, WorkflowRun>(
            r#"
            SELECT id, workflow_id, profile_id, schedule_id, status,
                   CAST(started_at AS TEXT) as started_at,
                   CAST(finished_at AS TEXT) as finished_at,
                   error_message, summary,
                   CAST(created_at AS TEXT) as created_at
            FROM workflow_runs
            WHERE profile_id = ? AND status = 'RUNNING'
            ORDER BY created_at DESC
            LIMIT 1
            "#
        )
        .bind(profile_id)
        .fetch_optional(pool)
        .await?;

        Ok(run)
    }

    pub async fn finish_run(pool: &SqlitePool, id: &str, status: &str, error: Option<&str>, summary: Option<&str>) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE workflow_runs
            SET status = ?, finished_at = CURRENT_TIMESTAMP, error_message = ?, summary = ?
            WHERE id = ?
            "#
        )
        .bind(status)
        .bind(error)
        .bind(summary)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }

    // ─── Workflow Logs ───────────────────────────────────────────

    pub async fn add_log(pool: &SqlitePool, run_id: &str, block_id: &str, block_label: &str, status: &str, duration_ms: Option<i64>, data: Option<&str>) -> Result<(), AppError> {
        let id = Uuid::now_v7().to_string();

        sqlx::query(
            r#"
            INSERT INTO workflow_logs (id, run_id, block_id, block_label, status, duration_ms, data)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(run_id)
        .bind(block_id)
        .bind(block_label)
        .bind(status)
        .bind(duration_ms)
        .bind(data)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get_logs_by_run(pool: &SqlitePool, run_id: &str) -> Result<Vec<WorkflowLog>, AppError> {
        let logs = sqlx::query_as::<_, WorkflowLog>(
            r#"
            SELECT id, run_id, block_id, block_label, status, duration_ms, data,
                   CAST(timestamp AS TEXT) as timestamp
            FROM workflow_logs
            WHERE run_id = ?
            ORDER BY timestamp ASC
            "#
        )
        .bind(run_id)
        .fetch_all(pool)
        .await?;

        Ok(logs)
    }
}
