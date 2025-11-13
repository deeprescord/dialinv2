-- Add show_play_all_button column to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS show_play_all_button boolean DEFAULT false;