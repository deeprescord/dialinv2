-- Add view_count to files table for performance tracking
ALTER TABLE files ADD COLUMN view_count INTEGER DEFAULT 0;