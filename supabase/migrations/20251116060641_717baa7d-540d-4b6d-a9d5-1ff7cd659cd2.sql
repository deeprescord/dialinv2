-- Add metadata fields to spaces table for DOS functionality
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS dial_values jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_confidence numeric DEFAULT 0.0;