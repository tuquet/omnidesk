-- Create Groups table
CREATE TABLE IF NOT EXISTS profile_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create main Browser Profiles table
CREATE TABLE IF NOT EXISTS browser_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_id TEXT,
    os TEXT DEFAULT 'win',
    browser_type TEXT DEFAULT 'chrome',
    browser_version TEXT,
    data_dir_path TEXT NOT NULL,
    status TEXT DEFAULT 'IDLE',
    notes TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    pid INTEGER DEFAULT NULL,
    cdp_url TEXT DEFAULT NULL,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(group_id) REFERENCES profile_groups(id) ON DELETE SET NULL
);

-- Create Fingerprints table
CREATE TABLE IF NOT EXISTS profile_fingerprints (
    profile_id TEXT PRIMARY KEY,
    user_agent TEXT,
    screen_resolution TEXT,
    language TEXT,
    time_zone TEXT,
    hardware_concurrency INTEGER,
    device_memory INTEGER,
    webgl_vendor TEXT,
    webgl_renderer TEXT,
    disable_canvas_noise BOOLEAN DEFAULT FALSE,
    disable_audio_noise BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES browser_profiles(id) ON DELETE CASCADE
);

-- Create Proxies table
CREATE TABLE IF NOT EXISTS profile_proxies (
    profile_id TEXT PRIMARY KEY,
    proxy_type TEXT DEFAULT 'HTTP',
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES browser_profiles(id) ON DELETE CASCADE
);

-- Create Extensions table
CREATE TABLE IF NOT EXISTS profile_extensions (
    profile_id TEXT,
    extension_id TEXT,
    install_path TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id, extension_id),
    FOREIGN KEY(profile_id) REFERENCES browser_profiles(id) ON DELETE CASCADE
);
