use axum::{
    extract::{Path, State},
    routing::{get, put},
    Json, Router,
};
use omni_shared::automa::workflow::Folder;
use serde::{Deserialize, Serialize};

use crate::api::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_folders).post(create_folder))
        .route("/:id", put(update_folder).delete(delete_folder))
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolderPayload {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, utoipa::ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderPayload {
    pub name: String,
}

use sqlx::Row;

#[utoipa::path(
    get,
    path = "/api/automa/folders",
    responses(
        (status = 200, description = "List all folders", body = Vec<Folder>)
    ),
    tag = "automa-folders"
)]
pub async fn list_folders(State(state): State<AppState>) -> Json<Vec<Folder>> {
    let folders = sqlx::query(
        r#"
        SELECT id, name, created_at, updated_at
        FROM folders
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default()
    .into_iter()
    .map(|row| Folder {
        id: row.get("id"),
        name: row.get("name"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
    .collect();

    Json(folders)
}

#[utoipa::path(
    post,
    path = "/api/automa/folders",
    request_body = CreateFolderPayload,
    responses(
        (status = 201, description = "Folder created", body = Folder)
    ),
    tag = "automa-folders"
)]
pub async fn create_folder(
    State(state): State<AppState>,
    Json(payload): Json<CreateFolderPayload>,
) -> Json<Folder> {
    let row = sqlx::query(
        r#"
        INSERT INTO folders (id, name)
        VALUES (?1, ?2)
        RETURNING id, name, created_at, updated_at
        "#
    )
    .bind(&payload.id)
    .bind(&payload.name)
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(Folder {
        id: row.get("id"),
        name: row.get("name"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

#[utoipa::path(
    put,
    path = "/api/automa/folders/{id}",
    request_body = UpdateFolderPayload,
    params(
        ("id" = String, Path, description = "Folder ID")
    ),
    responses(
        (status = 200, description = "Folder updated", body = Folder)
    ),
    tag = "automa-folders"
)]
pub async fn update_folder(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateFolderPayload>,
) -> Json<Folder> {
    let row = sqlx::query(
        r#"
        UPDATE folders
        SET name = ?1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?2
        RETURNING id, name, created_at, updated_at
        "#
    )
    .bind(&payload.name)
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .unwrap();

    Json(Folder {
        id: row.get("id"),
        name: row.get("name"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

#[utoipa::path(
    delete,
    path = "/api/automa/folders/{id}",
    params(
        ("id" = String, Path, description = "Folder ID")
    ),
    responses(
        (status = 200, description = "Folder deleted")
    ),
    tag = "automa-folders"
)]
pub async fn delete_folder(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    // 1. Set folder_id to NULL in workflows
    let _ = sqlx::query(
        r#"
        UPDATE workflows
        SET folder_id = NULL
        WHERE folder_id = ?1
        "#
    )
    .bind(&id)
    .execute(&state.db)
    .await;

    // 2. Delete the folder
    let _ = sqlx::query(
        r#"
        DELETE FROM folders
        WHERE id = ?1
        "#
    )
    .bind(&id)
    .execute(&state.db)
    .await;

    Json(serde_json::json!({ "success": true }))
}
