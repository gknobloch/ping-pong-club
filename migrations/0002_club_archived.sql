-- Add is_archived column to clubs (soft delete / archive)
ALTER TABLE clubs ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
