-- Enable read access to thumbnails and files in public spaces via storage policies

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public spaces files are viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public space thumbnails are viewable" ON storage.objects;

-- Allow anyone to view files that belong to public spaces
CREATE POLICY "Public spaces files are viewable"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' 
  AND EXISTS (
    SELECT 1 FROM public.space_files sf
    JOIN public.spaces s ON sf.space_id = s.id
    JOIN public.files f ON sf.file_id = f.id
    WHERE s.is_public = true
    AND (
      f.storage_path = storage.objects.name 
      OR f.storage_path = 'user-files/' || storage.objects.name
      OR f.thumbnail_path = storage.objects.name
      OR f.thumbnail_path = 'user-files/' || storage.objects.name
    )
  )
);

-- Allow anyone to view thumbnails from public space covers
CREATE POLICY "Public space cover images are viewable"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'space-covers'
);