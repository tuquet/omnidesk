use std::process::Command;

use crate::error::AppError;
use crate::db::models::browser_profile::BrowserProfile;

pub struct ChromeLauncher;

impl ChromeLauncher {
    pub async fn fetch_latest_chrome_url() -> Result<String, AppError> {
        let url = "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json";
        let res = reqwest::get(url).await.map_err(|e| AppError::Internal(format!("Failed to fetch CfT JSON: {}", e)))?;
        let json: serde_json::Value = res.json().await.map_err(|e| AppError::Internal(format!("Failed to parse CfT JSON: {}", e)))?;
        
        let downloads = json["channels"]["Stable"]["downloads"]["chrome"].as_array()
            .ok_or_else(|| AppError::Internal("Missing Stable downloads array".to_string()))?;
            
        for download in downloads {
            if download["platform"] == "win64" {
                if let Some(url) = download["url"].as_str() {
                    return Ok(url.to_string());
                }
            }
        }
        
        Err(AppError::Internal("win64 download url not found".to_string()))
    }

    pub async fn resolve_executable(&self, _profile: &BrowserProfile, app: &tauri::AppHandle) -> Result<String, AppError> {
        use crate::system::config::get_active_storage_path;
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
            
        let browser_dir = app_dir.join("browser").join("chromium");
        let exe_relative_path = "chrome-win64/chrome.exe";
        
        // Try to get dynamic URL, fallback to hardcoded if it fails
        let download_url = match Self::fetch_latest_chrome_url().await {
            Ok(url) => {
                log::info!("[Tauri] Fetched latest Chrome URL: {}", url);
                url
            },
            Err(e) => {
                log::warn!("[Tauri] Failed to fetch latest Chrome URL: {:?}. Using fallback.", e);
                "https://cdn.playwright.dev/builds/cft/149.0.7827.55/win64/chrome-win64.zip".to_string()
            }
        };
        
        let exe_path = crate::services::browser_launcher::downloader::download_browser_if_missing(
            app,
            &browser_dir,
            &download_url,
            exe_relative_path
        ).await?;
        
        Ok(exe_path.to_string_lossy().to_string())
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
        } else {
            println!("[Tauri] Automa extension not found at {:?}", ext_dir);
        }

        // TODO: Load Fingerprint and Proxy from DB and append args here

        Ok(cmd)
    }
}
