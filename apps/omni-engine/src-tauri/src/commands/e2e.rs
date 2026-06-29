use tauri::{AppHandle, Emitter, command};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::thread;

#[command]
pub async fn run_e2e_orchestrator(app: AppHandle) -> Result<(), String> {
    println!("[Tauri] Starting E2E Orchestrator...");
    
    // Determine the path to the e2e-orchestrator
    // Assuming we are running inside the monorepo for now
    let mut current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    
    // Find the apps/e2e-orchestrator directory by traversing up if needed
    for _ in 0..5 {
        let test_path = current_dir.join("apps/e2e-orchestrator");
        if test_path.exists() {
            current_dir = test_path;
            break;
        }
        if let Some(parent) = current_dir.parent() {
            current_dir = parent.to_path_buf();
        } else {
            break;
        }
    }
    
    if !current_dir.ends_with("e2e-orchestrator") {
        let msg = format!("Could not find apps/e2e-orchestrator directory from {:?}", std::env::current_dir());
        println!("[Tauri] {}", msg);
        return Err(msg);
    }
    
    println!("[Tauri] Spawning orchestrator in {:?}", current_dir);

    // Use npm or pnpm depending on environment
    let program = if cfg!(target_os = "windows") { "pnpm.cmd" } else { "pnpm" };
    
    let mut child = Command::new(program)
        .arg("test")
        .current_dir(&current_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start e2e orchestrator: {}", e))?;

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    
    let app_handle_out = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() {
            println!("[E2E OUT] {}", line);
            let _ = app_handle_out.emit("e2e-log", line);
        }
    });
    
    let app_handle_err = app.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() {
            println!("[E2E ERR] {}", line);
            let _ = app_handle_err.emit("e2e-log", format!("ERROR: {}", line));
        }
    });
    
    // We don't wait for the child here to keep the Tauri command async without blocking
    // In a real app we might store the child in Tauri state to be able to kill it later
    
    Ok(())
}
