-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "View_My_Pointers" ON public.item_pointers;

-- Create a simplified non-recursive policy for viewing pointers
-- Users can view pointers in their own spaces OR in public spaces
CREATE POLICY "View_My_Pointers_Fixed" 
ON public.item_pointers 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM spaces 
    WHERE spaces.id = item_pointers.space_id 
    AND (spaces.user_id = auth.uid() OR spaces.is_public = true)
  )
);