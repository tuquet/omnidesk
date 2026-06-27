CREATE TABLE IF NOT EXISTS browser_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    browser_type TEXT NOT NULL,
    executable_path TEXT,
    proxy TEXT,
    user_agent TEXT,
    fingerprint_config TEXT,
    data_dir_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
