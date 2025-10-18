-- Add thumbnail_url column to spaces table for performance optimization
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS thumbnail_url text;

COMMENT ON COLUMN spaces.thumbnail_url IS 'Static thumbnail image for space preview (improves performance by avoiding video playback)';