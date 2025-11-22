-- Add hidden field to space_files table to support hiding items in spaces
ALTER TABLE space_files ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- Create index for better performance when filtering hidden items
CREATE INDEX idx_space_files_hidden ON space_files(space_id, hidden);