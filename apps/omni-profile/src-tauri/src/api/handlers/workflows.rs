use axum::{
    extract::{Path, State},
    response::IntoResponse,
    routing::{get, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use chrono::Utc;

use crate::{
    api::AppState,
    db::models::workflow::Workflow,
    error::AppError,
};

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WorkflowPayload {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    pub drawflow: serde_json::Value,
    pub settings: serde_json::Value,
    pub trigger: Option<serde_json::Value>,
    pub global_data: Option<serde_json::Value>,
    pub table_data: Option<serde_json::Value>,
    pub data_columns: Option<serde_json::Value>,
    pub version: Option<String>,
    pub is_disabled: Option<i64>,
    pub source: Option<String>,
    pub created_at: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_workflows))
        .route("/:id", put(upsert_workflow).delete(delete_workflow))
}

#[utoipa::path(
    get,
    path = "/api/workflows",
    responses(
        (status = 200, description = "List all workflows", body = Vec<Workflow>)
    ),
    tags = ["workflows"]
)]
async fn list_workflows(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let workflows = sqlx::query_as::<_, Workflow>(
        "SELECT * FROM workflows WHERE deleted_at IS NULL ORDER BY updated_at DESC"
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(workflows))
}

#[utoipa::path(
    put,
    path = "/api/workflows/{id}",
    request_body = WorkflowPayload,
    responses(
        (status = 200, description = "Workflow upserted successfully", body = Workflow)
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tags = ["workflows"]
)]
async fn upsert_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<WorkflowPayload>,
) -> Result<impl IntoResponse, AppError> {
    let now = Utc::now().to_rfc3339();
    let created_at = payload.created_at.unwrap_or_else(|| now.clone());
    let updated_at = now;

    let drawflow_str = serde_json::to_string(&payload.drawflow).unwrap_or_default();
    let settings_str = serde_json::to_string(&payload.settings).unwrap_or_default();
    let trigger_str = payload.trigger.map(|v| serde_json::to_string(&v).unwrap_or_default());
    let global_data_str = payload.global_data.map(|v| serde_json::to_string(&v).unwrap_or_default());
    let table_data_str = payload.table_data.map(|v| serde_json::to_string(&v).unwrap_or_default());
    let data_columns_str = payload.data_columns.map(|v| serde_json::to_string(&v).unwrap_or_default());

    let workflow = sqlx::query_as::<_, Workflow>(
        r#"
        INSERT INTO workflows (
            id, name, icon, folder_id, description, drawflow, settings,
            trigger, global_data, table_data, data_columns, version,
            is_disabled, source, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            updated_at = excluded.updated_at,
            deleted_at = NULL
        RETURNING *
        "#
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.icon)
    .bind(&payload.folder_id)
    .bind(&payload.description)
    .bind(&drawflow_str)
    .bind(&settings_str)
    .bind(&trigger_str)
    .bind(&global_data_str)
    .bind(&table_data_str)
    .bind(&data_columns_str)
    .bind(&payload.version)
    .bind(&payload.is_disabled)
    .bind(&payload.source)
    .bind(&created_at)
    .bind(&updated_at)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(workflow))
}


#[utoipa::path(
    delete,
    path = "/api/workflows/{id}",
    responses(
        (status = 200, description = "Workflow deleted successfully")
    ),
    params(
        ("id" = String, Path, description = "Workflow ID")
    ),
    tags = ["workflows"]
)]
async fn delete_workflow(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let now = Utc::now().to_rfc3339();
    
    sqlx::query(
        r#"
        UPDATE workflows 
        SET deleted_at = ?, delete_source = 'api'
        WHERE id = ?
        "#
    )
    .bind(&now)
    .bind(&id)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "success": true })))
}
