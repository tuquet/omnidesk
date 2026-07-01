pub const RUNTIME_PORT: u16 = 1423;
pub const PROFILE_PORT: u16 = 1421;
pub const WORKFLOW_PORT: u16 = 1422;

pub fn get_workflow_api_url() -> String {
    format!("http://localhost:{}", std::env::var("WORKFLOW_PORT").unwrap_or_else(|_| WORKFLOW_PORT.to_string()))
}

pub fn get_profile_api_url() -> String {
    format!("http://localhost:{}", std::env::var("PROFILE_PORT").unwrap_or_else(|_| PROFILE_PORT.to_string()))
}

pub fn get_runtime_api_url() -> String {
    format!("http://localhost:{}", std::env::var("RUNTIME_PORT").unwrap_or_else(|_| RUNTIME_PORT.to_string()))
}

// IPC Events
pub const E2E_LOG_EVENT: &str = "e2e-log";
pub const DEEP_LINK_RECEIVED_EVENT: &str = "deep-link-received";

// IPC Commands
pub const CMD_ENSURE_AUTOMA_EXTENSION: &str = "ensure_automa_extension";

// WS Events
pub const WS_PING: &str = "ping";
pub const WS_EXTENSION_READY: &str = "extension_ready";
pub const WS_EXECUTE_WORKFLOW: &str = "execute_workflow";
pub const WS_BLOCK_STARTED: &str = "block_started";
pub const WS_BLOCK_FINISHED: &str = "block_finished";
pub const WS_WORKFLOW_FINISHED: &str = "workflow_finished";
