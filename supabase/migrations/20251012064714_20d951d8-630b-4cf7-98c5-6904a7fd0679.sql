-- Create a public bucket for space cover images/videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-covers', 'space-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read for space-covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'space-covers');

-- Authenticated users can upload to their own folder (/<user_id>/...)
CREATE POLICY "Users can upload to space-covers in own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'space-covers'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can update their own files
CREATE POLICY "Users can update their files in space-covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'space-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Authenticated users can delete their own files
CREATE POLICY "Users can delete their files in space-covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'space-covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
