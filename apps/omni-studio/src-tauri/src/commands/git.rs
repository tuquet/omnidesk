use tauri::{command, AppHandle};
use tokio::process::Command;

#[command]
pub async fn check_git_status(path: String) -> bool {
    let git_dir = std::path::PathBuf::from(path).join(".git");
    git_dir.exists() && git_dir.is_dir()
}

#[command]
pub async fn init_git_repository(
    _app_handle: AppHandle,
    repo_url: String,
    destination_path: String,
) -> Result<String, crate::error::AppError> {
    let git_workspace = std::path::PathBuf::from(&destination_path);

    if !git_workspace.exists() {
        tokio::fs::create_dir_all(&git_workspace)
            .await
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Check if git is installed
    let git_check = Command::new("git").arg("--version").output().await;
    if git_check.is_err() {
        return Err(crate::error::AppError::Internal("GIT_NOT_FOUND".to_string()));
    }

    // Check if the directory is empty
    let is_empty = std::fs::read_dir(&git_workspace)
        .map(|mut i| i.next().is_none())
        .unwrap_or(true);

    if !is_empty {
        // Just git init, git remote add origin
        let _ = Command::new("git")
            .arg("init")
            .current_dir(&git_workspace)
            .output()
            .await;
        let _ = Command::new("git")
            .arg("remote")
            .arg("add")
            .arg("origin")
            .arg(&repo_url)
            .current_dir(&git_workspace)
            .output()
            .await;
    } else {
        // Clone into the destination
        let output = Command::new("git")
            .arg("clone")
            .arg(&repo_url)
            .arg(".") // clone into the selected directory
            .current_dir(&git_workspace)
            .output()
            .await
            .map_err(|e| format!("Failed to execute git clone: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(crate::error::AppError::Internal(format!("Git clone failed: {}", stderr)));
        }
    }

    // Cover the case for completely empty repo
    let status = Command::new("git")
        .arg("status")
        .current_dir(&git_workspace)
        .output()
        .await;

    if let Ok(out) = status {
        let stdout = String::from_utf8_lossy(&out.stdout);
        // "No commits yet" indicates a newly initialized repo without any commits
        if stdout.contains("No commits yet") {
            let readme_path = git_workspace.join("README.md");
            let _ =
                tokio::fs::write(&readme_path, "# Workspace\n\nInitialized by OmniStudio.").await;

            let _ = Command::new("git")
                .arg("branch")
                .arg("-M")
                .arg("main")
                .current_dir(&git_workspace)
                .output()
                .await;
            let _ = Command::new("git")
                .arg("add")
                .arg(".")
                .current_dir(&git_workspace)
                .output()
                .await;
            let _ = Command::new("git")
                .arg("commit")
                .arg("-m")
                .arg("Initial commit by Omni Studio")
                .current_dir(&git_workspace)
                .output()
                .await;

            // Optionally try to push
            let _ = Command::new("git")
                .arg("push")
                .arg("-u")
                .arg("origin")
                .arg("main")
                .current_dir(&git_workspace)
                .output()
                .await;
        }
    }

    Ok(format!(
        "Successfully initialized repository in {}",
        git_workspace.display()
    ))
}
