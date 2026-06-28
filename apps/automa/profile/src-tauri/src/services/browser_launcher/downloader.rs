use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use futures_util::StreamExt;
use std::io::Write;
use reqwest::Client;
use crate::error::AppError;

pub async fn emit_progress(app: &AppHandle, progress: crate::DownloadProgress) {
    use tauri::Manager;
    if let Some(state) = app.try_state::<crate::DownloadProgressState>() {
        let _ = state.tx.send(progress);
    }
}

pub async fn download_browser_if_missing(
    app: &AppHandle, 
    browser_dir: &PathBuf, 
    download_url: &str, 
    exe_relative_path: &str
) -> Result<PathBuf, AppError> {
    let exe_path = browser_dir.join(exe_relative_path);
    if exe_path.exists() {
        return Ok(exe_path);
    }

    log::info!("[Downloader] Browser not found at {:?}. Starting download from {}", exe_path, download_url);
    
    // Ensure dir exists
    std::fs::create_dir_all(browser_dir)
        .map_err(|e| AppError::Internal(format!("Failed to create browser dir: {}", e)))?;
        
    let zip_path = browser_dir.join("browser-download.zip");
    
    let client = Client::new();
    let res = client.get(download_url).send().await
        .map_err(|e| AppError::Internal(format!("Failed to download Browser: {}", e)))?;
        
    let total_size = res.content_length();
    
    emit_progress(app, crate::DownloadProgress {
        browser: "chromium".to_string(),
        status: "downloading".to_string(),
        downloaded: 0,
        total: total_size.unwrap_or(0),
        percent: 0.0,
    }).await;
    
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();
    
    let mut file = std::fs::File::create(&zip_path)
        .map_err(|e| AppError::Internal(format!("Failed to create zip file: {}", e)))?;
        
    let mut last_percentage = 0.0;
    
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| AppError::Internal(format!("Error while reading download stream: {}", e)))?;
        file.write_all(&chunk).map_err(|e| AppError::Internal(format!("Error writing to file: {}", e)))?;
        downloaded += chunk.len() as u64;
        
        let percentage = total_size.map(|t| (downloaded as f64 / t as f64) * 100.0);
        
        if let Some(p) = percentage {
            if p - last_percentage > 1.0 || downloaded == total_size.unwrap_or(0) {
                last_percentage = p;
                emit_progress(app, crate::DownloadProgress {
                    browser: "chromium".to_string(),
                    status: "downloading".to_string(),
                    downloaded,
                    total: total_size.unwrap_or(0),
                    percent: p as f32,
                }).await;
            }
        }
    }
    
    file.flush().unwrap();
    
    log::info!("[Downloader] Download complete. Extracting...");
    emit_progress(app, crate::DownloadProgress {
        browser: "chromium".to_string(),
        status: "extracting".to_string(),
        downloaded,
        total: total_size.unwrap_or(0),
        percent: 100.0,
    }).await;
    
    let zip_file = std::fs::File::open(&zip_path)
        .map_err(|e| AppError::Internal(format!("Failed to open zip for extraction: {}", e)))?;
        
    let browser_dir_clone = browser_dir.clone();
    let zip_path_clone = zip_path.clone();

    tokio::task::spawn_blocking(move || {
        let mut archive = zip::ZipArchive::new(zip_file)
            .map_err(|e| AppError::Internal(format!("Failed to read zip archive: {}", e)))?;
            
        archive.extract(&browser_dir_clone)
            .map_err(|e| AppError::Internal(format!("Failed to extract zip archive: {}", e)))?;
            
        let _ = std::fs::remove_file(&zip_path_clone);
        Ok::<(), AppError>(())
    }).await.map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;
    
    log::info!("[Downloader] Extraction complete!");
    emit_progress(app, crate::DownloadProgress {
        browser: "chromium".to_string(),
        status: "done".to_string(),
        downloaded,
        total: total_size.unwrap_or(0),
        percent: 100.0,
    }).await;

    Ok(exe_path)
}
