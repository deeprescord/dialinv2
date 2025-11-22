-- Create the items table (N=1 Unity - The Fundamental Substrate)
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL,
  original_name text NOT NULL,
  mime_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  uip_metrics jsonb DEFAULT '{"entropy_score": 0.5}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add environment settings to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS space_type text DEFAULT 'list',
ADD COLUMN IF NOT EXISTS environment_settings jsonb DEFAULT '{}'::jsonb;

-- Create the item_pointers table (N=3 Rendering - The Emergence Layer)
CREATE TABLE IF NOT EXISTS public.item_pointers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"can_view": true, "can_reshare": false, "can_monetize": false}'::jsonb,
  render_properties jsonb DEFAULT '{"position_x": 0, "position_y": 0, "position_z": 0, "rotation": 0, "scale": 1}'::jsonb,
  upstream_token text,
  hidden boolean NOT NULL DEFAULT false,
  position integer DEFAULT 0,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(item_id, space_id)
);

-- Enable RLS on items
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Items RLS Policies
CREATE POLICY "Users can view their own items"
  ON public.items FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Items visible through pointers in public spaces"
  ON public.items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.item_pointers ip
    JOIN public.spaces s ON s.id = ip.space_id
    WHERE ip.item_id = items.id 
    AND s.is_public = true
  ));

-- Enable RLS on item_pointers
ALTER TABLE public.item_pointers ENABLE ROW LEVEL SECURITY;

-- Item Pointers RLS Policies
CREATE POLICY "Users can view pointers in their spaces"
  ON public.item_pointers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id
    AND spaces.user_id = auth.uid()
  ));

CREATE POLICY "Pointers in public spaces are viewable by everyone"
  ON public.item_pointers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id
    AND spaces.is_public = true
  ));

CREATE POLICY "Users can create pointers in their spaces"
  ON public.item_pointers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.spaces
      WHERE spaces.id = item_pointers.space_id
      AND spaces.user_id = auth.uid()
    )
    AND auth.uid() = shared_by_user_id
  );

CREATE POLICY "Users can update pointers in their spaces"
  ON public.item_pointers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id
    AND spaces.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pointers from their spaces"
  ON public.item_pointers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id
    AND spaces.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_item_pointers_item_id ON public.item_pointers(item_id);
CREATE INDEX IF NOT EXISTS idx_item_pointers_space_id ON public.item_pointers(space_id);
CREATE INDEX IF NOT EXISTS idx_item_pointers_shared_by ON public.item_pointers(shared_by_user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from files to items
INSERT INTO public.items (id, owner_id, file_url, file_type, original_name, mime_type, metadata, created_at, updated_at)
SELECT 
  id,
  owner_id,
  storage_path as file_url,
  file_type,
  original_name,
  mime_type,
  jsonb_build_object(
    'size', file_size,
    'duration', duration,
    'thumbnail_path', thumbnail_path
  ) as metadata,
  created_at,
  updated_at
FROM public.files
ON CONFLICT (id) DO NOTHING;

-- Migrate existing data from space_files to item_pointers
INSERT INTO public.item_pointers (item_id, space_id, shared_by_user_id, hidden, position, added_at)
SELECT 
  file_id as item_id,
  space_id,
  added_by as shared_by_user_id,
  hidden,
  position,
  added_at
FROM public.space_files
ON CONFLICT (item_id, space_id) DO NOTHING;