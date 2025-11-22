-- Create function to get the influence tree for a user
-- Shows how content spreads through generations of pointers
CREATE OR REPLACE FUNCTION public.get_influence_tree(_user_id uuid)
RETURNS TABLE (
  generation_depth int,
  pointer_count int,
  revenue_generated decimal
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE lineage AS (
    -- BASE CASE: Pointers directly attached to your items (Generation 1)
    SELECT 
      p.id, 
      1 AS depth,
      p.id AS root_pointer_id
    FROM public.item_pointers p
    JOIN public.items i ON p.item_id = i.id
    JOIN public.spaces s ON s.id = p.space_id
    WHERE i.owner_id = _user_id
    AND s.user_id != _user_id -- Don't count self-holding
    
    UNION ALL
    
    -- RECURSIVE STEP: Pointers that point to the base pointers
    SELECT 
      child.id, 
      parent.depth + 1,
      parent.root_pointer_id
    FROM public.item_pointers child
    JOIN lineage parent ON child.upstream_pointer_id = parent.id
    WHERE parent.depth < 10 -- Prevent infinite recursion
  ),
  revenue_by_pointer AS (
    SELECT 
      sc.target_pointer_id,
      COALESCE(SUM(l.amount), 0.0) AS total_revenue
    FROM public.smart_contracts sc
    LEFT JOIN public.ledger l ON l.contract_id = sc.id
    WHERE l.status = 'settled'
    GROUP BY sc.target_pointer_id
  )
  -- AGGREGATE BY DEPTH
  SELECT 
    lineage.depth::int, 
    COUNT(*)::int AS pointer_count,
    COALESCE(SUM(rbp.total_revenue), 0.0)::decimal AS revenue
  FROM lineage
  LEFT JOIN revenue_by_pointer rbp ON rbp.target_pointer_id = lineage.id
  GROUP BY lineage.depth
  ORDER BY lineage.depth;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_influence_tree(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_influence_tree(uuid) IS 
  'Returns the influence tree for a user showing pointer generations and revenue. 
   Each row represents a generation: depth 1 = direct shares, depth 2 = shares of shares, etc.';

-- Create a helper function to update influence stats based on the tree
CREATE OR REPLACE FUNCTION public.refresh_user_influence(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_branches int;
  _unique_holders int;
  _total_harvest decimal;
BEGIN
  -- Calculate total branches across all generations
  SELECT COALESCE(SUM(pointer_count), 0)
  INTO _total_branches
  FROM public.get_influence_tree(_user_id);
  
  -- Calculate unique holders (users who hold pointers to this user's items)
  SELECT COUNT(DISTINCT s.user_id)
  INTO _unique_holders
  FROM public.item_pointers ip
  JOIN public.items i ON ip.item_id = i.id
  JOIN public.spaces s ON s.id = ip.space_id
  WHERE i.owner_id = _user_id
  AND s.user_id != _user_id;
  
  -- Calculate total lifetime harvest
  SELECT COALESCE(SUM(revenue_generated), 0)
  INTO _total_harvest
  FROM public.get_influence_tree(_user_id);
  
  -- Update the influence stats
  UPDATE public.influence_stats
  SET
    total_branches_active = _total_branches,
    unique_holders_count = _unique_holders,
    total_lifetime_harvest = _total_harvest,
    last_updated = now()
  WHERE user_id = _user_id;
  
  -- Insert if not exists
  IF NOT FOUND THEN
    INSERT INTO public.influence_stats (
      user_id, 
      total_branches_active, 
      unique_holders_count, 
      total_lifetime_harvest
    )
    VALUES (
      _user_id,
      _total_branches,
      _unique_holders,
      _total_harvest
    );
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.refresh_user_influence(uuid) TO authenticated;

COMMENT ON FUNCTION public.refresh_user_influence(uuid) IS 
  'Recalculates and updates influence stats for a user based on their current pointer tree and revenue.';