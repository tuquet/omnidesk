use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowParameter {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub param_type: String,
    pub description: Option<String>,
    pub default_value: Option<serde_json::Value>,
    pub placeholder: Option<String>,
    pub label: Option<String>,
    #[schema(value_type = Object)]
    pub data: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct WorkflowTrigger {
    pub id: Option<String>,
    #[serde(rename = "type")]
    pub trigger_type: String,
    pub config: Option<serde_json::Value>,
    pub data: Option<serde_json::Value>,
    pub enabled: Option<bool>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct DrawflowNodeData {
    pub parameters: Option<Vec<WorkflowParameter>>,
    pub triggers: Option<Vec<WorkflowTrigger>>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct DrawflowNode {
    pub id: Option<serde_json::Value>,
    pub label: Option<String>,
    #[serde(rename = "type")]
    pub node_type: Option<String>,
    pub data: Option<DrawflowNodeData>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct DrawflowEdge {
    pub id: Option<serde_json::Value>,
    pub source: serde_json::Value,
    pub target: serde_json::Value,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct DrawflowData {
    pub nodes: Option<serde_json::Value>,
    pub edges: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct TriggerData {
    pub parameters: Option<Vec<WorkflowParameter>>,
    pub triggers: Option<Vec<WorkflowTrigger>>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct WorkflowPayload {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    #[schema(value_type = DrawflowData)]
    pub drawflow: serde_json::Value,
    #[schema(value_type = Object)]
    pub settings: serde_json::Value,
    #[schema(value_type = Option<TriggerData>)]
    pub trigger: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub global_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub table_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub data_columns: Option<serde_json::Value>,
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

impl WorkflowPayload {
    /// Creates a WorkflowPayload from raw string fields (usually from a database model)
    #[allow(clippy::too_many_arguments)]
    pub fn from_raw(
        id: String,
        name: String,
        icon: Option<String>,
        folder_id: Option<String>,
        description: Option<String>,
        drawflow: String,
        settings: String,
        trigger: Option<String>,
        global_data: Option<String>,
        table_data: Option<String>,
        data_columns: Option<String>,
        content: Option<String>,
        connected_table: Option<String>,
        version: Option<String>,
        is_disabled: Option<i64>,
        source: Option<String>,
        created_at: Option<String>,
        updated_at: Option<String>,
        deleted_at: Option<String>,
        delete_source: Option<String>,
    ) -> Self {
        Self {
            id,
            name,
            icon,
            folder_id,
            description,
            drawflow: serde_json::from_str(&drawflow).unwrap_or_else(|_| serde_json::json!({})),
            settings: serde_json::from_str(&settings).unwrap_or_else(|_| serde_json::json!({})),
            trigger: trigger.and_then(|s| serde_json::from_str(&s).ok()),
            global_data: global_data.and_then(|s| serde_json::from_str(&s).ok()),
            table_data: table_data.and_then(|s| serde_json::from_str(&s).ok()),
            data_columns: data_columns.and_then(|s| serde_json::from_str(&s).ok()),
            content,
            connected_table,
            version,
            is_disabled,
            source,
            created_at,
            updated_at,
            deleted_at,
            delete_source,
        }
    }
}
