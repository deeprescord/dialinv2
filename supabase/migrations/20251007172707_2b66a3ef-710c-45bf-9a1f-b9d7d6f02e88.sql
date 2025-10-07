-- Add parent_id to spaces table for hierarchical organization
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE;

-- Add index for faster lookups of child spaces
CREATE INDEX IF NOT EXISTS idx_spaces_parent_id ON public.spaces(parent_id);

-- Add comment
COMMENT ON COLUMN public.spaces.parent_id IS 'Parent space ID for nested space organization';