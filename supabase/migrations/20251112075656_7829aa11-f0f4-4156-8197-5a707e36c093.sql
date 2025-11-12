-- Drop the problematic storage policy that breaks Chrome
DROP POLICY IF EXISTS "Allow public access to files in public spaces" ON storage.objects;