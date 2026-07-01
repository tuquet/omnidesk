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
        
    // Create .gitignore if not exists to avoid committing the DB
    let gitignore_path = app_dir.join(".gitignore");
    if !gitignore_path.exists() {
        let _ = std::fs::write(&gitignore_path, "omnidesk.db*\n.env\n");
    }
        
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    // Run migrations automatically on startup
    let mut shared_migrator = sqlx::migrate!("../../../packages-rs/omni-shared/migrations");
    shared_migrator.set_ignore_missing(true);
    shared_migrator.run(&pool).await?;

    let mut automa_migrator = sqlx::migrate!("../../../packages-rs/omni-shared/migrations-automa");
    automa_migrator.set_ignore_missing(true);
    automa_migrator.run(&pool).await?;
    Ok(pool)
}
