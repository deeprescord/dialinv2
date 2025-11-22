-- Create space_members table for collaborative spaces
-- Implements UIP Phase Coupling metric
CREATE TABLE public.space_members (
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  
  -- UIP Metric: Phase Coupling
  -- How "in sync" is this user with this space?
  -- 1.0 = Perfectly coherent (phi = phi_0) 
  phase_coupling_score float DEFAULT 0.5,
  
  role text DEFAULT 'observer', -- 'owner', 'editor', 'observer'
  last_seen_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (space_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;

-- RLS: You can see members if you are a member
CREATE POLICY "view_members" ON public.space_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.space_members sm 
    WHERE sm.space_id = space_members.space_id 
    AND sm.user_id = auth.uid()
  )
);