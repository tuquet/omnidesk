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
    pub drawflow: String,
    pub settings: String,
    pub trigger: Option<String>,
    pub global_data: Option<String>,
    pub table_data: Option<String>,
    pub data_columns: Option<String>,
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

use crate::automa::workflow::WorkflowPayload;

impl From<Workflow> for WorkflowPayload {
    fn from(w: Workflow) -> Self {
        WorkflowPayload::from_raw(
            w.id,
            w.name,
            w.icon,
            w.folder_id,
            w.description,
            w.drawflow,
            w.settings,
            w.trigger,
            w.global_data,
            w.table_data,
            w.data_columns,
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
            drawflow: serde_json::to_string(&aw.drawflow).unwrap_or_else(|_| "{}".to_string()),
            settings: serde_json::to_string(&aw.settings).unwrap_or_else(|_| "{}".to_string()),
            trigger: aw.trigger.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            global_data: aw.global_data.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            table_data: aw.table_data.map(|v| serde_json::to_string(&v).unwrap_or_default()),
            data_columns: aw.data_columns.map(|v| serde_json::to_string(&v).unwrap_or_default()),
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
