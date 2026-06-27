-- Workflows table: stores Automa workflow definitions
-- Mirrors the JSON structure from Automa Extension's workflow store
CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    icon TEXT DEFAULT 'riGlobalLine',
    folder_id TEXT,
    description TEXT DEFAULT '',
    -- The full drawflow JSON (nodes + edges + zoom)
    drawflow TEXT NOT NULL DEFAULT '{"edges":[],"zoom":1.3,"nodes":[]}',
    -- Workflow settings JSON (blockDelay, saveLog, debugMode, etc.)
    settings TEXT NOT NULL DEFAULT '{}',
    -- Trigger configuration JSON
    trigger TEXT,
    -- Global data JSON string
    global_data TEXT DEFAULT '{}',
    -- Table/columns data
    table_data TEXT DEFAULT '[]',
    data_columns TEXT DEFAULT '[]',
    -- Automa version that created this workflow
    version TEXT DEFAULT '1.30.00',
    is_disabled INTEGER DEFAULT 0,
    -- Source: 'extension' (synced from browser), 'local' (created in app), 'import' (from file)
    source TEXT DEFAULT 'local',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for folder filtering
CREATE INDEX IF NOT EXISTS idx_workflows_folder ON workflows(folder_id);
-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_workflows_source ON workflows(source);
