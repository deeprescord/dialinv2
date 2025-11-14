-- Create user roles table for Artist/Viewer/Creator tiers
CREATE TYPE public.interaction_role AS ENUM ('artist', 'viewer', 'creator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role interaction_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS interaction_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id),
    'viewer'::interaction_role
  );
$$;

-- Add p-value and interaction tracking to spaces
ALTER TABLE public.spaces
  ADD COLUMN p_value NUMERIC DEFAULT 0.5,
  ADD COLUMN interaction_potential NUMERIC DEFAULT 0.25,
  ADD COLUMN reference_chain JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN creator_id UUID REFERENCES auth.users(id),
  ADD COLUMN coupling_strength NUMERIC DEFAULT 0.0;

-- Add p-value and interaction tracking to files
ALTER TABLE public.files
  ADD COLUMN p_value NUMERIC DEFAULT 0.5,
  ADD COLUMN interaction_potential NUMERIC DEFAULT 0.25,
  ADD COLUMN reference_chain JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN coupling_strength NUMERIC DEFAULT 0.0;

-- Function to calculate interaction potential: p(1-p)
CREATE OR REPLACE FUNCTION public.calculate_interaction_potential(p_val NUMERIC)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_val * (1 - p_val);
$$;

-- Function to update interaction potential when p-value changes
CREATE OR REPLACE FUNCTION public.update_interaction_potential()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.interaction_potential := calculate_interaction_potential(NEW.p_value);
  RETURN NEW;
END;
$$;

-- Triggers to auto-calculate interaction potential
CREATE TRIGGER spaces_interaction_potential
  BEFORE INSERT OR UPDATE OF p_value ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_interaction_potential();

CREATE TRIGGER files_interaction_potential
  BEFORE INSERT OR UPDATE OF p_value ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_interaction_potential();

-- Function to append to reference chain
CREATE OR REPLACE FUNCTION public.append_reference(
  current_chain JSONB,
  new_ref JSONB
)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT current_chain || jsonb_build_array(new_ref);
$$;

-- Add interaction graph tracking to space_connections
ALTER TABLE public.space_connections
  ADD COLUMN coupling_strength NUMERIC DEFAULT 0.0,
  ADD COLUMN interaction_data JSONB DEFAULT '{}'::jsonb;

-- Function to calculate coupling strength between spaces based on shared content
CREATE OR REPLACE FUNCTION public.calculate_coupling_strength(
  _from_space_id UUID,
  _to_space_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  shared_count INTEGER;
  total_count INTEGER;
  coupling NUMERIC;
BEGIN
  -- Count shared files between spaces
  SELECT COUNT(DISTINCT sf1.file_id)
  INTO shared_count
  FROM space_files sf1
  INNER JOIN space_files sf2 ON sf1.file_id = sf2.file_id
  WHERE sf1.space_id = _from_space_id
    AND sf2.space_id = _to_space_id;
  
  -- Count total files in from_space
  SELECT COUNT(*)
  INTO total_count
  FROM space_files
  WHERE space_id = _from_space_id;
  
  -- Calculate coupling as ratio
  IF total_count > 0 THEN
    coupling := shared_count::NUMERIC / total_count::NUMERIC;
  ELSE
    coupling := 0.0;
  END IF;
  
  RETURN coupling;
END;
$$;

-- Add realtime publication for interaction tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.space_connections;