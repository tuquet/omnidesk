use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileGroup {
    pub id: String,
    pub name: String,
    pub color: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub pid: Option<i32>,
    pub cdp_url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
}

use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BrowserProfile {
    pub id: String,
    pub name: String,
    pub group_id: Option<String>,
    pub os: Option<String>,
    pub browser_type: Option<String>,
    pub data_dir_path: String,
    pub status: Option<String>,
    pub last_used_at: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub pid: Option<i32>,
    pub cdp_url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
    pub browser_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileFingerprint {
    pub profile_id: String,
    pub user_agent: Option<String>,
    pub screen_resolution: Option<String>,
    pub language: Option<String>,
    pub time_zone: Option<String>,
    pub hardware_concurrency: Option<i64>,
    pub device_memory: Option<i64>,
    pub webgl_vendor: Option<String>,
    pub webgl_renderer: Option<String>,
    pub disable_canvas_noise: Option<bool>,
    pub disable_audio_noise: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub pid: Option<i32>,
    pub cdp_url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileProxy {
    pub profile_id: String,
    pub proxy_type: Option<String>,
    pub host: String,
    pub port: i64,
    pub username: Option<String>,
    pub password: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub pid: Option<i32>,
    pub cdp_url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileExtension {
    pub profile_id: String,
    pub extension_id: String,
    pub install_path: String,
    pub is_enabled: Option<bool>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub pid: Option<i32>,
    pub cdp_url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<String>,
}
