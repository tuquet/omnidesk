use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use std::str::FromStr;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = PathBuf::from(r"C:\Users\Admin\AppData\Roaming\com_omnidesk");
    let db_path = app_dir.join("omnidesk.db");
    
    let db_url = format!("sqlite:///{}?mode=rwc", db_path.to_string_lossy().replace("\\", "/"));
    println!("db_url: {}", db_url);
    
    let options = SqliteConnectOptions::from_str(&db_url)
        .unwrap_or_else(|_| SqliteConnectOptions::new().filename(&db_path))
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);
        
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    println!("Successfully connected!");
    
    // Test if we can read
    let count: (i64,) = sqlx::query_as("SELECT count(*) FROM user_preferences")
        .fetch_one(&pool)
        .await?;
    println!("Count: {}", count.0);
    
    Ok(())
}
