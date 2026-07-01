/// Smart user-mode deep link registration (bypasses UAC admin requirement).
/// Registers the given protocol scheme (e.g., "omnidesk") in HKCU (HKEY_CURRENT_USER)
/// instead of HKEY_CLASSES_ROOT on Windows.
#[cfg(target_os = "windows")]
pub fn register_protocol_user_mode(scheme: &str) {
    use std::os::windows::process::CommandExt;

    // Attempt to get the path to the current executable
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_str) = exe_path.to_str() {
            let cmd_str = format!("\"{}\" \"%1\"", exe_str);

            // 1. Create the base key: HKCU\Software\Classes\<scheme>
            // Set the default value to "URL:<scheme> Protocol"
            let base_key = format!("HKCU\\Software\\Classes\\{}", scheme);
            let default_val = format!("URL:{} Protocol", scheme);
            let _ = std::process::Command::new("reg")
                .args(["add", &base_key, "/ve", "/d", &default_val, "/f"])
                .creation_flags(0x08000000) // CREATE_NO_WINDOW
                .output();

            // 2. Add the "URL Protocol" string value (empty data)
            let _ = std::process::Command::new("reg")
                .args(["add", &base_key, "/v", "URL Protocol", "/d", "", "/f"])
                .creation_flags(0x08000000)
                .output();

            // 3. Set the shell open command: HKCU\Software\Classes\<scheme>\shell\open\command
            let cmd_key = format!("{}\\shell\\open\\command", base_key);
            let _ = std::process::Command::new("reg")
                .args(["add", &cmd_key, "/ve", "/d", &cmd_str, "/f"])
                .creation_flags(0x08000000)
                .output();
        }
    }
}

/// No-op for non-Windows platforms since they handle deep links differently
/// (e.g., via Info.plist on macOS or desktop entries on Linux).
#[cfg(not(target_os = "windows"))]
pub fn register_protocol_user_mode(_scheme: &str) {
    // macOS and Linux rely on app bundles / .desktop files.
    // Dynamic runtime registration is generally a Windows-specific pattern.
}
