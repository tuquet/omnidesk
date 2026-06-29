use reqwest::blocking::Client;
use std::time::Duration;

#[tauri::command]
pub fn check_real_network() -> bool {
    let client = Client::builder()
        .timeout(Duration::from_secs(3))
        .build();
        
    if let Ok(client) = client {
        // Ping Cloudflare's fast endpoint
        return client.get("https://1.1.1.1").send().is_ok();
    }
    false
}
