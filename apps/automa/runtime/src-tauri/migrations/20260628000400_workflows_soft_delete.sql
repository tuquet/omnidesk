-- Soft delete support for workflows
-- Instead of hard DELETE, set deleted_at timestamp
-- This allows safe recovery when files are accidentally removed from OneDrive

ALTER TABLE workflows ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE workflows ADD COLUMN delete_source TEXT DEFAULT NULL;
-- delete_source: 'extension' | 'file_watcher' | 'api' | NULL
