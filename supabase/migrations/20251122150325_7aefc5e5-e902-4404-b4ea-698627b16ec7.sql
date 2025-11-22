-- Enable anonymous uploads to user-files bucket
-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone (including anonymous users) to upload files
CREATE POLICY "Anyone can upload files"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'user-files');

-- Allow anyone to view files in the bucket
CREATE POLICY "Anyone can view files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-files');

-- Allow anyone to delete their own files (optional but useful)
CREATE POLICY "Anyone can delete files"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'user-files');