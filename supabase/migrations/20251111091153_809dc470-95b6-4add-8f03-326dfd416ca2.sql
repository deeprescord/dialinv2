-- Ensure idempotency: drop existing policy if present, then recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public can read objects for public spaces'
  ) THEN
    DROP POLICY "Public can read objects for public spaces" ON storage.objects;
  END IF;
END $$;

CREATE POLICY "Public can read objects for public spaces"
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
        AND f.storage_path = name
    )
  );