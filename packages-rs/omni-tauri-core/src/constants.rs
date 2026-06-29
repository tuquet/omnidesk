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
