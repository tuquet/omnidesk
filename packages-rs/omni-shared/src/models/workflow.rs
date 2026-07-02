use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

/// Workflow definition — mirrors the Automa Extension's workflow JSON structure.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    #[schema(value_type = Object)]
    pub drawflow: sqlx::types::Json<serde_json::Value>,
    #[schema(value_type = Object)]
    pub settings: sqlx::types::Json<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub trigger: Option<sqlx::types::Json<serde_json::Value>>,
    #[schema(value_type = Option<Object>)]
    pub global_data: Option<sqlx::types::Json<serde_json::Value>>,
    #[schema(value_type = Option<Object>)]
    pub table_data: Option<sqlx::types::Json<serde_json::Value>>,
    #[schema(value_type = Option<Object>)]
    pub data_columns: Option<sqlx::types::Json<serde_json::Value>>,
    pub content: Option<String>,
    pub connected_table: Option<String>,
    pub version: Option<String>,
    pub is_disabled: Option<i64>,
    pub source: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
    pub delete_source: Option<String>,
}

impl Workflow {
    /// Compares two workflows for structural data equality, ignoring metadata like updated_at, deleted_at, source.
    /// This is used to prevent infinite sync loops.
    pub fn is_identical_data(&self, other: &Self) -> bool {
        self.name == other.name
            && self.icon == other.icon
            && self.folder_id == other.folder_id
            && self.description == other.description
            && self.drawflow.0 == other.drawflow.0
            && self.settings.0 == other.settings.0
            && self.trigger.as_ref().map(|j| &j.0) == other.trigger.as_ref().map(|j| &j.0)
            && self.global_data.as_ref().map(|j| &j.0) == other.global_data.as_ref().map(|j| &j.0)
            && self.table_data.as_ref().map(|j| &j.0) == other.table_data.as_ref().map(|j| &j.0)
            && self.data_columns.as_ref().map(|j| &j.0) == other.data_columns.as_ref().map(|j| &j.0)
            && self.content == other.content
            && self.connected_table == other.connected_table
            && self.version == other.version
            && self.is_disabled == other.is_disabled
    }
}

use crate::automa::workflow::WorkflowPayload;

impl From<Workflow> for WorkflowPayload {
    fn from(w: Workflow) -> Self {
        WorkflowPayload::from_raw(
            w.id,
            w.name,
            w.icon,
            w.folder_id,
            w.description,
            w.drawflow.0,
            w.settings.0,
            w.trigger.map(|j| j.0),
            w.global_data.map(|j| j.0),
            w.table_data.map(|j| j.0),
            w.data_columns.map(|j| j.0),
            w.content,
            w.connected_table,
            w.version,
            w.is_disabled,
            w.source,
            w.created_at,
            w.updated_at,
            w.deleted_at,
            w.delete_source,
        )
    }
}

impl From<WorkflowPayload> for Workflow {
    fn from(aw: WorkflowPayload) -> Self {
        Workflow {
            id: aw.id,
            name: aw.name,
            icon: aw.icon,
            folder_id: aw.folder_id,
            description: aw.description,
            drawflow: sqlx::types::Json(aw.drawflow),
            settings: sqlx::types::Json(aw.settings),
            trigger: aw.trigger.map(sqlx::types::Json),
            global_data: aw.global_data.map(sqlx::types::Json),
            table_data: aw.table_data.map(sqlx::types::Json),
            data_columns: aw.data_columns.map(sqlx::types::Json),
            content: aw.content,
            connected_table: aw.connected_table,
            version: aw.version,
            is_disabled: aw.is_disabled,
            source: aw.source,
            created_at: aw.created_at,
            updated_at: aw.updated_at,
            deleted_at: aw.deleted_at,
            delete_source: aw.delete_source,
        }
    }
}

/// A single execution of a workflow.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct WorkflowRun {
    pub id: String,
    pub workflow_id: String,
    pub profile_id: Option<String>,
    pub schedule_id: Option<String>,
    pub status: String,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
    pub error_message: Option<String>,
    pub summary: Option<String>,
    pub created_at: Option<String>,
}

/// Per-block execution log entry within a run.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct WorkflowLog {
    pub id: String,
    pub run_id: String,
    pub block_id: String,
    pub block_label: Option<String>,
    pub status: String,
    pub duration_ms: Option<i64>,
    pub data: Option<String>,
    pub timestamp: Option<String>,
}

/// Schedule: Profile × Workflow on a cron.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Schedule {
    pub id: String,
    pub name: String,
    pub workflow_id: String,
    pub profile_id: String,
    pub cron_expr: String,
    pub is_enabled: Option<i64>,
    pub last_run_at: Option<String>,
    pub next_run_at: Option<String>,
    pub run_count: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
