-- Allow public read access to files that are in public spaces
CREATE POLICY "Public can view files in public spaces"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND (
    -- Allow if file is in a public space
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.space_files sf ON sf.file_id = f.id
      JOIN public.spaces s ON s.id = sf.space_id
      WHERE f.storage_path = storage.objects.name
        AND s.is_public = true
    )
  )
);