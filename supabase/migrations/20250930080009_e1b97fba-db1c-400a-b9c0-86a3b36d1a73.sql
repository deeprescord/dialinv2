-- Fix storage policies to resolve infinite recursion
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can upload files to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files they own or have access to" ON storage.objects;

-- Create corrected policies for profile-media bucket
CREATE POLICY "Users can upload their own profile media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create corrected policies for user-files bucket  
CREATE POLICY "Users can upload files to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create simpler view policy for user-files that doesn't reference the files table
CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);