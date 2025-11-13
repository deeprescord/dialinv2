-- Add show_play_all_button column to files table
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS show_play_all_button boolean DEFAULT false;