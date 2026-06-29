use tauri::{AppHandle, Manager};
use std::path::PathBuf;

#[tauri::command]
pub async fn open_app_folder(app: AppHandle) -> Result<(), String> {
    if let Ok(app_dir) = app.path().app_data_dir() {
        if !app_dir.exists() {
            std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
        }
        
        #[cfg(target_os = "windows")]
        std::process::Command::new("explorer")
            .arg(app_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
            
        #[cfg(target_os = "macos")]
        std::process::Command::new("open")
            .arg(app_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
            
        #[cfg(target_os = "linux")]
        std::process::Command::new("xdg-open")
            .arg(app_dir)
            .spawn()
            .map_err(|e| e.to_string())?;
            
        Ok(())
    } else {
        Err("Could not determine app data directory".to_string())
    }
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}
