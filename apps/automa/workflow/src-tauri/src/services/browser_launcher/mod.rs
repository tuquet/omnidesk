use std::process::Command;
use std::path::PathBuf;
use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub mod chrome;
pub mod edge;
pub mod firefox;

/// Strategy pattern for launching different browser engines
pub trait BrowserLauncher {
    /// Resolve the executable path for the browser
    fn resolve_executable(&self, profile: &BrowserProfile) -> Result<String, AppError>;
    
    /// Build the std::process::Command with all necessary arguments
    fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &PathBuf
    ) -> Result<Command, AppError>;

    /// Launch the browser process detached
    fn launch(
        &self,
        profile: &BrowserProfile,
        app: &tauri::AppHandle,
        data_dir: &PathBuf
    ) -> Result<(), AppError> {
        let mut cmd = self.build_command(profile, app, data_dir)?;
        
        println!("[Tauri] Launching browser via Strategy: {:?}", cmd);
        
        cmd.spawn().map_err(|e| AppError::Internal(format!("Failed to launch browser: {}", e)))?;
        Ok(())
    }
}

pub struct LauncherFactory;

impl LauncherFactory {
    /// Factory pattern to return the appropriate launcher strategy
    pub fn create(browser_type: &str) -> Box<dyn BrowserLauncher> {
        match browser_type.to_lowercase().as_str() {
            "chrome" => Box::new(chrome::ChromeLauncher),
            "edge" => Box::new(edge::EdgeLauncher),
            "firefox" => Box::new(firefox::FirefoxLauncher),
            // Default fallback to Chrome
            _ => Box::new(chrome::ChromeLauncher),
        }
    }
}
