use sqlx::{SqlitePool, Row};
use crate::error::AppError;

pub async fn get_logs(pool: &SqlitePool, run_id: Option<&str>) -> Result<Vec<serde_json::Value>, AppError> {
    let query = if let Some(id) = run_id {
        sqlx::query(
            "SELECT id, run_id, block_id, block_label, status, duration_ms, data, CAST(created_at AS TEXT) as created_at FROM workflow_logs WHERE run_id = ? ORDER BY created_at ASC"
        ).bind(id)
    } else {
        sqlx::query(
            "SELECT id, run_id, block_id, block_label, status, duration_ms, data, CAST(created_at AS TEXT) as created_at FROM workflow_logs ORDER BY created_at ASC LIMIT 100"
        )
    };

    let rows = query.fetch_all(pool).await?;
    
    let mut logs = Vec::new();
    for row in rows {
        let duration_ms: Option<i64> = row.try_get("duration_ms").ok();
        let data: Option<String> = row.try_get("data").ok();
        
        logs.push(serde_json::json!({
            "id": row.try_get::<String, _>("id").unwrap_or_default(),
            "run_id": row.try_get::<String, _>("run_id").unwrap_or_default(),
            "block_id": row.try_get::<String, _>("block_id").unwrap_or_default(),
            "block_label": row.try_get::<String, _>("block_label").unwrap_or_default(),
            "status": row.try_get::<String, _>("status").unwrap_or_default(),
            "duration_ms": duration_ms,
            "data": data,
            "created_at": row.try_get::<String, _>("created_at").ok(),
        }));
    }

    Ok(logs)
}

pub async fn get_runs(pool: &SqlitePool, workflow_id: Option<&str>) -> Result<Vec<crate::api::handlers::runs::WorkflowRun>, AppError> {
    let query = if let Some(id) = workflow_id {
        sqlx::query(
            "SELECT id, workflow_id, profile_id, schedule_id, status, CAST(started_at AS TEXT) as started_at, CAST(finished_at AS TEXT) as finished_at FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 50"
        ).bind(id)
    } else {
        sqlx::query(
            "SELECT id, workflow_id, profile_id, schedule_id, status, CAST(started_at AS TEXT) as started_at, CAST(finished_at AS TEXT) as finished_at FROM workflow_runs ORDER BY started_at DESC LIMIT 50"
        )
    };

    let rows = query.fetch_all(pool).await?;
    
    let mut runs = Vec::new();
    for row in rows {
        runs.push(crate::api::handlers::runs::WorkflowRun {
            id: row.try_get("id").unwrap_or_default(),
            workflow_id: row.try_get("workflow_id").unwrap_or_default(),
            profile_id: row.try_get("profile_id").ok(),
            schedule_id: row.try_get("schedule_id").ok(),
            status: row.try_get("status").unwrap_or_default(),
            started_at: row.try_get("started_at").ok(),
            finished_at: row.try_get("finished_at").ok(),
        });
    }

    Ok(runs)
}
