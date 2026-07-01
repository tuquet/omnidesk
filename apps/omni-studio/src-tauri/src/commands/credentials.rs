use keyring::Entry;
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum KeyringError {
    #[error("Failed to access keyring: {0}")]
    AccessFailed(String),
    #[error("Credential not found")]
    NotFound,
}

impl Serialize for KeyringError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// OS Keyring namespace
const SERVICE_NAME: &str = "com.omnidesk.devtool.credentials";

#[tauri::command]
pub async fn set_credential(key: String, secret: String) -> Result<(), KeyringError> {
    let entry =
        Entry::new(SERVICE_NAME, &key).map_err(|e| KeyringError::AccessFailed(e.to_string()))?;

    entry
        .set_password(&secret)
        .map_err(|e| KeyringError::AccessFailed(e.to_string()))?;

    Ok(())
}

#[tauri::command]
pub async fn get_credential(key: String) -> Result<String, KeyringError> {
    let entry =
        Entry::new(SERVICE_NAME, &key).map_err(|e| KeyringError::AccessFailed(e.to_string()))?;

    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => Err(KeyringError::NotFound),
        Err(e) => Err(KeyringError::AccessFailed(e.to_string())),
    }
}

#[tauri::command]
pub async fn delete_credential(key: String) -> Result<(), KeyringError> {
    let entry =
        Entry::new(SERVICE_NAME, &key).map_err(|e| KeyringError::AccessFailed(e.to_string()))?;

    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(KeyringError::AccessFailed(e.to_string())),
    }
}
