use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::State;
use crate::models::issue::{Issue, CreateIssueDto};

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueFilters {
    pub source: Option<String>,
    pub severity: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateIssueInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub tags: Option<Vec<String>>,
    pub resolution_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Statistics {
    pub total_issues: u32,
    pub by_source: std::collections::HashMap<String, u32>,
    pub by_severity: std::collections::HashMap<String, u32>,
    pub by_status: std::collections::HashMap<String, u32>,
    pub recently_added: u32,
    pub recently_updated: u32,
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Not found: {0}")]
    NotFound(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// === Tauri Commands ===

#[tauri::command]
pub async fn get_issues(
    filters: Option<IssueFilters>,
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Issue>, AppError> {
    let _ = filters; // TODO: Implement dynamic filtering query builder
    
    let issues = sqlx::query_as::<_, Issue>("SELECT * FROM issues ORDER BY created_at DESC")
        .fetch_all(&*pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?;
        
    Ok(issues)
}

#[tauri::command]
pub async fn get_issue_by_id(
    id: String,
    pool: State<'_, SqlitePool>,
) -> Result<Issue, AppError> {
    let issue = sqlx::query_as::<_, Issue>("SELECT * FROM issues WHERE id = $1")
        .bind(id)
        .fetch_optional(&*pool)
        .await
        .map_err(|e| AppError::Database(e.to_string()))?
        .ok_or_else(|| AppError::NotFound("Issue not found".into()))?;
        
    Ok(issue)
}

#[tauri::command]
pub async fn create_issue(
    input: CreateIssueDto,
    pool: State<'_, SqlitePool>,
) -> Result<Issue, AppError> {
    let id = uuid::Uuid::now_v7();
    let tags_json = serde_json::to_string(&input.tags.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string());
    let priority = input.priority.unwrap_or_else(|| "MEDIUM".to_string());
    
    let issue = sqlx::query_as::<_, Issue>(
        r#"
        INSERT INTO issues (id, title, description, reproduce_steps, expected_behavior, actual_behavior, priority, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(id.to_string())
    .bind(input.title)
    .bind(input.description)
    .bind(input.reproduce_steps)
    .bind(input.expected_behavior)
    .bind(input.actual_behavior)
    .bind(priority)
    .bind(tags_json)
    .fetch_one(&*pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?;

    Ok(issue)
}

#[tauri::command]
pub async fn update_issue(
    input: UpdateIssueInput,
    pool: State<'_, SqlitePool>,
) -> Result<Issue, AppError> {
    // Basic implementation: update fields if provided
    let issue = sqlx::query_as::<_, Issue>(
        r#"
        UPDATE issues 
        SET 
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            status = COALESCE($4, status),
            priority = COALESCE($5, priority),
            resolution_reason = COALESCE($6, resolution_reason),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        "#
    )
    .bind(&input.id)
    .bind(input.title)
    .bind(input.description)
    .bind(input.status)
    .bind(input.priority)
    .bind(input.resolution_reason)
    .fetch_optional(&*pool)
    .await
    .map_err(|e| AppError::Database(e.to_string()))?
    .ok_or_else(|| AppError::NotFound("Issue not found".into()))?;

    Ok(issue)
}

#[tauri::command]
pub async fn delete_issue(
    id: String,
    hard: Option<bool>,
    pool: State<'_, SqlitePool>,
) -> Result<bool, AppError> {
    if hard.unwrap_or(false) {
        let result = sqlx::query("DELETE FROM issues WHERE id = $1")
            .bind(id)
            .execute(&*pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(result.rows_affected() > 0)
    } else {
        // Soft delete logic: usually setting status to ARCHIVED
        let result = sqlx::query("UPDATE issues SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1")
            .bind(id)
            .execute(&*pool)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;
        Ok(result.rows_affected() > 0)
    }
}

#[tauri::command]
pub async fn get_statistics(pool: State<'_, SqlitePool>) -> Result<Statistics, AppError> {
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM issues")
        .fetch_one(&*pool)
        .await
        .unwrap_or((0,));

    Ok(Statistics {
        total_issues: count.0 as u32,
        by_source: std::collections::HashMap::new(),
        by_severity: std::collections::HashMap::new(),
        by_status: std::collections::HashMap::new(),
        recently_added: 0,
        recently_updated: 0,
    })
}
