use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "omnidesk-cli")]
#[command(about = "OmniDesk CLI Tool (via REST API)", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Check API health
    Health,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let base_url = "http://localhost:8080";

    match &cli.command {
        Commands::Health => {
            let url = format!("{}/health", base_url);
            let client = reqwest::Client::new();
            
            let res = client.get(&url).send().await?;
            if res.status().is_success() {
                let text = res.text().await?;
                println!("Health Check Passed: {}", text);
            } else {
                println!("Health Check Failed: {}", res.status());
            }
        }
    }

    Ok(())
}
