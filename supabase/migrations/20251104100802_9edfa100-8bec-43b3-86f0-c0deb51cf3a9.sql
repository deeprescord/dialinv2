-- Add UPDATE policy for space_files to allow position updates
CREATE POLICY "Users can update files in their own spaces"
ON space_files
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = space_files.space_id
    AND spaces.user_id = auth.uid()
  )
);