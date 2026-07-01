use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, SqlitePool};
use std::path::PathBuf;

pub mod models;

pub async fn init_db(app_dir: PathBuf) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app_dir.join("omnidesk.db");
    
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);
        
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    // Run migrations automatically on startup
    omni_shared::db::run_migrations(&pool, &[
        omni_shared::db::DbComponent::Shared,
        omni_shared::db::DbComponent::Automa,
    ]).await?;

    Ok(pool)
}
