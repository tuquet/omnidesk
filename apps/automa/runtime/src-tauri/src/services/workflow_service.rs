use sqlx::SqlitePool;
use uuid::Uuid;
use crate::error::AppError;
use crate::db::models::workflow::{Workflow, WorkflowRun, WorkflowLog, Schedule};

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
        .bind(&workflow.is_disabled)
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
        .bind(&workflow.is_disabled)
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
                updated_at = CURRENT_TIMESTAMP
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
        .bind(&workflow.is_disabled)
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

    // ─── Workflow Runs ───────────────────────────────────────────

    pub async fn create_run(pool: &SqlitePool, workflow_id: &str, profile_id: Option<&str>, schedule_id: Option<&str>) -> Result<WorkflowRun, AppError> {
        let id = Uuid::now_v7().to_string();

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

    // ─── Schedule CRUD ───────────────────────────────────────────

    pub async fn get_all_schedules(pool: &SqlitePool) -> Result<Vec<Schedule>, AppError> {
        let schedules = sqlx::query_as::<_, Schedule>(
            r#"
            SELECT id, name, workflow_id, profile_id, cron_expr, is_enabled,
                   CAST(last_run_at AS TEXT) as last_run_at,
                   CAST(next_run_at AS TEXT) as next_run_at,
                   run_count,
                   CAST(created_at AS TEXT) as created_at,
                   CAST(updated_at AS TEXT) as updated_at
            FROM schedules
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(schedules)
    }

    pub async fn get_enabled_schedules(pool: &SqlitePool) -> Result<Vec<Schedule>, AppError> {
        let schedules = sqlx::query_as::<_, Schedule>(
            r#"
            SELECT id, name, workflow_id, profile_id, cron_expr, is_enabled,
                   CAST(last_run_at AS TEXT) as last_run_at,
                   CAST(next_run_at AS TEXT) as next_run_at,
                   run_count,
                   CAST(created_at AS TEXT) as created_at,
                   CAST(updated_at AS TEXT) as updated_at
            FROM schedules
            WHERE is_enabled = 1
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(schedules)
    }

    pub async fn get_schedule_by_id(pool: &SqlitePool, id: &str) -> Result<Schedule, AppError> {
        let schedule = sqlx::query_as::<_, Schedule>(
            r#"
            SELECT id, name, workflow_id, profile_id, cron_expr, is_enabled,
                   CAST(last_run_at AS TEXT) as last_run_at,
                   CAST(next_run_at AS TEXT) as next_run_at,
                   run_count,
                   CAST(created_at AS TEXT) as created_at,
                   CAST(updated_at AS TEXT) as updated_at
            FROM schedules
            WHERE id = ?
            "#
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Schedule {} not found", id)))?;

        Ok(schedule)
    }

    pub async fn create_schedule(
        pool: &SqlitePool,
        name: &str,
        workflow_id: &str,
        profile_id: &str,
        cron_expr: &str,
    ) -> Result<Schedule, AppError> {
        let id = Uuid::now_v7().to_string();

        sqlx::query(
            r#"
            INSERT INTO schedules (id, name, workflow_id, profile_id, cron_expr)
            VALUES (?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(name)
        .bind(workflow_id)
        .bind(profile_id)
        .bind(cron_expr)
        .execute(pool)
        .await?;

        Self::get_schedule_by_id(pool, &id).await
    }

    pub async fn update_schedule(
        pool: &SqlitePool,
        id: &str,
        name: Option<&str>,
        workflow_id: Option<&str>,
        profile_id: Option<&str>,
        cron_expr: Option<&str>,
    ) -> Result<Schedule, AppError> {
        // Only update provided fields
        let result = sqlx::query(
            r#"
            UPDATE schedules SET
                name = COALESCE(?, name),
                workflow_id = COALESCE(?, workflow_id),
                profile_id = COALESCE(?, profile_id),
                cron_expr = COALESCE(?, cron_expr),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(name)
        .bind(workflow_id)
        .bind(profile_id)
        .bind(cron_expr)
        .bind(id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Schedule {} not found", id)));
        }

        Self::get_schedule_by_id(pool, id).await
    }

    pub async fn delete_schedule(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM schedules WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Schedule {} not found", id)));
        }

        Ok(())
    }

    pub async fn toggle_schedule(pool: &SqlitePool, id: &str) -> Result<Schedule, AppError> {
        let result = sqlx::query(
            r#"
            UPDATE schedules SET
                is_enabled = CASE WHEN is_enabled = 1 THEN 0 ELSE 1 END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Schedule {} not found", id)));
        }

        Self::get_schedule_by_id(pool, id).await
    }

    /// Update last_run_at and run_count after a schedule fires
    pub async fn update_schedule_run_stats(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE schedules SET
                last_run_at = CURRENT_TIMESTAMP,
                run_count = COALESCE(run_count, 0) + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }
}
