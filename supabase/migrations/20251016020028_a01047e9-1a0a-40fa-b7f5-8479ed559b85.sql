-- Grant required privileges to the authenticated role for app tables
DO $$
BEGIN
  -- Ensure authenticated users can use the public schema
  GRANT USAGE ON SCHEMA public TO authenticated;

  -- Files table: needed for upload flow
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.files TO authenticated;
  ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

  -- Space files linking table: add/remove + read
  GRANT SELECT, INSERT, DELETE ON TABLE public.space_files TO authenticated;
  ALTER TABLE public.space_files ENABLE ROW LEVEL SECURITY;

  -- Item metadata table: save/read AI tags and dials
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.item_metadata TO authenticated;
  ALTER TABLE public.item_metadata ENABLE ROW LEVEL SECURITY;
END
$$;