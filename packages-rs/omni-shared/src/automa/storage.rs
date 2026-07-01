use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableItem {
    pub id: Option<serde_json::Value>,
    pub name: String,
    pub created_at: Option<i64>,
    pub modified_at: Option<i64>,
    pub rows_count: Option<i64>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableData {
    pub id: Option<serde_json::Value>,
    pub table_id: String,
    pub items: Option<Vec<serde_json::Value>>,
    pub columns_index: Option<Vec<serde_json::Value>>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub id: Option<serde_json::Value>,
    pub name: String,
    pub value: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Credential {
    pub id: Option<serde_json::Value>,
    pub name: String,
    pub value: Option<serde_json::Value>,
}
