-- Add horizontal and vertical flip toggles to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS horizontal_flip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vertical_flip BOOLEAN DEFAULT false;