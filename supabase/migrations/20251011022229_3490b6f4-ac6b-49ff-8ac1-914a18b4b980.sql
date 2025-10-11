-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_spaces_user_id ON public.spaces(user_id);

-- Add index on parent_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_spaces_parent_id ON public.spaces(parent_id);