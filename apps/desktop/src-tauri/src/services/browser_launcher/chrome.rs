use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::commands::browser_profiles::BrowserProfile;
use super::BrowserLauncher;

pub struct ChromeLauncher;

impl BrowserLauncher for ChromeLauncher {
    fn resolve_executable(&self, profile: &BrowserProfile) -> Result<String, AppError> {
        if let Some(ref path) = profile.executable_path {
            return Ok(path.clone());
        }
        
        // OS specific path resolution could go here
        Ok(r#"C:\Program Files\Google\Chrome\Application\chrome.exe"#.to_string())
    }

    fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &PathBuf
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile)?;
        let mut cmd = Command::new(&exe_path);
        
        cmd.arg(format!("--user-data-dir={}", data_dir.to_string_lossy()));
        cmd.arg("--remote-debugging-port=9222"); 
        cmd.arg("--no-first-run");
        cmd.arg("--no-default-browser-check");
        cmd.arg("--disable-blink-features=AutomationControlled");
        
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        let ext_dir = app_dir.join("extensions").join("automa");
        if ext_dir.exists() {
            cmd.arg(format!("--load-extension={}", ext_dir.to_string_lossy()));
        } else {
            println!("[Tauri] Automa extension not found at {:?}", ext_dir);
        }

        if let Some(ua) = &profile.user_agent {
            cmd.arg(format!("--user-agent={}", ua));
        }
        if let Some(proxy) = &profile.proxy {
            cmd.arg(format!("--proxy-server={}", proxy));
        }

        Ok(cmd)
    }
}
