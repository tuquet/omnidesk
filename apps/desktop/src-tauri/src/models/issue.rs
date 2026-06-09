use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, ToSchema, FromRow)]
pub struct Issue {
    #[schema(value_type = String, format = Uuid)]
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub reproduce_steps: Option<String>,
    pub expected_behavior: Option<String>,
    pub actual_behavior: Option<String>,
    pub status: String,
    pub priority: String,
    pub tags: String,
    pub resolution_reason: Option<String>,
    
    #[schema(value_type = String, format = DateTime)]
    pub created_at: DateTime<Utc>,
    
    #[schema(value_type = String, format = DateTime)]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateIssueDto {
    pub title: String,
    pub description: Option<String>,
    pub reproduce_steps: Option<String>,
    pub expected_behavior: Option<String>,
    pub actual_behavior: Option<String>,
    pub priority: Option<String>,
    pub tags: Option<Vec<String>>,
}
