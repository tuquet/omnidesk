use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;
use super::BrowserLauncher;

pub struct FirefoxLauncher;

impl BrowserLauncher for FirefoxLauncher {
    fn resolve_executable(&self, _profile: &BrowserProfile) -> Result<String, AppError> {
        // OS specific path resolution could go here
        Ok(r#"C:\Program Files\Mozilla Firefox\firefox.exe"#.to_string())
    }

    fn build_command(
        &self, 
        profile: &BrowserProfile, 
        _app: &tauri::AppHandle,
        data_dir: &PathBuf
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile)?;
        let mut cmd = Command::new(&exe_path);
        
        cmd.arg("-profile").arg(data_dir);
        cmd.arg("-no-remote");
        
        // TODO: Load Fingerprint and Proxy from DB and append args here

        Ok(cmd)
    }
}
