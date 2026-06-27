use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;
use crate::db::models::browser_profile::BrowserProfile;
use crate::api::AppState;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_profiles).post(create_profile))
        .route("/:id", get(get_profile).put(update_profile).delete(delete_profile))
        .route("/:id/launch", post(launch_profile))
}

async fn list_profiles(
    State(state): State<AppState>,
) -> Result<Json<Vec<BrowserProfile>>, StatusCode> {
    let pool = &state.db;
    let profiles = sqlx::query_as::<_, BrowserProfile>(
        r#"
        SELECT id, name, group_id, os, browser_type, data_dir_path, status, last_used_at, created_at, updated_at
        FROM browser_profiles
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        eprintln!("Error fetching profiles: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(profiles))
}

async fn create_profile(
    State(state): State<AppState>,
    Json(mut payload): Json<BrowserProfile>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    let id = Uuid::now_v7().to_string();
    payload.id = id.clone();
    
    // Set defaults if missing
    if payload.os.is_none() { payload.os = Some("win".to_string()); }
    if payload.browser_type.is_none() { payload.browser_type = Some("chrome".to_string()); }
    if payload.status.is_none() { payload.status = Some("IDLE".to_string()); }

    sqlx::query(
        r#"
        INSERT INTO browser_profiles (id, name, group_id, os, browser_type, data_dir_path, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&payload.id)
    .bind(&payload.name)
    .bind(&payload.group_id)
    .bind(&payload.os)
    .bind(&payload.browser_type)
    .bind(&payload.data_dir_path)
    .bind(&payload.status)
    .execute(pool)
    .await
    .map_err(|e| {
        eprintln!("Error creating profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(payload))
}

async fn get_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    let profile = sqlx::query_as::<_, BrowserProfile>(
        r#"
        SELECT id, name, group_id, os, browser_type, data_dir_path, status, last_used_at, created_at, updated_at
        FROM browser_profiles
        WHERE id = ?
        "#
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        eprintln!("Error fetching profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    match profile {
        Some(p) => Ok(Json(p)),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<BrowserProfile>,
) -> Result<Json<BrowserProfile>, StatusCode> {
    let pool = &state.db;
    
    sqlx::query(
        r#"
        UPDATE browser_profiles
        SET name = ?, group_id = ?, os = ?, browser_type = ?, data_dir_path = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        "#
    )
    .bind(&payload.name)
    .bind(&payload.group_id)
    .bind(&payload.os)
    .bind(&payload.browser_type)
    .bind(&payload.data_dir_path)
    .bind(&payload.status)
    .bind(&id)
    .execute(pool)
    .await
    .map_err(|e| {
        eprintln!("Error updating profile: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    get_profile(State(state), Path(id)).await
}

async fn delete_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let pool = &state.db;
    
    sqlx::query("DELETE FROM browser_profiles WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            eprintln!("Error deleting profile: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
}


#[utoipa::path(
    post,
    path = "/api/browser-profiles/{id}/launch",
    responses(
        (status = 200, description = "Browser launched successfully")
    ),
    params(
        ("id" = String, Path, description = "Browser profile ID")
    )
)]
pub async fn launch_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let pool = &state.db;
    let app = state.app_handle.clone();
    
    use crate::services::browser_profile_service::BrowserProfileService;
    use crate::services::browser_launcher::LauncherFactory;

    let profile = match BrowserProfileService::get_by_id(pool, &id).await {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Failed to get profile: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let data_dir = match BrowserProfileService::resolve_data_dir(&app, &profile) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Failed to resolve data dir: {:?}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let browser_type = profile.browser_type.clone().unwrap_or_else(|| "chrome".to_string());
    let launcher = LauncherFactory::create(&browser_type);
    
    match launcher.launch(&profile, &app, &data_dir) {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            eprintln!("Failed to launch browser: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
