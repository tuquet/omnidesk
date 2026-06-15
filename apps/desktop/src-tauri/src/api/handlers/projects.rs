use axum::{
    extract::Path,
    response::sse::{Event, Sse},
};
use futures_util::stream::Stream;
use std::{convert::Infallible, path::PathBuf, process::Stdio};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use async_stream::try_stream;
use crate::error::AppError;

/// Runs a specific npm script for a project and streams the command stdout/stderr back as Server-Sent Events.
pub async fn run_project_script(
    Path((project_id, script)): Path<(String, String)>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, AppError> {
    // Validate project_id and script
    if project_id != "nhaatelier" {
        return Err(AppError::NotFound("Project not found".to_string()));
    }
    
    let allowed_scripts = ["pull", "push", "pull-media", "scan-media", "clean-media"];
    if !allowed_scripts.contains(&script.as_str()) {
        return Err(AppError::BadRequest("Invalid script name".to_string()));
    }

    // Dynamically locate the nhaateliertattoo workspace
    let mut current = std::env::current_dir().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut project_path = None;
    for _ in 0..10 {
        let test_path = current.join("nhaateliertattoo/apps/nhaatelier-content");
        if test_path.exists() {
            project_path = Some(test_path);
            break;
        }
        if let Some(parent) = current.parent() {
            current = parent.to_path_buf();
        } else {
            break;
        }
    }

    // Fallback to absolute path on the user's local machine
    let project_path = project_path.unwrap_or_else(|| {
        PathBuf::from(r"C:\Users\pn.tund2\Documents\Repository\nhaateliertattoo\apps\nhaatelier-content")
    });

    if !project_path.exists() {
        return Err(AppError::NotFound(format!(
            "Project path does not exist: {:?}",
            project_path
        )));
    }

    // On Windows, commands should use npm.cmd
    #[cfg(target_os = "windows")]
    let npm_cmd = "npm.cmd";
    #[cfg(not(target_os = "windows"))]
    let npm_cmd = "npm";

    let mut cmd = Command::new(npm_cmd);
    cmd.arg("run")
        .arg(&script)
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| {
        AppError::Internal(format!(
            "Failed to spawn npm command in {:?}: {}",
            project_path, e
        ))
    })?;

    let stdout = child.stdout.take().ok_or_else(|| {
        AppError::Internal("Failed to open stdout of child process".to_string())
    })?;
    let stderr = child.stderr.take().ok_or_else(|| {
        AppError::Internal("Failed to open stderr of child process".to_string())
    })?;

    let mut stdout_reader = BufReader::new(stdout).lines();
    let mut stderr_reader = BufReader::new(stderr).lines();

    let stream = try_stream! {
        yield Event::default().data(format!("[System] Starting 'npm run {}' in {:?}...", script, project_path));

        loop {
            tokio::select! {
                line = stdout_reader.next_line() => {
                    match line {
                        Ok(Some(text)) => {
                            yield Event::default().data(text);
                        }
                        Ok(None) => break, // stdout closed, indicating process finished or finishing
                        Err(e) => {
                            yield Event::default().data(format!("[Error reading stdout]: {}", e));
                            break;
                        }
                    }
                }
                line = stderr_reader.next_line() => {
                    match line {
                        Ok(Some(text)) => {
                            yield Event::default().data(format!("[stderr] {}", text));
                        }
                        Ok(None) => {}
                        Err(e) => {
                            yield Event::default().data(format!("[Error reading stderr]: {}", e));
                        }
                    }
                }
            }
        }

        // Wait for child process execution to complete
        match child.wait().await {
            Ok(status) => {
                if status.success() {
                    yield Event::default().data("[System] Command finished successfully.");
                } else {
                    yield Event::default().data(format!("[System] Command exited with status: {}", status));
                }
            }
            Err(e) => {
                yield Event::default().data(format!("[System] Error waiting for process: {}", e));
            }
        }
    };

    Ok(Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default()))
}
