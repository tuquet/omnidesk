use reqwest;
use std::fs;
use std::io::Cursor;
use tauri::{command, AppHandle, Emitter};
use zip::ZipArchive;

const AUTOMA_URL: &str =
    "https://github.com/tuquet/automa/releases/latest/download/automa-extension.zip";

#[command]
pub async fn ensure_automa_extension(app: AppHandle) -> Result<String, crate::error::AppError> {
    let _ = app.emit(
        omni_tauri_core::constants::E2E_LOG_EVENT,
        "[SYSTEM] Checking Automa Extension...",
    );

    let app_dir = crate::system::config::get_active_storage_path(&app)
        .map_err(|_| "Failed to get active storage path".to_string())?;
    let automa_dir = app_dir.join("extensions").join("automa");
    if automa_dir.exists() && automa_dir.join("manifest.json").exists() {
        let _ = app.emit(
            omni_tauri_core::constants::E2E_LOG_EVENT,
            "[SYSTEM] Automa Extension is already unpacked and ready.",
        );
        return Ok(automa_dir.to_string_lossy().to_string());
    }

    let _ = app.emit(
        omni_tauri_core::constants::E2E_LOG_EVENT,
        "[SYSTEM] Downloading Automa Extension...",
    );

    let response = reqwest::get(AUTOMA_URL)
        .await
        .map_err(|e| format!("Failed to download extension: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read extension bytes: {}", e))?;

    let _ = app.emit(
        omni_tauri_core::constants::E2E_LOG_EVENT,
        "[SYSTEM] Download complete. Unzipping...",
    );

    if !automa_dir.exists() {
        fs::create_dir_all(&automa_dir)?;
    }

    let reader = Cursor::new(response);
    let mut archive = ZipArchive::new(reader).map_err(|e| format!("Invalid zip archive: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| crate::error::AppError::Internal(e.to_string()))?;
        let outpath = match file.enclosed_name() {
            Some(path) => automa_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }
            let mut outfile = fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }
    }

    let _ = app.emit(
        omni_tauri_core::constants::E2E_LOG_EVENT,
        "[SYSTEM] Automa Extension unzipped successfully.",
    );
    Ok(automa_dir.to_string_lossy().to_string())
}
