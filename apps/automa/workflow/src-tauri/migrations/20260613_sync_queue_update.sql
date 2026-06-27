ALTER TABLE sync_queue ADD COLUMN user_id TEXT NOT NULL DEFAULT '';

-- Remove jwt column
-- SQLite doesn't support DROP COLUMN fully until version 3.35.0, but we can just ignore the jwt column in our Rust queries or drop it.
-- Let's just create a new table and copy data if needed. Since it's dev, we can just drop it.
DROP TABLE sync_queue;

CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
