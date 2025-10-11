-- Fix RLS infinite recursion by creating SECURITY DEFINER functions

-- Function to check if user owns a file
CREATE OR REPLACE FUNCTION user_owns_file(_user_id UUID, _file_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM files
    WHERE id = _file_id AND owner_id = _user_id
  );
$$ LANGUAGE SQL STABLE;

-- Function to check if file is shared with user
CREATE OR REPLACE FUNCTION file_shared_with_user(_user_id UUID, _file_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM file_shares
    WHERE file_id = _file_id AND shared_with = _user_id
  );
$$ LANGUAGE SQL STABLE;

-- Update files policy to use the function
DROP POLICY IF EXISTS "Users can view files they own or have access to" ON files;
CREATE POLICY "Users can view files they own or have access to" ON files
FOR SELECT USING (
  user_owns_file(auth.uid(), id) OR 
  file_shared_with_user(auth.uid(), id)
);

-- Update file_shares policy
DROP POLICY IF EXISTS "Users can view shares for their files or files shared with them" ON file_shares;
CREATE POLICY "Users can view shares for their files or files shared with them" ON file_shares
FOR SELECT USING (
  auth.uid() = shared_with OR
  user_owns_file(auth.uid(), file_id)
);

-- Also fix file_comments policies to avoid potential recursion
DROP POLICY IF EXISTS "Users can view comments on files they have access to" ON file_comments;
CREATE POLICY "Users can view comments on files they have access to" ON file_comments
FOR SELECT USING (
  user_owns_file(auth.uid(), file_id) OR
  file_shared_with_user(auth.uid(), file_id)
);

DROP POLICY IF EXISTS "Users can create comments on files they have access to" ON file_comments;
CREATE POLICY "Users can create comments on files they have access to" ON file_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    user_owns_file(auth.uid(), file_id) OR
    file_shared_with_user(auth.uid(), file_id)
  )
);

-- Fix space_files policies
DROP POLICY IF EXISTS "Users can view space files for their spaces or shared files" ON space_files;
CREATE POLICY "Users can view space files for their spaces or shared files" ON space_files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM spaces
    WHERE spaces.id = space_files.space_id AND spaces.user_id = auth.uid()
  ) OR
  file_shared_with_user(auth.uid(), file_id)
);