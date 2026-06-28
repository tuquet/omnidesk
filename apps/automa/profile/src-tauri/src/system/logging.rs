use std::path::PathBuf;

/// Build the Tauri log plugin with session-based lifecycle.
///
/// ## Behavior
/// 1. Log file lives at `AppData/Roaming/<identifier>/logs/backend.log`
///    (same folder the "Open Data Folder" button opens)
/// 2. Log file is **truncated on every app startup** — clean session, no bloat
/// 3. 3rd-party crate noise is filtered to WARN+ only
/// 4. App code (`omnidesk_lib`) logs at DEBUG+ level
/// 5. Stdout mirror for dev console visibility
///
/// ## Usage (in any OmniDesk app's `lib.rs`)
/// ```rust
/// // Profile App
/// .plugin(system::logging::build_log_plugin("com.omnidesk.profile"))
///
/// // Workflow App
/// .plugin(system::logging::build_log_plugin("com.omnidesk.workflow"))
///
/// // Runtime App
/// .plugin(system::logging::build_log_plugin("com.omnidesk.runtime"))
/// ```
///
/// ## Reuse
/// Copy this file into any `src-tauri/src/system/logging.rs` and register it
/// in `system/mod.rs` with `pub mod logging;`. The function is self-contained
/// with zero app-specific dependencies.
pub fn build_log_plugin(identifier: &str) -> tauri::plugin::TauriPlugin<tauri::Wry> {
    let log_dir = resolve_log_dir(identifier);

    // Session-based cleanup: wipe previous session's log
    truncate_session_log(&log_dir, "backend");

    tauri_plugin_log::Builder::new()
        .targets([
            // Primary: file in Roaming AppData (visible from "Open Data Folder")
            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Folder {
                path: log_dir,
                file_name: Some("backend".into()),
            }),
            // Secondary: stdout for dev console (`cargo tauri dev`)
            tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
        ])
        .level(log::LevelFilter::Info)
        // ── Silence noisy 3rd-party crates (WARN+ only) ─────────────
        .level_for("tungstenite", log::LevelFilter::Warn)
        .level_for("tokio_tungstenite", log::LevelFilter::Warn)
        .level_for("hyper", log::LevelFilter::Warn)
        .level_for("hyper_util", log::LevelFilter::Warn)
        .level_for("reqwest", log::LevelFilter::Warn)
        .level_for("sqlx", log::LevelFilter::Warn)
        .level_for("axum", log::LevelFilter::Warn)
        .level_for("tower_http", log::LevelFilter::Warn)
        .level_for("tracing", log::LevelFilter::Warn)
        .level_for("want", log::LevelFilter::Warn)
        .level_for("mio", log::LevelFilter::Warn)
        // ── Our app code gets full DEBUG+ ────────────────────────────
        .level_for("omnidesk_lib", log::LevelFilter::Debug)
        // Safety cap per file — should never hit since we truncate per session
        .max_file_size(10_000_000) // 10MB
        .build()
}

/// Resolve log directory: `<Roaming AppData>/<identifier>/logs/`
fn resolve_log_dir(identifier: &str) -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let log_dir = base.join(identifier).join("logs");
    let _ = std::fs::create_dir_all(&log_dir);
    log_dir
}

/// Truncate the log file to 0 bytes — clean start every session.
fn truncate_session_log(log_dir: &PathBuf, file_name: &str) {
    let log_file = log_dir.join(format!("{}.log", file_name));
    if log_file.exists() {
        let _ = std::fs::write(&log_file, b"");
    }
}
