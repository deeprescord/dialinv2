-- Add flip horizontal and vertical columns to spaces table
ALTER TABLE public.spaces 
ADD COLUMN flip_horizontal BOOLEAN DEFAULT false,
ADD COLUMN flip_vertical BOOLEAN DEFAULT false;