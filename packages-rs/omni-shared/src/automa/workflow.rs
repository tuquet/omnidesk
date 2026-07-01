use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
pub struct WorkflowPayload {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    #[schema(value_type = Object)]
    pub drawflow: serde_json::Value,
    #[schema(value_type = Object)]
    pub settings: serde_json::Value,
    #[schema(value_type = Option<Object>)]
    pub trigger: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub global_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub table_data: Option<serde_json::Value>,
    #[schema(value_type = Option<Object>)]
    pub data_columns: Option<serde_json::Value>,
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
