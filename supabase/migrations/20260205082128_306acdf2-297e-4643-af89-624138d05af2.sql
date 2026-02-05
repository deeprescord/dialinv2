-- Allow anonymous SELECT on item_pointers where the related space is public
CREATE POLICY "Public space item_pointers are viewable by everyone"
ON public.item_pointers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id
    AND spaces.is_public = true
  )
);

-- Allow anonymous SELECT on items where they are referenced via item_pointers in a public space
CREATE POLICY "Items in public spaces are viewable by everyone"
ON public.items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.item_pointers ip
    JOIN public.spaces s ON s.id = ip.space_id
    WHERE ip.item_id = items.id
    AND s.is_public = true
  )
);