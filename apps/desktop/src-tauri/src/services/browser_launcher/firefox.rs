use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::commands::browser_profiles::BrowserProfile;
use super::BrowserLauncher;

pub struct FirefoxLauncher;

impl BrowserLauncher for FirefoxLauncher {
    fn resolve_executable(&self, profile: &BrowserProfile) -> Result<String, AppError> {
        if let Some(ref path) = profile.executable_path {
            return Ok(path.clone());
        }
        
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
        
        cmd.arg("-profile");
        cmd.arg(data_dir.to_string_lossy().to_string());
        cmd.arg("-remote-debugging-port");
        cmd.arg("9222");

        // Note: Firefox doesn't support the exact same flags natively as Chromium
        // Extensions and anti-detect usually require user.js or geckodriver

        Ok(cmd)
    }
}
