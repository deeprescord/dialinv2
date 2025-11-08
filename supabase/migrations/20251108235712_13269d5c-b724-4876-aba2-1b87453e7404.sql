-- Create storage policy for public access to files in public spaces
-- This allows anyone to read/sign URLs for user-files objects that are part of public spaces

CREATE POLICY "Public can access media in public spaces"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND EXISTS (
    SELECT 1
    FROM public.files f
    JOIN public.space_files sf ON sf.file_id = f.id
    JOIN public.spaces s ON s.id = sf.space_id
    WHERE s.is_public = true
      AND (f.storage_path = storage.objects.name OR f.thumbnail_path = storage.objects.name)
  )
);