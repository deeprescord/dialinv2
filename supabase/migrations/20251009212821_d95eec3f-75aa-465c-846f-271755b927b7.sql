-- Phase 1 Database Preparation: Add columns for Three Pillars expansion

-- Add columns to item_metadata for future object/people/location detection
ALTER TABLE item_metadata
ADD COLUMN IF NOT EXISTS detected_objects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS detected_people JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS detected_location JSONB DEFAULT NULL;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_item_metadata_file_id ON item_metadata(file_id);
CREATE INDEX IF NOT EXISTS idx_item_metadata_user_id ON item_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_item_metadata_hashtags ON item_metadata USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_spaces_parent_id ON spaces(parent_id);
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON spaces(user_id);
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_space_files_space_id ON space_files(space_id);
CREATE INDEX IF NOT EXISTS idx_space_files_file_id ON space_files(file_id);