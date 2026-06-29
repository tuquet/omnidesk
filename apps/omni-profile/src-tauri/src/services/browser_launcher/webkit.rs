use std::process::Command;
use crate::error::AppError;
use crate::system::config::get_active_storage_path;
use crate::db::models::browser_profile::BrowserProfile;

pub struct WebkitLauncher;

impl WebkitLauncher {
    pub async fn resolve_executable(&self, _profile: &BrowserProfile, app: &tauri::AppHandle) -> Result<String, AppError> {
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        
        // 1. Ensure Playwright Driver is downloaded
        let driver_url = "https://playwright.azureedge.net/builds/driver/playwright-1.40.0-win32_x64.zip";
        let driver_dir = app_dir.join("browser").join("playwright-driver");
        let node_path = super::downloader::download_browser_if_missing(
            app, 
            &driver_dir, 
            driver_url,
            "node.exe"
        ).await?;

        // 2. Install WebKit using Playwright Driver CLI
        log::info!("[WebKit] Ensuring WebKit is installed via Playwright Driver...");
        
        // Emit progress event for UI so it doesn't just hang silently
        super::downloader::emit_progress(app, crate::DownloadProgress {
            browser: "webkit".to_string(),
            status: "Installing WebKit Engine...".to_string(),
            downloaded: 0,
            total: 0,
            percent: 0.0,
        }).await;

        let cli_js_path = driver_dir.join("package").join("cli.js");
        let browsers_path = app_dir.join("browser").join("playwright-browsers");
        
        let status = Command::new(&node_path)
            .arg(&cli_js_path)
            .arg("install")
            .arg("webkit")
            .env("PLAYWRIGHT_BROWSERS_PATH", &browsers_path)
            .status()
            .map_err(|e| AppError::Internal(format!("Failed to execute playwright install: {}", e)))?;
            
        // Clear progress after install completes
        super::downloader::emit_progress(app, crate::DownloadProgress {
            browser: "webkit".to_string(),
            status: "done".to_string(),
            downloaded: 0,
            total: 0,
            percent: 100.0,
        }).await;
            
        if !status.success() {
            return Err(AppError::Internal("Failed to install webkit browsers".to_string()));
        }

        // 3. Create launch.js script dynamically
        let launch_script_path = driver_dir.join("launch_webkit.js");
        let script_content = r#"
const { webkit } = require('./package/index.js');

(async () => {
    const dataDir = process.argv[2];
    const browser = await webkit.launchPersistentContext(dataDir, {
        headless: false,
        args: []
    });
    browser.on('close', () => process.exit(0));
})();
"#;
        std::fs::write(&launch_script_path, script_content)
            .map_err(|e| AppError::Internal(format!("Failed to write launch_webkit.js: {}", e)))?;

        Ok(node_path.to_string_lossy().to_string())
    }

    pub async fn build_command(
        &self, 
        profile: &BrowserProfile, 
        app: &tauri::AppHandle,
        data_dir: &std::path::Path
    ) -> Result<Command, AppError> {
        let exe_path = self.resolve_executable(profile, app).await?;
        let mut cmd = Command::new(&exe_path);
        
        let app_dir = get_active_storage_path(app)
            .map_err(|_| AppError::Internal("Failed to get storage path".to_string()))?;
        let driver_dir = app_dir.join("browser").join("playwright-driver");
        let launch_script_path = driver_dir.join("launch_webkit.js");
        let browsers_path = app_dir.join("browser").join("playwright-browsers");

        cmd.arg(&launch_script_path);
        cmd.arg(data_dir.to_string_lossy().to_string());
        cmd.env("PLAYWRIGHT_BROWSERS_PATH", &browsers_path);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }

        Ok(cmd)
    }
}
