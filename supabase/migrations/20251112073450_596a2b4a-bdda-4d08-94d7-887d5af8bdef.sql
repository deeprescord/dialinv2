-- Add storage policy to allow public access to files in public spaces
CREATE POLICY "Allow public access to files in public spaces"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND EXISTS (
    SELECT 1 
    FROM space_files sf
    JOIN spaces s ON s.id = sf.space_id
    WHERE sf.file_id::text = (storage.foldername(name))[1]
    AND s.is_public = true
  )
);