-- Add is_archived column to teams (soft delete / archive)
ALTER TABLE teams ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
