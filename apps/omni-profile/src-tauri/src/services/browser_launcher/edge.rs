use std::process::Command;

use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub struct EdgeLauncher;

impl EdgeLauncher {
    pub async fn resolve_executable(&self, _profile: &BrowserProfile, _app: &tauri::AppHandle) -> Result<String, AppError> {
        // OS specific path resolution could go here
        Ok(r#"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"#.to_string())
    }

    pub async fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &std::path::Path
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile, app).await?;
        let mut cmd = Command::new(&exe_path);
        
        cmd.arg(format!("--user-data-dir={}", data_dir.to_string_lossy()));
        cmd.arg("--remote-debugging-port=9222");
        cmd.arg("--no-first-run");
        cmd.arg("--no-default-browser-check");
        cmd.arg("--disable-blink-features=AutomationControlled");
        cmd.arg("--test-type");
        
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        let ext_dir = app_dir.join("extensions").join("automa");
        if ext_dir.exists() {
            cmd.arg(format!("--load-extension={}", ext_dir.to_string_lossy()));
        }

        Ok(cmd)
    }
}
