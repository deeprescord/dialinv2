-- Create item_metadata table for storing AI-generated and user-adjusted metadata
CREATE TABLE public.item_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  dial_values JSONB DEFAULT '{}'::JSONB,
  ai_generated BOOLEAN DEFAULT true,
  ai_confidence NUMERIC DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id)
);

-- Enable Row Level Security
ALTER TABLE public.item_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_metadata
CREATE POLICY "Users can view their own item metadata"
  ON public.item_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own item metadata"
  ON public.item_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item metadata"
  ON public.item_metadata
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item metadata"
  ON public.item_metadata
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_item_metadata_updated_at
  BEFORE UPDATE ON public.item_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_item_metadata_file_id ON public.item_metadata(file_id);
CREATE INDEX idx_item_metadata_user_id ON public.item_metadata(user_id);

-- Create GIN index for hashtag array searches
CREATE INDEX idx_item_metadata_hashtags ON public.item_metadata USING GIN(hashtags);

-- Create GIN index for dial_values JSONB searches
CREATE INDEX idx_item_metadata_dial_values ON public.item_metadata USING GIN(dial_values);