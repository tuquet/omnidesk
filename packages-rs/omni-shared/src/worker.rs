use crate::error::AppError;
use reqwest::Client;
use serde_json::Value;
use sqlx::SqlitePool;
use std::time::Duration;

#[derive(sqlx::FromRow)]
struct SyncJob {
    id: String,
    user_id: String,
    action: String,
    payload: String,
}

fn get_supabase_config() -> Result<(String, String), AppError> {
    let url = std::env::var("VITE_SUPABASE_URL")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_URL".to_string()))?;
    let key = std::env::var("VITE_SUPABASE_ANON_KEY")
        .map_err(|_| AppError::Internal("Missing VITE_SUPABASE_ANON_KEY".to_string()))?;
    Ok((url, key))
}

pub fn start_background_worker(pool: SqlitePool) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(10));
        let client = Client::new();

        loop {
            interval.tick().await;

            // Fetch pending jobs atomically with RETURNING to prevent race conditions between Omni apps
            let jobs_result = sqlx::query_as::<_, SyncJob>(
                "UPDATE sync_queue SET status = 'PROCESSING' WHERE status = 'PENDING' RETURNING id, user_id, action, payload"
            )
            .fetch_all(&pool)
            .await;

            let jobs = match jobs_result {
                Ok(jobs) => jobs,
                Err(e) => {
                    eprintln!("[Worker] Failed to fetch sync_queue: {}", e);
                    continue;
                }
            };

            for job in jobs {
                if let Ok((url, anon_key)) = get_supabase_config() {
                    let mut success = false;

                    // Decrypt Payload
                    let (priv_key, _pub) =
                        match crate::crypto::get_or_generate_keypair(&job.user_id) {
                            Ok(keys) => keys,
                            Err(e) => {
                                eprintln!(
                                    "[Worker] Failed to get keypair for {}: {:?}",
                                    job.user_id, e
                                );
                                continue;
                            }
                        };

                    let decrypted_payload = match crate::crypto::decrypt_payload(
                        &priv_key,
                        &job.payload,
                    ) {
                        Ok(p) => p,
                        Err(e) => {
                            eprintln!("[Worker] Failed to decrypt job {}: {:?}. Deleting permanently from queue due to decryption error.", job.id, e);
                            let _ = sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                                .bind(&job.id)
                                .execute(&pool)
                                .await;
                            continue;
                        }
                    };

                    // Sign Payload
                    let signature =
                        match crate::crypto::sign_payload(&priv_key, &decrypted_payload) {
                            Ok(s) => s,
                            Err(e) => {
                                eprintln!("[Worker] Failed to sign job {}: {:?}", job.id, e);
                                continue;
                            }
                        };

                    if job.action == "INSTALL_APP" {
                        if let Ok(payload) = serde_json::from_str::<Value>(&decrypted_payload) {
                            let res = client
                                .post(format!("{}/rest/v1/user_installed_apps", url))
                                .header("apikey", &anon_key)
                                .header("X-OmniDesk-Signature", &signature)
                                .header("X-OmniDesk-User", &job.user_id)
                                .header("Content-Type", "application/json")
                                .header("Prefer", "resolution=merge-duplicates")
                                .json(&payload)
                                .send()
                                .await;

                            if let Ok(response) = res {
                                if response.status().is_success()
                                    || response.status() == reqwest::StatusCode::CONFLICT
                                {
                                    success = true;
                                } else {
                                    eprintln!(
                                        "[Worker] Sync INSTALL failed HTTP {}",
                                        response.status()
                                    );
                                }
                            }
                        }
                    } else if job.action == "UNINSTALL_APP" {
                        if let Ok(payload) = serde_json::from_str::<Value>(&decrypted_payload) {
                            if let (Some(user_id), Some(app_id)) = (
                                payload.get("user_id").and_then(|v| v.as_str()),
                                payload.get("app_id").and_then(|v| v.as_str()),
                            ) {
                                let res = client
                                    .delete(format!(
                                        "{}/rest/v1/user_installed_apps?user_id=eq.{}&app_id=eq.{}",
                                        url, user_id, app_id
                                    ))
                                    .header("apikey", &anon_key)
                                    .header("X-OmniDesk-Signature", &signature)
                                    .header("X-OmniDesk-User", &job.user_id)
                                    .send()
                                    .await;

                                if let Ok(response) = res {
                                    if response.status().is_success() {
                                        success = true;
                                    } else {
                                        eprintln!(
                                            "[Worker] Sync UNINSTALL failed HTTP {}",
                                            response.status()
                                        );
                                    }
                                }
                            }
                        }
                    } else if job.action == "UPDATE_PREFERENCES" {
                        if let Ok(payload) = serde_json::from_str::<Value>(&decrypted_payload) {
                            let res = client
                                .post(format!("{}/rest/v1/user_preferences", url))
                                .header("apikey", &anon_key)
                                .header("X-OmniDesk-Signature", &signature)
                                .header("X-OmniDesk-User", &job.user_id)
                                .header("Content-Type", "application/json")
                                .header("Prefer", "resolution=merge-duplicates")
                                .json(&payload)
                                .send()
                                .await;

                            if let Ok(response) = res {
                                if response.status().is_success()
                                    || response.status() == reqwest::StatusCode::CONFLICT
                                {
                                    success = true;
                                } else {
                                    eprintln!(
                                        "[Worker] Sync UPDATE_PREFERENCES failed HTTP {}",
                                        response.status()
                                    );
                                }
                            }
                        }
                    }

                    if success {
                        // Remove from queue
                        let _ = sqlx::query("DELETE FROM sync_queue WHERE id = ?")
                            .bind(&job.id)
                            .execute(&pool)
                            .await;
                        println!("[Worker] Synced job {} successfully", job.id);
                    }
                }
            }
        }
    });
}
