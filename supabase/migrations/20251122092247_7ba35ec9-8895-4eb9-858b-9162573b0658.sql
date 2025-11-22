-- Update upstream_token to be a UUID foreign key for proper tree structure
ALTER TABLE public.item_pointers 
  DROP COLUMN IF EXISTS upstream_token;

ALTER TABLE public.item_pointers 
  ADD COLUMN upstream_pointer_id uuid REFERENCES public.item_pointers(id) ON DELETE CASCADE;

-- Add index for performance on tree traversal
CREATE INDEX IF NOT EXISTS idx_item_pointers_upstream ON public.item_pointers(upstream_pointer_id);
CREATE INDEX IF NOT EXISTS idx_item_pointers_item_holder ON public.item_pointers(item_id, space_id);

-- THE UDDHAVA VALIDATOR: Recursive Permission Chain Checker
-- Validates access by climbing the pointer tree back to the Item Owner
CREATE OR REPLACE FUNCTION public.check_access_chain(_item_id uuid, _user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _has_access boolean;
BEGIN
  -- 1. Direct Ownership Check (Unity/N=1)
  IF EXISTS (
    SELECT 1 FROM public.items 
    WHERE id = _item_id AND owner_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  -- 2. Recursive Tree Check (Emergence/N=3)
  -- Find if user has a pointer to this item through a valid chain
  WITH RECURSIVE permission_tree AS (
    -- Base Case: Find pointers in spaces owned by the requesting user
    SELECT 
      ip.id, 
      ip.upstream_pointer_id, 
      ip.item_id,
      s.user_id as holder_id
    FROM public.item_pointers ip
    INNER JOIN public.spaces s ON s.id = ip.space_id
    WHERE s.user_id = _user_id AND ip.item_id = _item_id
    
    UNION ALL
    
    -- Recursive Step: Climb the upstream_pointer_id ladder
    SELECT 
      p.id, 
      p.upstream_pointer_id, 
      p.item_id,
      s.user_id as holder_id
    FROM public.item_pointers p
    INNER JOIN public.spaces s ON s.id = p.space_id
    INNER JOIN permission_tree pt ON p.id = pt.upstream_pointer_id
  )
  SELECT EXISTS (
    -- Chain is valid if we reach a root pointer (no upstream)
    -- OR if we reach a pointer held by the item owner
    SELECT 1 FROM permission_tree pt
    WHERE pt.upstream_pointer_id IS NULL 
       OR EXISTS (
         SELECT 1 FROM public.items i 
         WHERE i.id = pt.item_id AND i.owner_id = pt.holder_id
       )
  ) INTO _has_access;

  RETURN COALESCE(_has_access, false);
END;
$$;

-- Update RLS policies to use the access chain validator
DROP POLICY IF EXISTS "Items visible through pointers in public spaces" ON public.items;
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;

-- Owner can always view their items
CREATE POLICY "Item owners can view their items"
ON public.items FOR SELECT
USING (auth.uid() = owner_id);

-- Users can view items they have valid pointer access to
CREATE POLICY "Users can view items via valid pointer chain"
ON public.items FOR SELECT
USING (
  check_access_chain(id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM item_pointers ip
    INNER JOIN spaces s ON s.id = ip.space_id
    WHERE ip.item_id = items.id AND s.is_public = true
  )
);