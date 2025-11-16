-- ==========================================
-- Phase 2: Separate FOS and DOS Database Layers
-- ==========================================

-- 1. Create space_metadata table for DOS layer
CREATE TABLE IF NOT EXISTS public.space_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  dial_values JSONB DEFAULT '{}'::JSONB,
  detected_objects JSONB DEFAULT '[]'::JSONB,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(space_id)
);

-- Enable RLS on space_metadata
ALTER TABLE public.space_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for space_metadata (DOS layer - semantic information)
CREATE POLICY "Users can view metadata for their spaces"
ON public.space_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = space_metadata.space_id
    AND spaces.user_id = auth.uid()
  )
);

CREATE POLICY "Metadata for public spaces is viewable by everyone"
ON public.space_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = space_metadata.space_id
    AND spaces.is_public = TRUE
  )
);

CREATE POLICY "Users can create metadata for their spaces"
ON public.space_metadata
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = space_metadata.space_id
    AND spaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update metadata for their spaces"
ON public.space_metadata
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = space_metadata.space_id
    AND spaces.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete metadata for their spaces"
ON public.space_metadata
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = space_metadata.space_id
    AND spaces.user_id = auth.uid()
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_space_metadata_updated_at
BEFORE UPDATE ON public.space_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Migrate existing metadata from spaces to space_metadata
INSERT INTO public.space_metadata (space_id, hashtags, dial_values, ai_generated, ai_confidence)
SELECT id, hashtags, dial_values, ai_generated, ai_confidence
FROM public.spaces
WHERE hashtags IS NOT NULL OR dial_values IS NOT NULL OR ai_generated IS NOT NULL OR ai_confidence IS NOT NULL
ON CONFLICT (space_id) DO NOTHING;

-- 3. Add public/private flags to files table (for FOS layer)
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE;

-- 4. Create item_connections table for semantic relationships (DOS layer)
CREATE TABLE IF NOT EXISTS public.item_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_item_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  to_item_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  coupling_strength NUMERIC DEFAULT 0.0,
  semantic_similarity NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE(from_item_id, to_item_id)
);

-- Enable RLS on item_connections
ALTER TABLE public.item_connections ENABLE ROW LEVEL SECURITY;

-- Policies for item_connections
CREATE POLICY "Users can view connections for their items"
ON public.item_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE (files.id = item_connections.from_item_id OR files.id = item_connections.to_item_id)
    AND files.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create connections for their items"
ON public.item_connections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.files
    WHERE files.id = item_connections.from_item_id
    AND files.owner_id = auth.uid()
  )
  AND auth.uid() = created_by
);

-- Add trigger for item_connections updated_at
CREATE TRIGGER update_item_connections_updated_at
BEFORE UPDATE ON public.item_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create function to calculate semantic similarity between items
CREATE OR REPLACE FUNCTION public.calculate_item_similarity(_from_item_id UUID, _to_item_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  shared_dials INTEGER;
  total_dials INTEGER;
  similarity NUMERIC;
BEGIN
  -- Get metadata for both items
  WITH from_meta AS (
    SELECT dial_values FROM item_metadata WHERE file_id = _from_item_id
  ),
  to_meta AS (
    SELECT dial_values FROM item_metadata WHERE file_id = _to_item_id
  )
  SELECT 
    COUNT(*) FILTER (WHERE fm.key = tm.key) as shared,
    GREATEST(
      (SELECT COUNT(*) FROM jsonb_object_keys((SELECT dial_values FROM from_meta))),
      (SELECT COUNT(*) FROM jsonb_object_keys((SELECT dial_values FROM to_meta)))
    ) as total
  INTO shared_dials, total_dials
  FROM from_meta fm
  CROSS JOIN LATERAL jsonb_each(fm.dial_values) AS fme(key, value)
  FULL OUTER JOIN to_meta tm ON TRUE
  CROSS JOIN LATERAL jsonb_each(tm.dial_values) AS tme(key, value);
  
  IF total_dials > 0 THEN
    similarity := shared_dials::NUMERIC / total_dials::NUMERIC;
  ELSE
    similarity := 0.0;
  END IF;
  
  RETURN similarity;
END;
$$;

-- 6. Create materialized view for public semantic layer (THE PUBLIC)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.public_semantic_layer AS
SELECT 
  im.file_id,
  im.hashtags,
  im.dial_values,
  im.detected_objects,
  im.detected_people,
  f.file_type,
  f.created_at,
  sm.hashtags as space_hashtags,
  sm.dial_values as space_dial_values
FROM public.item_metadata im
JOIN public.files f ON f.id = im.file_id
LEFT JOIN public.space_files sf ON sf.file_id = f.id
LEFT JOIN public.spaces s ON s.id = sf.space_id
LEFT JOIN public.space_metadata sm ON sm.space_id = s.id
WHERE f.is_public = TRUE OR s.is_public = TRUE;

-- Create index on the materialized view for faster semantic queries
CREATE INDEX IF NOT EXISTS idx_public_semantic_file_type ON public.public_semantic_layer(file_type);
CREATE INDEX IF NOT EXISTS idx_public_semantic_hashtags ON public.public_semantic_layer USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_public_semantic_dial_values ON public.public_semantic_layer USING GIN(dial_values);

-- Function to refresh the public semantic layer
CREATE OR REPLACE FUNCTION public.refresh_public_semantic_layer()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.public_semantic_layer;
END;
$$;