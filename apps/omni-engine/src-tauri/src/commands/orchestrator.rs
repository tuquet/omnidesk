use tauri::{AppHandle, Emitter, command, Manager};
use std::fs;
use std::io::Cursor;
use reqwest;
use zip::ZipArchive;

const AUTOMA_URL: &str = "https://github.com/tuquet/automa/releases/latest/download/automa-extension.zip";

#[command]
pub async fn ensure_automa_extension(app: AppHandle) -> Result<String, String> {
    let _ = app.emit("e2e-log", "[SYSTEM] Checking Automa Extension...");

    let app_dir = crate::system::config::get_active_storage_path(&app)
        .map_err(|_| "Failed to get active storage path".to_string())?;
    let automa_dir = app_dir.join("extensions").join("automa");
    if automa_dir.exists() && automa_dir.join("manifest.json").exists() {
        let _ = app.emit("e2e-log", "[SYSTEM] Automa Extension is already unpacked and ready.");
        return Ok(automa_dir.to_string_lossy().to_string());
    }

    let _ = app.emit("e2e-log", "[SYSTEM] Downloading Automa Extension...");

    let response = reqwest::get(AUTOMA_URL)
        .await
        .map_err(|e| format!("Failed to download extension: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read extension bytes: {}", e))?;

    let _ = app.emit("e2e-log", "[SYSTEM] Download complete. Unzipping...");

    if !automa_dir.exists() {
        fs::create_dir_all(&automa_dir).map_err(|e| e.to_string())?;
    }

    let reader = Cursor::new(response);
    let mut archive = ZipArchive::new(reader).map_err(|e| format!("Invalid zip archive: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => automa_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(&p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    let _ = app.emit("e2e-log", "[SYSTEM] Automa Extension unzipped successfully.");
    Ok(automa_dir.to_string_lossy().to_string())
}
