-- Create custom_dials table to store user-generated dials
CREATE TABLE IF NOT EXISTS public.custom_dials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dial_name TEXT NOT NULL,
  dial_language TEXT DEFAULT 'en',
  content_type TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  normalized_name TEXT GENERATED ALWAYS AS (LOWER(TRIM(dial_name))) STORED,
  CONSTRAINT unique_normalized_dial UNIQUE(normalized_name, content_type)
);

-- Create custom_dial_values table to link custom dials to files
CREATE TABLE IF NOT EXISTS public.custom_dial_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  custom_dial_id UUID REFERENCES public.custom_dials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dial_translations table for semantic similarity
CREATE TABLE IF NOT EXISTS public.dial_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dial_id UUID REFERENCES public.custom_dials(id) ON DELETE CASCADE NOT NULL,
  target_dial_id UUID REFERENCES public.custom_dials(id) ON DELETE CASCADE NOT NULL,
  similarity_score NUMERIC CHECK (similarity_score >= 0 AND similarity_score <= 1),
  translation_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_translation UNIQUE(source_dial_id, target_dial_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_dials_usage ON public.custom_dials(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_custom_dials_content_type ON public.custom_dials(content_type);
CREATE INDEX IF NOT EXISTS idx_custom_dial_values_file ON public.custom_dial_values(file_id);
CREATE INDEX IF NOT EXISTS idx_custom_dial_values_dial ON public.custom_dial_values(custom_dial_id);
CREATE INDEX IF NOT EXISTS idx_dial_translations_source ON public.dial_translations(source_dial_id);

-- Enable RLS
ALTER TABLE public.custom_dials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_dial_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dial_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_dials
CREATE POLICY "Users can view all custom dials"
  ON public.custom_dials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create custom dials"
  ON public.custom_dials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom dials"
  ON public.custom_dials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for custom_dial_values
CREATE POLICY "Users can view custom dial values for their files"
  ON public.custom_dial_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = custom_dial_values.file_id
      AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can add custom dials to their files"
  ON public.custom_dial_values FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.files
      WHERE files.id = custom_dial_values.file_id
      AND files.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete custom dial values from their files"
  ON public.custom_dial_values FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for dial_translations
CREATE POLICY "Users can view all dial translations"
  ON public.dial_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create translations"
  ON public.dial_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to get trending dials
CREATE OR REPLACE FUNCTION public.get_trending_dials(
  p_content_type TEXT,
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  dial_id UUID,
  dial_name TEXT,
  recent_usage_count BIGINT,
  total_usage_count INTEGER,
  trend_score NUMERIC
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent_usage AS (
    SELECT 
      cd.id,
      COUNT(*) as recent_count
    FROM custom_dials cd
    JOIN custom_dial_values cdv ON cd.id = cdv.custom_dial_id
    WHERE cd.content_type = p_content_type
      AND cdv.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY cd.id
  )
  SELECT 
    cd.id as dial_id,
    cd.dial_name,
    COALESCE(ru.recent_count, 0) as recent_usage_count,
    cd.usage_count as total_usage_count,
    CASE 
      WHEN cd.usage_count > 0 THEN 
        (COALESCE(ru.recent_count, 0)::NUMERIC / cd.usage_count::NUMERIC) * 100
      ELSE 0
    END as trend_score
  FROM custom_dials cd
  LEFT JOIN recent_usage ru ON cd.id = ru.id
  WHERE cd.content_type = p_content_type
  ORDER BY trend_score DESC, recent_usage_count DESC
  LIMIT p_limit;
$$;