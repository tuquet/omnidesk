use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool};
use std::str::FromStr;
use std::path::PathBuf;

pub async fn init_db(app_dir: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app_dir.join("omnidesk.db");
    
    // Convert to proper sqlite URL format
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy().replace("\\", "/"));
    
    let options = SqliteConnectOptions::from_str(&db_url)
        .unwrap_or_else(|_| SqliteConnectOptions::new().filename(&db_path))
        .create_if_missing(true)
        .foreign_keys(true);
        
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    // Run migrations automatically on startup
    sqlx::migrate!("./migrations").run(&pool).await?;
        
    Ok(pool)
}
