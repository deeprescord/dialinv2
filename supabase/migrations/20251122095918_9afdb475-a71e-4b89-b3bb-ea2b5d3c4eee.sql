-- Create smart_contracts table for governing item pointers with economic logic
-- This is the DOS layer: enabling commerce and value exchange
CREATE TABLE public.smart_contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The Asset being governed
  target_pointer_id uuid REFERENCES public.item_pointers(id) ON DELETE CASCADE NOT NULL,
  
  -- The Economic Logic (The "Enzyme")
  contract_type text NOT NULL, -- 'subscription', 'one_time_purchase', 'royalty_split', 'bounty'
  
  -- The Terms (Auto-Ascribed by AI, editable by User)
  terms jsonb DEFAULT '{
    "price": 0,
    "currency": "USD",
    "royalty_percent": 0,
    "access_duration": "infinite",
    "reshare_allowed": true
  }'::jsonb,
  
  -- State
  status text DEFAULT 'draft', -- 'active', 'suspended'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;

-- RLS: Only the Pointer Holder can create/manage contracts
CREATE POLICY "pointer_holder_manages_contracts" ON public.smart_contracts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.item_pointers ip
    INNER JOIN public.spaces s ON s.id = ip.space_id
    WHERE ip.id = smart_contracts.target_pointer_id
    AND s.user_id = auth.uid()
  )
);

-- RLS: Anyone with access to the pointer can view the contract terms
CREATE POLICY "view_contract_terms" ON public.smart_contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.item_pointers ip
    INNER JOIN public.spaces s ON s.id = ip.space_id
    WHERE ip.id = smart_contracts.target_pointer_id
    AND (
      s.user_id = auth.uid()
      OR s.is_public = true
      OR EXISTS (
        SELECT 1 FROM public.space_members sm
        WHERE sm.space_id = s.id
        AND sm.user_id = auth.uid()
      )
    )
  )
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_smart_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_smart_contracts_updated_at
BEFORE UPDATE ON public.smart_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_smart_contracts_updated_at();