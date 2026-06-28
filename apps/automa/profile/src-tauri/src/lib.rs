use std::path::PathBuf;
pub mod commands;
pub mod db;
pub mod api;
pub mod system;
pub mod error;
pub mod services;

use commands::{credentials, app_store, preferences, browser_profiles};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Emitter, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(url) = args.iter().find(|a| a.starts_with("omnidesk://")) {
                let _ = app.emit("deep-link-received", url.clone());
            }
            let _ = app.get_webview_window("main").expect("no main window").set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .on_window_event(|window, event| {
            // Intercept window close to hide it instead of exiting the app
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .setup(|app| {
            // Setup System Tray
            let quit_i = MenuItem::with_id(app, "quit", "Quit OmniDesk", true, None::<&str>)?;
            let toggle_i = MenuItem::with_id(app, "toggle", "Show/Hide OmniDesk", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "toggle" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.is_visible().map(|visible| {
                                if visible {
                                    let _ = window.hide();
                                } else {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            });
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.is_visible().map(|visible| {
                            if visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        });
                    }
                })
                .build(app)?;

            // Smart dev .env loader (scan parent directories for .env or apps/web/.env)
            if let Ok(mut current) = std::env::current_dir() {
                for _ in 0..10 {
                    let env_path = current.join(".env");
                    if env_path.exists() {
                        let _ = dotenvy::from_path(env_path);
                        break;
                    }
                    let web_env_path = current.join("apps/web/.env");
                    if web_env_path.exists() {
                        let _ = dotenvy::from_path(web_env_path);
                        break;
                    }
                    if let Some(parent) = current.parent() {
                        current = parent.to_path_buf();
                    } else {
                        break;
                    }
                }
            }
            
            // Smart user-mode deep link registration (bypasses UAC admin requirement)
            system::deep_link::register_protocol_user_mode("omnidesk");
            
            let app_handle = app.handle().clone();
            
            if let Ok(app_dir) = system::config::get_active_storage_path(&app_handle) {
                if std::fs::create_dir_all(&app_dir).is_ok() {
                    // Initialize database synchronously to prevent race conditions with the UI
                    match tauri::async_runtime::block_on(async { db::init_db(app_dir.clone()).await }) {
                        Ok(pool) => {
                            // Manage state for Tauri commands before UI can call them
                            app_handle.manage(pool.clone());
                            
                            let (tx, _rx) = broadcast::channel(100);
                            app_handle.manage(crate::DownloadProgressState { tx });
                            
                            let pool_for_worker = pool.clone();
                            let pool_for_rt = pool.clone();
                            let app_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
                            let app_handle_clone = app_handle.clone();
                            
                            tauri::async_runtime::spawn(async move {
                                // Start Background Worker for Offline Queue
                                services::worker::start_background_worker(pool_for_worker);
                                
                                // Start Realtime WebSocket listener
                                services::realtime::start_realtime_listener(app_handle_clone.clone(), pool_for_rt);
                                
                                // Only run Axum if not disabled
                                if std::env::var("OMNIDESK_DISABLE_API").is_err() {
                                    api::serve(pool, app_dir, 1423, app_handle_clone).await;
                                }
                            });
                        }
                        Err(e) => {
                            panic!("Failed to initialize database: {}", e);
                        }
                    }
                } else {
                    eprintln!("Failed to create app data dir");
                }
            } else {
                eprintln!("Failed to get app data dir");
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            credentials::set_credential,
            credentials::get_credential,
            credentials::delete_credential,
            app_store::install_local_app,
            app_store::list_local_apps,
            preferences::get_user_preferences,
            preferences::update_home_screen_order,
            commands::storage::get_storage_info,
            commands::storage::update_storage_location,
            commands::storage::open_data_folder,
            commands::e2e::run_e2e_orchestrator,
            browser_profiles::get_browser_profiles,
            browser_profiles::create_browser_profile,
            browser_profiles::update_browser_profile,
            browser_profiles::delete_browser_profile,
            browser_profiles::launch_browser_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running OmniDesk");
}


use tokio::sync::broadcast;
#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub browser: String,
    pub total: u64,
    pub downloaded: u64,
    pub percent: f32,
    pub status: String,
}

pub struct DownloadProgressState {
    pub tx: broadcast::Sender<DownloadProgress>,
}
