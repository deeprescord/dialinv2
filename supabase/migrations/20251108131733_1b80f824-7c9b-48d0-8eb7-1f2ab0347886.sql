-- Recreate storage policies to allow public read access where appropriate
DROP POLICY IF EXISTS "Public can read user-files in public spaces" ON storage.objects;
DROP POLICY IF EXISTS "Public can read space-covers" ON storage.objects;

-- Allow public (anon) to generate signed URLs for files used in public spaces
CREATE POLICY "Public can read user-files in public spaces"
ON storage.objects
FOR SELECT
TO public
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

-- Public read for space-covers bucket
CREATE POLICY "Public can read space-covers"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'space-covers'
);
