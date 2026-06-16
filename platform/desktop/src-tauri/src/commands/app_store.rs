use std::fs;
use std::io::Read;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use zip::ZipArchive;
use serde_json::Value;

#[derive(serde::Serialize)]
pub struct InstallAppResponse {
    pub success: bool,
    pub message: String,
    pub app_id: String,
}

#[tauri::command]
pub async fn install_local_app(
    app: AppHandle,
    zip_path: String,
) -> Result<InstallAppResponse, String> {
    let zip_file = fs::File::open(&zip_path).map_err(|e| format!("Failed to open zip: {}", e))?;
    let mut archive = ZipArchive::new(zip_file).map_err(|e| format!("Invalid zip archive: {}", e))?;

    // Step 1: Find and read manifest.json to get app_id
    let mut app_id = String::new();
    {
        let mut manifest_file = archive.by_name("manifest.json").map_err(|_| "manifest.json not found in the root of zip")?;
        let mut manifest_content = String::new();
        manifest_file.read_to_string(&mut manifest_content).map_err(|e| format!("Failed to read manifest: {}", e))?;
        
        let manifest_json: Value = serde_json::from_str(&manifest_content).map_err(|e| format!("Invalid JSON in manifest: {}", e))?;
        if let Some(id) = manifest_json.get("id").and_then(|v| v.as_str()) {
            app_id = id.to_string();
        } else {
            return Err("Manifest is missing 'id' field".to_string());
        }
    }

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("InstalledApps")
        .join(&app_id);

    // Create target directory if not exists
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Failed to create app directory: {}", e))?;
    }

    // Extract zip contents
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| format!("Error reading zip entry: {}", e))?;
        let outpath = match file.enclosed_name() {
            Some(path) => app_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| format!("Error creating directory: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| format!("Error creating parent directory: {}", e))?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| format!("Error creating output file: {}", e))?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| format!("Error writing file: {}", e))?;
        }
        
        // Permissions for Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                let _ = fs::set_permissions(&outpath, fs::Permissions::from_mode(mode));
            }
        }
    }

    Ok(InstallAppResponse {
        success: true,
        message: format!("App {} installed successfully to {:?}", app_id, app_dir),
        app_id,
    })
}

#[tauri::command]
pub async fn list_local_apps(app: AppHandle) -> Result<Vec<Value>, String> {
    let mut apps = Vec::new();
    
    let installed_apps_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("InstalledApps");
        
    if !installed_apps_dir.exists() {
        return Ok(apps);
    }
    
    let entries = fs::read_dir(installed_apps_dir).map_err(|e| format!("Failed to read InstalledApps: {}", e))?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_dir() {
                let manifest_path = path.join("manifest.json");
                if manifest_path.exists() {
                    if let Ok(content) = fs::read_to_string(&manifest_path) {
                        if let Ok(json) = serde_json::from_str::<Value>(&content) {
                            apps.push(json);
                        }
                    }
                }
            }
        }
    }
    
    // IN DEVELOPMENT: Also read from the monorepo's `apps/` folder.
    #[cfg(debug_assertions)]
    {
        let workspace_apps_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../../apps");
        if workspace_apps_dir.exists() {
            if let Ok(entries) = fs::read_dir(workspace_apps_dir) {
                for entry in entries {
                    if let Ok(entry) = entry {
                        let path = entry.path();
                        if path.is_dir() {
                            let manifest_path = path.join("manifest.json");
                            if manifest_path.exists() {
                                if let Ok(content) = fs::read_to_string(&manifest_path) {
                                    if let Ok(mut json) = serde_json::from_str::<Value>(&content) {
                                        // Inject local dev path to indicate it's a workspace app
                                        if let Some(obj) = json.as_object_mut() {
                                            obj.insert("devPath".to_string(), Value::String(path.to_string_lossy().to_string()));
                                        }
                                        apps.push(json);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(apps)
}
