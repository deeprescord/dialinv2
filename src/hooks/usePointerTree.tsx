import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TreeNode {
  pointerId: string;
  itemId: string;
  spaceId: string;
  spaceName: string;
  sharedByUserId: string;
  sharedByName: string;
  upstreamPointerId: string | null;
  addedAt: string;
  permissions: {
    can_view: boolean;
    can_reshare: boolean;
    can_monetize: boolean;
  };
  children: TreeNode[];
}

/**
 * Hook to visualize the "tree" of an item across spaces
 * Shows who has access and how the item propagated through the system
 */
export function usePointerTree(itemId?: string) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTree = async () => {
    if (!itemId) {
      setTree(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch all pointers for this item
      const { data: pointers, error } = await supabase
        .from('item_pointers')
        .select(`
          id,
          item_id,
          space_id,
          shared_by_user_id,
          upstream_pointer_id,
          added_at,
          permissions,
          space:spaces(name),
          shared_by:profiles!shared_by_user_id(full_name)
        `)
        .eq('item_id', itemId);

      if (error) throw error;
      if (!pointers || pointers.length === 0) {
        setTree(null);
        setLoading(false);
        return;
      }

      // Build tree structure
      const pointerMap = new Map<string, TreeNode>();
      
      // Create nodes
      pointers.forEach(p => {
        const node: TreeNode = {
          pointerId: p.id,
          itemId: p.item_id,
          spaceId: p.space_id,
          spaceName: (p.space as any)?.name || 'Unknown Space',
          sharedByUserId: p.shared_by_user_id,
          sharedByName: (p.shared_by as any)?.full_name || 'Unknown User',
          upstreamPointerId: p.upstream_pointer_id,
          addedAt: p.added_at,
          permissions: p.permissions as any,
          children: [],
        };
        pointerMap.set(p.id, node);
      });

      // Build hierarchy based on upstream_pointer_id
      let rootNode: TreeNode | null = null;
      pointerMap.forEach((node) => {
        if (node.upstreamPointerId) {
          const parent = pointerMap.get(node.upstreamPointerId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          // This is the root (original share)
          rootNode = node;
        }
      });

      setTree(rootNode);
    } catch (error) {
      console.error('Error fetching pointer tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const cutOffBranch = async (pointerId: string) => {
    try {
      // This will delete the pointer and all downstream pointers
      // due to cascade delete from upstream_token references
      const { error } = await supabase
        .from('item_pointers')
        .delete()
        .eq('id', pointerId);

      if (error) throw error;

      // Children are automatically deleted via CASCADE from the foreign key
      // No need for explicit deletion

      await fetchTree();
      return true;
    } catch (error) {
      console.error('Error cutting off branch:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchTree();
  }, [itemId]);

  return {
    tree,
    loading,
    fetchTree,
    cutOffBranch,
  };
}
