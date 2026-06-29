use std::process::Command;

use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub struct SystemChromeLauncher;

impl SystemChromeLauncher {
    pub async fn resolve_executable(&self, _profile: &BrowserProfile, _app: &tauri::AppHandle) -> Result<String, AppError> {
        let paths = [
            r#"C:\Program Files\Google\Chrome\Application\chrome.exe"#,
            r#"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"#,
        ];
        
        for path in paths.iter() {
            if std::path::Path::new(path).exists() {
                return Ok(path.to_string());
            }
        }
        
        if let Some(user_dir) = dirs::data_local_dir() {
            let user_chrome = user_dir.join(r#"Google\Chrome\Application\chrome.exe"#);
            if user_chrome.exists() {
                return Ok(user_chrome.to_string_lossy().to_string());
            }
        }

        Ok("chrome.exe".to_string())
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
        cmd.arg("--silent-debugger-extension-api");
        
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
