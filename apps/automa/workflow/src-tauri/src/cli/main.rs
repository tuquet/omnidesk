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
    /// Connect to the OmniDesk MCP Server
    Mcp {
        #[command(subcommand)]
        action: McpCommands,
    },
}

#[derive(Subcommand)]
enum McpCommands {
    /// Get the connection URL for the MCP Server
    Connect,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let base_url = "http://localhost:1422"; // Updated to use kernel port

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
        Commands::Mcp { action } => match action {
            McpCommands::Connect => {
                println!("--- OmniDesk MCP Server ---");
                println!("The MCP server is running as an SSE stream via the OmniDesk Kernel.");
                println!("To connect your AI agents (Cline, Cursor, etc.):");
                println!("  URL: {}/mcp/sse", base_url);
                println!("  POST URL: {}/mcp/messages?sessionId=<uuid>", base_url);
                println!("-----------------------------");
            }
        },
    }

    Ok(())
}
