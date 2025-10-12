-- Add rotation axis column to spaces table
ALTER TABLE public.spaces
ADD COLUMN rotation_axis text DEFAULT 'x' CHECK (rotation_axis IN ('x', 'y'));