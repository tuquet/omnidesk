-- Workflow runs: tracks each execution of a workflow
CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    profile_id TEXT,
    schedule_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    -- Status values: PENDING, RUNNING, SUCCESS, FAILED, CANCELLED
    started_at DATETIME,
    finished_at DATETIME,
    error_message TEXT,
    -- Summary JSON: { blocks_completed, blocks_failed, total_duration_ms }
    summary TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY(profile_id) REFERENCES browser_profiles(id) ON DELETE SET NULL
);

-- Index for querying runs by workflow
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
-- Index for querying runs by status
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
-- Index for querying runs by schedule
CREATE INDEX IF NOT EXISTS idx_workflow_runs_schedule ON workflow_runs(schedule_id);
