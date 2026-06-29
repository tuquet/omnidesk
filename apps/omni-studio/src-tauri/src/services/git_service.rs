use std::process::Command;
use std::path::Path;
use crate::error::AppError;

pub struct GitService;

impl GitService {
    pub fn pull(repo_path: &Path) -> Result<String, AppError> {
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(["pull"])
            .output()
            .map_err(|e| AppError::Internal(format!("Failed to execute git pull: {}", e)))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::Internal(format!("Git pull failed: {}", err)));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    pub fn commit_and_push(repo_path: &Path, message: &str) -> Result<String, AppError> {
        // git add .
        let add_output = Command::new("git")
            .current_dir(repo_path)
            .args(["add", "."])
            .output()
            .map_err(|e| AppError::Internal(format!("Failed to execute git add: {}", e)))?;

        if !add_output.status.success() {
            let err = String::from_utf8_lossy(&add_output.stderr);
            return Err(AppError::Internal(format!("Git add failed: {}", err)));
        }

        // git commit -m "..."
        let commit_output = Command::new("git")
            .current_dir(repo_path)
            .args(["commit", "-m", message])
            .output()
            .map_err(|e| AppError::Internal(format!("Failed to execute git commit: {}", e)))?;

        let commit_stdout = String::from_utf8_lossy(&commit_output.stdout);
        let nothing_to_commit = commit_stdout.contains("nothing to commit") || commit_stdout.contains("working tree clean");

        if !commit_output.status.success() && !nothing_to_commit {
            let err = String::from_utf8_lossy(&commit_output.stderr);
            return Err(AppError::Internal(format!("Git commit failed: {} - {}", err, commit_stdout)));
        }

        // git push
        let push_output = Command::new("git")
            .current_dir(repo_path)
            .args(["push"])
            .output()
            .map_err(|e| AppError::Internal(format!("Failed to execute git push: {}", e)))?;

        if !push_output.status.success() {
            let err = String::from_utf8_lossy(&push_output.stderr);
            return Err(AppError::Internal(format!("Git push failed: {}", err)));
        }

        let mut final_output = String::new();
        if !nothing_to_commit {
            final_output.push_str(&commit_stdout);
        } else {
            final_output.push_str("Nothing to commit. ");
        }
        final_output.push_str(&String::from_utf8_lossy(&push_output.stdout));
        final_output.push_str(&String::from_utf8_lossy(&push_output.stderr));

        Ok(final_output)
    }
}
