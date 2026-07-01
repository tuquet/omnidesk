CREATE TABLE IF NOT EXISTS user_installed_apps (
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0.0',
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, app_id)
);
