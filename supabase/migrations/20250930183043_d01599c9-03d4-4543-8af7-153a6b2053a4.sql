-- Create table for profile media history
CREATE TABLE public.profile_media_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_media_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own media history
CREATE POLICY "Users can view their own media history"
ON public.profile_media_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own media history
CREATE POLICY "Users can insert their own media history"
ON public.profile_media_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media history
CREATE POLICY "Users can delete their own media history"
ON public.profile_media_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_profile_media_history_user_id ON public.profile_media_history(user_id);
CREATE INDEX idx_profile_media_history_created_at ON public.profile_media_history(created_at DESC);