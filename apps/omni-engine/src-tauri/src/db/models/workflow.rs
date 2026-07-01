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
    pub version: Option<String>,
    pub is_disabled: Option<i64>,
    pub source: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub deleted_at: Option<String>,
    pub delete_source: Option<String>,
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
