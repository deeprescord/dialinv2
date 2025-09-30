-- Create table to track which profile fields are shared with specific contacts
CREATE TABLE IF NOT EXISTS public.contact_field_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, contact_user_id, field_name)
);

-- Enable RLS
ALTER TABLE public.contact_field_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their own sharing settings
CREATE POLICY "Users can view their own field shares"
ON public.contact_field_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own field shares
CREATE POLICY "Users can create their own field shares"
ON public.contact_field_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own field shares
CREATE POLICY "Users can delete their own field shares"
ON public.contact_field_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_contact_field_shares_user_contact ON public.contact_field_shares(user_id, contact_user_id);