use crate::error::AppError;
use crate::models::workflow::Schedule;
use serde::Deserialize;
use sqlx::SqlitePool;
use utoipa::ToSchema;

// ─── Payload Types (shared between Studio & Engine) ─────────

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateSchedulePayload {
    pub name: String,
    pub workflow_id: String,
    pub profile_id: String,
    pub cron_expr: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateSchedulePayload {
    pub name: Option<String>,
    pub workflow_id: Option<String>,
    pub profile_id: Option<String>,
    pub cron_expr: Option<String>,
}

// ─── Pure CRUD Service (no scheduler dependency) ─────────

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

    sqlx::query(
        "INSERT INTO schedules (id, name, workflow_id, profile_id, cron_expr, is_enabled, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.workflow_id)
    .bind(&payload.profile_id)
    .bind(&payload.cron_expr)
    .execute(pool)
    .await?;

    get_schedule(pool, &id).await
}

pub async fn update_schedule(
    pool: &SqlitePool,
    id: &str,
    payload: &UpdateSchedulePayload,
) -> Result<Schedule, AppError> {
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

    sqlx::query(
        "UPDATE schedules SET name = ?, workflow_id = ?, profile_id = ?, cron_expr = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(&schedule.name)
    .bind(&schedule.workflow_id)
    .bind(&schedule.profile_id)
    .bind(&schedule.cron_expr)
    .bind(id)
    .execute(pool)
    .await?;

    schedule.updated_at = Some(chrono::Utc::now().to_rfc3339());
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

    sqlx::query("UPDATE schedules SET is_enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(new_val)
        .bind(id)
        .execute(pool)
        .await?;

    schedule.is_enabled = Some(new_val);
    schedule.updated_at = Some(chrono::Utc::now().to_rfc3339());

    Ok(schedule)
}
