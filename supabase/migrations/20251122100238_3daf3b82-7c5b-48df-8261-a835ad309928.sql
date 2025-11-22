-- Create wallets table for user balances
-- Wallets hold UIP_CREDIT and other currencies
CREATE TABLE public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  
  -- Balance tracking
  balance decimal DEFAULT 0 NOT NULL,
  currency text DEFAULT 'UIP_CREDIT' NOT NULL,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One wallet per currency per user
  UNIQUE(user_id, currency)
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallets
CREATE POLICY "users_view_own_wallets" ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own wallets
CREATE POLICY "users_create_own_wallets" ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallets (for balance adjustments)
CREATE POLICY "users_update_own_wallets" ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Create ledger table for transaction records
-- The Flow: tracks value transfer between wallets
CREATE TABLE public.ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The Flow
  from_wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT,
  to_wallet_id uuid REFERENCES public.wallets(id) ON DELETE RESTRICT,
  
  -- The Catalyst (what triggered this transaction)
  contract_id uuid REFERENCES public.smart_contracts(id) ON DELETE SET NULL,
  
  -- The Value
  amount decimal NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'UIP_CREDIT' NOT NULL,
  
  -- The State
  status text DEFAULT 'settled', -- 'pending', 'settled', 'failed', 'reversed'
  
  -- Metadata
  timestamp timestamptz DEFAULT now(),
  notes text,
  
  -- Prevent self-transactions
  CHECK (from_wallet_id != to_wallet_id)
);

-- Enable RLS on ledger
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- Users can view transactions involving their wallets
CREATE POLICY "users_view_own_transactions" ON public.ledger
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE (wallets.id = ledger.from_wallet_id OR wallets.id = ledger.to_wallet_id)
    AND wallets.user_id = auth.uid()
  )
);

-- Only system/backend can create ledger entries (via edge functions)
-- Users should not directly create transactions
CREATE POLICY "system_creates_transactions" ON public.ledger
FOR INSERT
WITH CHECK (false); -- Will be created via service role in edge functions

-- Update timestamp trigger for wallets
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ledger_from_wallet ON public.ledger(from_wallet_id);
CREATE INDEX idx_ledger_to_wallet ON public.ledger(to_wallet_id);
CREATE INDEX idx_ledger_contract ON public.ledger(contract_id);
CREATE INDEX idx_ledger_timestamp ON public.ledger(timestamp DESC);
CREATE INDEX idx_wallets_user_currency ON public.wallets(user_id, currency);