use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct GlobalConfig {
    pub storage_path: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct StorageInfo {
    pub current_path: String,
    pub is_default: bool,
}
