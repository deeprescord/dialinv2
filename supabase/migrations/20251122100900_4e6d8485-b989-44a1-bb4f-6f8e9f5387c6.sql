-- 1. THE IDENTITY HULL - Add UIP Metaphysics to existing profiles table
-- Add username if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- Add UIP metrics to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS amplitude_score float DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS average_entropy_output float DEFAULT 0.5;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.amplitude_score IS 'The Amplitude (A) - User gravity in the system. Higher = more visibility in feeds/search.';
COMMENT ON COLUMN public.profiles.average_entropy_output IS 'The Spectral Balance - Does user create Order (p→0) or Chaos (p→1)? 0.5 = Harmonizer.';

-- 2. THE HOLOGRAPHIC LOG - Tracking the Pointer Tree
CREATE TABLE IF NOT EXISTS public.influence_stats (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- QUANTITY: How many pointers exist for your items?
  total_branches_active int DEFAULT 0 CHECK (total_branches_active >= 0),
  
  -- REACH: How many unique users hold your items?
  unique_holders_count int DEFAULT 0 CHECK (unique_holders_count >= 0),
  
  -- VALUE: The economic energy flowing back to the root
  total_lifetime_harvest decimal DEFAULT 0.00 CHECK (total_lifetime_harvest >= 0),
  pending_harvest decimal DEFAULT 0.00 CHECK (pending_harvest >= 0),
  
  last_updated timestamptz DEFAULT now()
);

-- Enable RLS on influence_stats
ALTER TABLE public.influence_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own influence stats
CREATE POLICY "users_view_own_influence" ON public.influence_stats
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public influence stats for others (for leaderboards)
CREATE POLICY "anyone_can_view_influence" ON public.influence_stats
FOR SELECT
USING (true);

-- Only system can create/update influence stats (via triggers or edge functions)
CREATE POLICY "system_manages_influence" ON public.influence_stats
FOR ALL
USING (false)
WITH CHECK (false);

-- Create function to initialize influence stats when profile is created
CREATE OR REPLACE FUNCTION public.init_influence_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.influence_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to auto-create influence stats
DROP TRIGGER IF EXISTS init_influence_stats_trigger ON public.profiles;
CREATE TRIGGER init_influence_stats_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.init_influence_stats();

-- Create function to update influence stats
CREATE OR REPLACE FUNCTION public.update_influence_stats(
  _user_id uuid,
  _total_branches int DEFAULT NULL,
  _unique_holders int DEFAULT NULL,
  _lifetime_harvest decimal DEFAULT NULL,
  _pending_harvest decimal DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.influence_stats
  SET
    total_branches_active = COALESCE(_total_branches, total_branches_active),
    unique_holders_count = COALESCE(_unique_holders, unique_holders_count),
    total_lifetime_harvest = COALESCE(_lifetime_harvest, total_lifetime_harvest),
    pending_harvest = COALESCE(_pending_harvest, pending_harvest),
    last_updated = now()
  WHERE user_id = _user_id;
END;
$$;

-- Initialize influence stats for existing users
INSERT INTO public.influence_stats (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_influence_stats_amplitude ON public.profiles(amplitude_score DESC);
CREATE INDEX IF NOT EXISTS idx_influence_stats_branches ON public.influence_stats(total_branches_active DESC);
CREATE INDEX IF NOT EXISTS idx_influence_stats_reach ON public.influence_stats(unique_holders_count DESC);
CREATE INDEX IF NOT EXISTS idx_influence_stats_harvest ON public.influence_stats(total_lifetime_harvest DESC);