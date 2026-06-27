-- Workflow logs: stores per-block execution logs for each run
CREATE TABLE IF NOT EXISTS workflow_logs (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    block_id TEXT NOT NULL,
    block_label TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'STARTED',
    -- Status values: STARTED, FINISHED, ERROR, SKIPPED
    duration_ms INTEGER,
    -- Output/error data as JSON
    data TEXT DEFAULT '{}',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
);

-- Index for querying logs by run
CREATE INDEX IF NOT EXISTS idx_workflow_logs_run ON workflow_logs(run_id);
