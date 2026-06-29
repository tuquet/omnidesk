use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool};
use std::path::PathBuf;

pub mod models;

pub async fn init_db(app_dir: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app_dir.join("omnidesk.db");
    
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true);
        
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    // Run migrations automatically on startup
    sqlx::migrate!("../../../packages-rs/omni-shared/migrations").run(&pool).await?;
        
    Ok(pool)
}
