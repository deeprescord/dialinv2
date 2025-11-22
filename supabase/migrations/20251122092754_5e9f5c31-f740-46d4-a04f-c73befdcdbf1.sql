-- Drop existing policies to replace with UIP-aware versions
DROP POLICY IF EXISTS "Item owners can view their items" ON public.items;
DROP POLICY IF EXISTS "Users can view items via valid pointer chain" ON public.items;
DROP POLICY IF EXISTS "Pointers in public spaces are viewable by everyone" ON public.item_pointers;
DROP POLICY IF EXISTS "Users can view pointers in their spaces" ON public.item_pointers;

-- ITEMS: UIP Access Policy
-- Users can see an Item IF they own it OR have a valid pointer chain
CREATE POLICY "UIP_Access_Policy"
ON public.items
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR 
  public.check_access_chain(id, auth.uid())
);

-- ITEM POINTERS: View My Pointers
-- Users can see pointers in spaces they own OR pointers downstream from their pointers
CREATE POLICY "View_My_Pointers"
ON public.item_pointers
FOR SELECT
USING (
  -- I own the space containing this pointer (I am the holder)
  EXISTS (
    SELECT 1 FROM public.spaces 
    WHERE spaces.id = item_pointers.space_id 
    AND spaces.user_id = auth.uid()
  )
  OR
  -- This pointer is downstream from a pointer I hold
  upstream_pointer_id IN (
    SELECT ip.id 
    FROM public.item_pointers ip
    INNER JOIN public.spaces s ON s.id = ip.space_id
    WHERE s.user_id = auth.uid()
  )
  OR
  -- Public spaces are viewable by everyone
  EXISTS (
    SELECT 1 FROM public.spaces
    WHERE spaces.id = item_pointers.space_id 
    AND spaces.is_public = true
  )
);

-- STORAGE: Pointer-Based File Access
-- Users can access files in storage if they own them OR have a valid pointer chain
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket access" ON storage.objects;

CREATE POLICY "Give_Access_If_Pointer_Exists"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'user-files'
  AND (
    -- User owns the file
    owner = auth.uid()
    OR
    -- User has valid pointer chain to this file
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.file_url LIKE '%' || storage.objects.name || '%'
      AND public.check_access_chain(i.id, auth.uid())
    )
  )
);

-- Allow uploads to user-files bucket
CREATE POLICY "Users_Can_Upload_Own_Files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-files'
  AND owner = auth.uid()
);

-- Allow users to update their own files
CREATE POLICY "Users_Can_Update_Own_Files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-files'
  AND owner = auth.uid()
);

-- Allow users to delete their own files
CREATE POLICY "Users_Can_Delete_Own_Files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-files'
  AND owner = auth.uid()
);