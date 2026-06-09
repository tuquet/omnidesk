use axum::{extract::State, Json, Router, routing::get};
use crate::models::issue::{Issue, CreateIssueDto};
use crate::api::AppState;
use uuid::Uuid;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_issues).post(create_issue))
}

#[utoipa::path(
    get,
    path = "/api/issues",
    responses(
        (status = 200, description = "List all issues", body = [Issue])
    )
)]
pub async fn list_issues(State(state): State<AppState>) -> Json<Vec<Issue>> {
    // Using runtime query to avoid needing DATABASE_URL at compile time for now
    let issues = sqlx::query_as::<_, Issue>(
        r#"
        SELECT * FROM issues ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    Json(issues)
}

#[utoipa::path(
    post,
    path = "/api/issues",
    request_body = CreateIssueDto,
    responses(
        (status = 201, description = "Issue created successfully", body = Issue)
    )
)]
pub async fn create_issue(
    State(state): State<AppState>,
    Json(payload): Json<CreateIssueDto>,
) -> Json<Issue> {
    let id = Uuid::now_v7();
    let tags_json = serde_json::to_string(&payload.tags.unwrap_or_default()).unwrap_or_else(|_| "[]".to_string());
    let priority = payload.priority.unwrap_or_else(|| "MEDIUM".to_string());
    
    let issue = sqlx::query_as::<_, Issue>(
        r#"
        INSERT INTO issues (id, title, description, reproduce_steps, expected_behavior, actual_behavior, priority, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        "#
    )
    .bind(id.to_string())
    .bind(payload.title)
    .bind(payload.description)
    .bind(payload.reproduce_steps)
    .bind(payload.expected_behavior)
    .bind(payload.actual_behavior)
    .bind(priority)
    .bind(tags_json)
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(issue)
}
