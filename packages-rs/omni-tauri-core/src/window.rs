use tauri::{AppHandle, Manager, Window};

#[tauri::command]
pub fn toggle_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn flash_taskbar(window: Window) -> Result<(), String> {
    // Only works on Windows/macOS with UserAttentionType
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    {
        window.request_user_attention(Some(tauri::UserAttentionType::Critical))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
