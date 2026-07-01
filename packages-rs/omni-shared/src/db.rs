use sqlx::SqlitePool;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DbComponent {
    Shared,
    Automa,
}

/// Run centralized database migrations for the provided components
pub async fn run_migrations(pool: &SqlitePool, components: &[DbComponent]) -> Result<(), sqlx::migrate::MigrateError> {
    if components.contains(&DbComponent::Shared) {
        let mut shared_migrator = sqlx::migrate!("./migrations");
        shared_migrator.set_ignore_missing(true);
        shared_migrator.run(pool).await?;
    }

    if components.contains(&DbComponent::Automa) {
        let mut automa_migrator = sqlx::migrate!("./migrations-automa");
        automa_migrator.set_ignore_missing(true);
        automa_migrator.run(pool).await?;
    }

    Ok(())
}
