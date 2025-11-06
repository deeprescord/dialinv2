-- Fix function search path security warning
DROP FUNCTION IF EXISTS generate_share_slug(text);

CREATE OR REPLACE FUNCTION generate_share_slug(space_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Create base slug from space name
  base_slug := lower(regexp_replace(space_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use random string
  IF base_slug = '' THEN
    base_slug := substr(md5(random()::text), 1, 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Keep trying until we find a unique slug
  WHILE EXISTS (SELECT 1 FROM spaces WHERE share_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;