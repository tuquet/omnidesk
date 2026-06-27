use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Serialize, Deserialize)]
pub struct StorageInfo {
    pub current_path: String,
    pub is_default: bool,
}

#[tauri::command]
pub async fn get_storage_info(app_handle: AppHandle) -> Result<StorageInfo, String> {
    let config = crate::system::config::read_config(&app_handle);
    let current_path = crate::system::config::get_active_storage_path(&app_handle)?;
    
    Ok(StorageInfo {
        current_path: current_path.to_string_lossy().to_string(),
        is_default: config.storage_path.is_none(),
    })
}

#[tauri::command]
pub async fn update_storage_location(
    app_handle: AppHandle,
    new_path: String,
) -> Result<(), String> {
    // Basic implementation: update config and ask user to restart
    let mut config = crate::system::config::read_config(&app_handle);
    config.storage_path = Some(new_path.clone());
    
    crate::system::config::write_config(&app_handle, &config)?;
    
    // In a fully featured version, we would also copy the database and apps folder here.
    // For now, we update the pointer. The user will need to move files manually or we can add file copying logic.
    
    // Restart app to apply changes
    app_handle.restart();
}
