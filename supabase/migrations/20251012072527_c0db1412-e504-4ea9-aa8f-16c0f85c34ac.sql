-- Add rotation settings to spaces table
ALTER TABLE public.spaces
ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rotation_speed NUMERIC DEFAULT 1;