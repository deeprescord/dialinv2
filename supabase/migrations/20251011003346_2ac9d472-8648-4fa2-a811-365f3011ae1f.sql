-- Add cover_url column to spaces table for background/cover images
ALTER TABLE public.spaces 
ADD COLUMN cover_url text;