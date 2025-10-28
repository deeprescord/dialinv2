-- Add is_home column to spaces table
ALTER TABLE public.spaces
ADD COLUMN is_home boolean NOT NULL DEFAULT false;

-- Create partial unique index to ensure only one home space per user
CREATE UNIQUE INDEX spaces_user_id_home_unique_idx 
ON public.spaces (user_id) 
WHERE is_home = true;

-- Add comment for documentation
COMMENT ON COLUMN public.spaces.is_home IS 'Marks the users permanent Home space - only one per user allowed';