use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub struct FirefoxLauncher;

impl FirefoxLauncher {
    pub async fn resolve_executable(&self, _profile: &BrowserProfile, _app: &tauri::AppHandle) -> Result<String, AppError> {
        // OS specific path resolution could go here
        Ok(r#"C:\Program Files\Mozilla Firefox\firefox.exe"#.to_string())
    }

    pub async fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &PathBuf
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile, app).await?;
        let mut cmd = Command::new(&exe_path);
        
        cmd.arg("--profile");
        cmd.arg(data_dir.to_string_lossy().to_string());
        cmd.arg("--remote-debugging-port=9222"); 
        
        // TODO: Load Fingerprint and Proxy from DB and append args here

        Ok(cmd)
    }
}
