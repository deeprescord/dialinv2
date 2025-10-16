DO $$
BEGIN
  -- Ensure schema access for authenticated role
  GRANT USAGE ON SCHEMA public TO authenticated;

  -- FILES: privileges and RLS policies
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.files TO authenticated;
  ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

  -- Recreate files policies to ensure correct behavior
  DROP POLICY IF EXISTS "Users can create their own files" ON public.files;
  CREATE POLICY "Users can create their own files"
  ON public.files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
  CREATE POLICY "Users can update their own files"
  ON public.files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
  CREATE POLICY "Users can delete their own files"
  ON public.files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can view files they own or have access to" ON public.files;
  CREATE POLICY "Users can view files they own or have access to"
  ON public.files
  FOR SELECT
  TO authenticated
  USING (user_owns_file(auth.uid(), id) OR file_shared_with_user(auth.uid(), id));

  -- SPACE_FILES: privileges and RLS policies
  GRANT SELECT, INSERT, DELETE ON TABLE public.space_files TO authenticated;
  ALTER TABLE public.space_files ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can add files to their own spaces" ON public.space_files;
  CREATE POLICY "Users can add files to their own spaces"
  ON public.space_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_files.space_id AND spaces.user_id = auth.uid()
    )
    AND auth.uid() = added_by
  );

  DROP POLICY IF EXISTS "Users can remove files from their own spaces" ON public.space_files;
  CREATE POLICY "Users can remove files from their own spaces"
  ON public.space_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_files.space_id AND spaces.user_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Users can view space files for their spaces or shared files" ON public.space_files;
  CREATE POLICY "Users can view space files for their spaces or shared files"
  ON public.space_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM spaces
      WHERE spaces.id = space_files.space_id AND spaces.user_id = auth.uid()
    )
    OR file_shared_with_user(auth.uid(), file_id)
  );
END
$$;