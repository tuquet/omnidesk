use clap::{Parser, Subcommand};
use sqlx::sqlite::SqlitePoolOptions;
use std::env;

#[derive(Parser)]
#[command(name = "kbm-cli")]
#[command(about = "Kill Bug Machine CLI Tool", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Database operations
    Db {
        #[command(subcommand)]
        action: DbAction,
    },
    /// Issues operations
    Issues {
        #[command(subcommand)]
        action: IssuesAction,
    },
}

#[derive(Subcommand)]
enum DbAction {
    /// Show database statistics
    Stats,
}

#[derive(Subcommand)]
enum IssuesAction {
    /// List recent issues
    List,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    // Determine DB path. By default it's in the local app data directory created by Tauri
    // Windows: C:\Users\Username\AppData\Local\com.kbm.dev\kbm.db
    let default_app_data = dirs::data_local_dir()
        .map(|d| d.join("com.kbm.dev").join("kbm.db"))
        .unwrap_or_else(|| std::path::PathBuf::from("kbm.db"));
        
    let db_path = env::var("KBM_DB_PATH")
        .map(std::path::PathBuf::from)
        .unwrap_or(default_app_data);

    if !db_path.exists() {
        println!("Database not found at {:?}", db_path);
        println!("You can override this by setting KBM_DB_PATH environment variable.");
        return Ok(());
    }

    // Read-only mode for safety in CLI
    let db_url = format!("sqlite://{}?mode=ro", db_path.to_string_lossy().replace("\\", "/"));
    
    let pool = SqlitePoolOptions::new()
        .connect(&db_url)
        .await?;

    match &cli.command {
        Commands::Db { action } => match action {
            DbAction::Stats => {
                let issues_count: (i64,) = sqlx::query_as("SELECT count(*) FROM issues")
                    .fetch_one(&pool)
                    .await?;
                println!("Database Stats:");
                println!("- Path: {:?}", db_path);
                println!("- Total Issues: {}", issues_count.0);
            }
        },
        Commands::Issues { action } => match action {
            IssuesAction::List => {
                let rows: Vec<(String, String, String)> = sqlx::query_as(
                    "SELECT id, title, status FROM issues ORDER BY created_at DESC LIMIT 10"
                )
                .fetch_all(&pool)
                .await?;
                
                println!("{:<40} | {:<15} | {}", "ID", "STATUS", "TITLE");
                println!("{:-<40}-+-{:-<15}-+-{:-<40}", "", "", "");
                for row in rows {
                    println!("{:<40} | {:<15} | {}", row.0, row.2, row.1);
                }
            }
        }
    }

    Ok(())
}
