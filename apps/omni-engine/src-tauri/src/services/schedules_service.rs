use crate::api::handlers::schedules::{CreateSchedulePayload, UpdateSchedulePayload};
use crate::db::models::workflow::Schedule;
use crate::error::AppError;
use sqlx::SqlitePool;

pub async fn list_schedules(pool: &SqlitePool) -> Result<Vec<Schedule>, AppError> {
    let schedules =
        sqlx::query_as::<_, Schedule>("SELECT * FROM schedules ORDER BY created_at DESC")
            .fetch_all(pool)
            .await?;
    Ok(schedules)
}

pub async fn get_schedule(pool: &SqlitePool, id: &str) -> Result<Schedule, AppError> {
    let schedule = sqlx::query_as::<_, Schedule>("SELECT * FROM schedules WHERE id = ?")
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(|_| AppError::NotFound(format!("Schedule {} not found", id)))?;
    Ok(schedule)
}

pub async fn create_schedule(
    pool: &SqlitePool,
    payload: &CreateSchedulePayload,
) -> Result<Schedule, AppError> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();

    sqlx::query(
        "INSERT INTO schedules (id, name, workflow_id, profile_id, cron_expr, is_enabled, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.workflow_id)
    .bind(&payload.profile_id)
    .bind(&payload.cron_expr)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await?;

    get_schedule(pool, &id).await
}

pub async fn update_schedule(
    pool: &SqlitePool,
    id: &str,
    payload: &UpdateSchedulePayload,
) -> Result<Schedule, AppError> {
    let now = chrono::Utc::now().timestamp_millis();
    let now_str = chrono::Utc::now().to_rfc3339();
    let mut schedule = get_schedule(pool, id).await?;

    if let Some(ref n) = payload.name {
        schedule.name = n.clone();
    }
    if let Some(ref w) = payload.workflow_id {
        schedule.workflow_id = w.clone();
    }
    if let Some(ref p) = payload.profile_id {
        schedule.profile_id = p.clone();
    }
    if let Some(ref c) = payload.cron_expr {
        schedule.cron_expr = c.clone();
    }
    schedule.updated_at = Some(now_str);

    sqlx::query(
        "UPDATE schedules SET name = ?, workflow_id = ?, profile_id = ?, cron_expr = ?, updated_at = ? WHERE id = ?"
    )
    .bind(&schedule.name)
    .bind(&schedule.workflow_id)
    .bind(&schedule.profile_id)
    .bind(&schedule.cron_expr)
    .bind(now)
    .bind(id)
    .execute(pool)
    .await?;

    Ok(schedule)
}

pub async fn delete_schedule(pool: &SqlitePool, id: &str) -> Result<(), AppError> {
    let rows_affected = sqlx::query("DELETE FROM schedules WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?
        .rows_affected();

    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Schedule {} not found", id)));
    }
    Ok(())
}

pub async fn toggle_schedule(pool: &SqlitePool, id: &str) -> Result<Schedule, AppError> {
    let mut schedule = get_schedule(pool, id).await?;

    let new_val = if schedule.is_enabled == Some(1) { 0 } else { 1 };
    let now = chrono::Utc::now().timestamp_millis();
    let now_str = chrono::Utc::now().to_rfc3339();

    sqlx::query("UPDATE schedules SET is_enabled = ?, updated_at = ? WHERE id = ?")
        .bind(new_val)
        .bind(now)
        .bind(id)
        .execute(pool)
        .await?;

    schedule.is_enabled = Some(new_val);
    schedule.updated_at = Some(now_str);

    Ok(schedule)
}
