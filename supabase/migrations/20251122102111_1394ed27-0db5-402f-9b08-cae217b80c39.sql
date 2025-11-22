-- Remove the foreign key constraint from influence_stats to profiles
-- This allows influence_stats to exist without requiring a profile entry
ALTER TABLE public.influence_stats DROP CONSTRAINT IF EXISTS influence_stats_user_id_fkey;

-- Make sure influence_stats can reference any authenticated user
-- Add a comment to document this
COMMENT ON TABLE public.influence_stats IS 'Tracks user influence metrics. Can exist without a profile entry - references auth.users directly via user_id.';