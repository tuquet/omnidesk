use std::time::Duration;

#[tauri::command]
pub async fn check_real_network() -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build();
        
    if let Ok(client) = client {
        // Ping Cloudflare's fast endpoint
        return client.get("https://1.1.1.1").send().await.is_ok();
    }
    false
}
