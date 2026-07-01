-- Schedules: defines automated runs (Profile x Workflow on a cron)
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    workflow_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    -- Standard 5-field cron expression (e.g. "0 8 * * *" = every day at 8:00)
    cron_expr TEXT NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    last_run_at DATETIME,
    next_run_at DATETIME,
    -- How many times this schedule has triggered
    run_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY(profile_id) REFERENCES browser_profiles(id) ON DELETE CASCADE
);

-- Index for finding active schedules
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(is_enabled);
