-- Create messages table for space-based communication
-- Messages are Entanglement: temporary shared spaces where items can be exchanged
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  
  -- The Content
  content_text text, -- The low-entropy verbal communication
  
  -- The Attachment (The Shared Reality)
  -- If a user drops a file, we create an item_pointer and link it here.
  linked_item_pointer_id uuid REFERENCES public.item_pointers(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: Members can read/write messages in their spaces
CREATE POLICY "stream_access" ON public.messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.space_members 
    WHERE space_id = messages.space_id 
    AND user_id = auth.uid()
  )
);

-- Enable real-time updates for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;