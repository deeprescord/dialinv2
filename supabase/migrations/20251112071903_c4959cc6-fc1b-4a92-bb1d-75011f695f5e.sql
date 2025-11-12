-- Add RLS policy to allow public access to files in public spaces
CREATE POLICY "Files in public spaces are viewable by everyone" 
ON files 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM space_files 
    JOIN spaces ON spaces.id = space_files.space_id 
    WHERE space_files.file_id = files.id 
    AND spaces.is_public = true
  )
);