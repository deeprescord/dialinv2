-- Add public sharing capabilities to spaces
ALTER TABLE spaces 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN share_slug text UNIQUE;

-- Create index for share slug lookups
CREATE INDEX idx_spaces_share_slug ON spaces(share_slug) WHERE share_slug IS NOT NULL;

-- Update RLS policies to allow public read access to public spaces
CREATE POLICY "Public spaces are viewable by everyone"
ON spaces
FOR SELECT
USING (is_public = true);

-- Allow public read access to files in public spaces
CREATE POLICY "Files in public spaces are viewable by everyone"
ON space_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = space_files.space_id
    AND spaces.is_public = true
  )
);

CREATE POLICY "Public space files are viewable by everyone"
ON files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM space_files
    JOIN spaces ON spaces.id = space_files.space_id
    WHERE space_files.file_id = files.id
    AND spaces.is_public = true
  )
);

-- Allow public read access to metadata for files in public spaces
CREATE POLICY "Metadata for public space files is viewable by everyone"
ON item_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM space_files
    JOIN spaces ON spaces.id = space_files.space_id
    WHERE space_files.file_id = item_metadata.file_id
    AND spaces.is_public = true
  )
);

-- Function to generate unique share slug
CREATE OR REPLACE FUNCTION generate_share_slug(space_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug from space name
  base_slug := lower(regexp_replace(space_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use random string
  IF base_slug = '' THEN
    base_slug := substr(md5(random()::text), 1, 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Keep trying until we find a unique slug
  WHILE EXISTS (SELECT 1 FROM spaces WHERE share_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;