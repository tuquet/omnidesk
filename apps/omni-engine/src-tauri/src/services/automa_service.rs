use sqlx::SqlitePool;
use crate::error::AppError;

pub async fn mark_run_finished(
    pool: &SqlitePool,
    run_id: &str,
    status: &str,
) -> Result<(), AppError> {
    let now = chrono::Utc::now().timestamp_millis();
    sqlx::query("UPDATE workflow_runs SET status = ?, updated_at = ?, finished_at = ? WHERE id = ?")
        .bind(status)
        .bind(now)
        .bind(now)
        .bind(run_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn add_run_log(
    pool: &SqlitePool,
    run_id: &str,
    block_id: &str,
    block_label: &str,
    status: &str,
    duration_ms: Option<i64>,
    data: Option<&str>,
) -> Result<(), AppError> {
    let log_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    sqlx::query("INSERT INTO workflow_logs (id, run_id, block_id, block_label, status, duration_ms, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(log_id)
        .bind(run_id)
        .bind(block_id)
        .bind(block_label)
        .bind(status)
        .bind(duration_ms)
        .bind(data)
        .bind(now)
        .execute(pool)
        .await?;
    Ok(())
}
