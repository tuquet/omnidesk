use std::path::PathBuf;
use tauri::Manager;

use omni_shared::models::system::GlobalConfig;

pub fn get_global_config_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map(|dir| dir.join("global.json"))
        .map_err(|e| e.to_string())
}

pub fn read_config(app_handle: &tauri::AppHandle) -> GlobalConfig {
    if let Ok(path) = get_global_config_path(app_handle) {
        if path.exists() {
            if let Ok(contents) = std::fs::read_to_string(path) {
                if let Ok(config) = serde_json::from_str(&contents) {
                    return config;
                }
            }
        }
    }
    GlobalConfig::default()
}

pub fn write_config(app_handle: &tauri::AppHandle, config: &GlobalConfig) -> Result<(), String> {
    let path = get_global_config_path(app_handle)?;
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let contents = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(path, contents).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_active_storage_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config = read_config(app_handle);
    if let Some(custom_path) = config.storage_path {
        let path = PathBuf::from(custom_path).join(".omnidesk");
        if path.exists() || std::fs::create_dir_all(&path).is_ok() {
            return Ok(path);
        }
    }

    // Fallback to default
    app_handle.path().app_data_dir().map_err(|e| e.to_string())
}
