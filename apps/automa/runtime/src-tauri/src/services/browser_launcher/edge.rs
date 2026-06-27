use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;
use super::BrowserLauncher;

pub struct EdgeLauncher;

impl BrowserLauncher for EdgeLauncher {
    fn resolve_executable(&self, _profile: &BrowserProfile) -> Result<String, AppError> {
        // OS specific path resolution could go here
        Ok(r#"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"#.to_string())
    }

    fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &PathBuf,
        url: Option<&str>
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile)?;
        let mut cmd = Command::new(&exe_path);
        
        cmd.arg(format!("--user-data-dir={}", data_dir.to_string_lossy()));
        cmd.arg("--remote-debugging-port=9223");
        cmd.arg("--no-first-run");
        cmd.arg("--no-default-browser-check");
        cmd.arg("--disable-blink-features=AutomationControlled");

        // Edge usually supports Chrome extensions, but load path might be different or same
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        let ext_dir = app_dir.join("extensions").join("automa");
        if ext_dir.exists() {
            cmd.arg(format!("--load-extension={}", ext_dir.to_string_lossy()));
        }

        // TODO: Load Fingerprint and Proxy from DB and append args here

        if let Some(url_str) = url {
            cmd.arg(url_str);
        }

        Ok(cmd)
    }
}
