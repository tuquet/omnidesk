use std::process::Command;

use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub mod chrome;
pub mod edge;
pub mod firefox;
pub mod downloader;

pub enum BrowserLauncher {
    Chrome(chrome::ChromeLauncher),
    Edge(edge::EdgeLauncher),
    Firefox(firefox::FirefoxLauncher),
}

impl BrowserLauncher {
    /// Resolve the executable path for the browser
    pub async fn resolve_executable(&self, profile: &BrowserProfile, app: &tauri::AppHandle) -> Result<String, AppError> {
        match self {
            Self::Chrome(l) => l.resolve_executable(profile, app).await,
            Self::Edge(l) => l.resolve_executable(profile, app).await,
            Self::Firefox(l) => l.resolve_executable(profile, app).await,
        }
    }
    
    /// Build the std::process::Command with all necessary arguments
    pub async fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &std::path::Path
    ) -> Result<Command, AppError> {
        match self {
            Self::Chrome(l) => l.build_command(profile, app, data_dir).await,
            Self::Edge(l) => l.build_command(profile, app, data_dir).await,
            Self::Firefox(l) => l.build_command(profile, app, data_dir).await,
        }
    }

    /// Launch the browser process detached
    pub async fn launch(
        &self,
        profile: &BrowserProfile,
        app: &tauri::AppHandle,
        data_dir: &std::path::Path
    ) -> Result<u32, AppError> {
        let mut cmd = self.build_command(profile, app, data_dir).await?;
        
        println!("[Tauri] Launching browser via Strategy: {:?}", cmd);
        
        let child = cmd.spawn().map_err(|e| AppError::Internal(format!("Failed to launch browser: {}", e)))?;
        Ok(child.id())
    }
}

pub struct LauncherFactory;

impl LauncherFactory {
    /// Factory pattern to return the appropriate launcher strategy
    pub fn create(browser_type: &str) -> BrowserLauncher {
        match browser_type.to_lowercase().as_str() {
            "chrome" => BrowserLauncher::Chrome(chrome::ChromeLauncher),
            "edge" => BrowserLauncher::Edge(edge::EdgeLauncher),
            "firefox" => BrowserLauncher::Firefox(firefox::FirefoxLauncher),
            // Default fallback to Chrome
            _ => BrowserLauncher::Chrome(chrome::ChromeLauncher),
        }
    }
}
