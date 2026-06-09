pub mod commands;
pub mod db;
pub mod models;
pub mod api;

use commands::{issues, credentials};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
                std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
                
                // Initialize database
                let pool = db::init_db(app_dir).await.expect("Failed to initialize database");
                
                // Manage state for Tauri commands
                app_handle.manage(pool.clone());
                
                // Start Axum REST API and Swagger UI on port 8080
                api::serve(pool, 8080).await;
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            issues::get_issues,
            issues::get_issue_by_id,
            issues::create_issue,
            issues::update_issue,
            issues::delete_issue,
            issues::get_statistics,
            credentials::set_credential,
            credentials::get_credential,
            credentials::delete_credential,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kill Bug Machine");
}
