use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogItem {
    pub id: Option<serde_json::Value>,
    pub name: String,
    pub status: String,
    pub team_id: Option<String>,
    pub message: Option<String>,
    pub workflow_id: Option<String>,
    pub save_log: Option<bool>,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
    #[schema(value_type = Object)]
    pub parent_log: Option<serde_json::Value>,
    pub collection_id: Option<String>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogHistory {
    pub id: Option<serde_json::Value>,
    pub log_id: String,
    pub data: Option<Vec<serde_json::Value>>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogCtxData {
    pub id: Option<serde_json::Value>,
    pub log_id: String,
    #[schema(value_type = Object)]
    pub data: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogData {
    pub id: Option<serde_json::Value>,
    pub log_id: String,
    #[schema(value_type = Object)]
    pub data: Option<serde_json::Value>,
}
