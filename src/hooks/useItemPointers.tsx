import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ItemPointer {
  id: string;
  item_id: string;
  space_id: string;
  shared_by_user_id: string;
  permissions: {
    can_view: boolean;
    can_reshare: boolean;
    can_monetize: boolean;
  };
  render_properties: {
    position_x: number;
    position_y: number;
    position_z: number;
    rotation: number;
    scale: number;
    cover_override_url?: string;
  };
  upstream_token: string | null;
  hidden: boolean;
  position: number;
  added_at: string;
  // Joined item data
  item?: {
    id: string;
    owner_id: string;
    file_url: string;
    file_type: string;
    original_name: string;
    mime_type: string | null;
    metadata: any;
  };
}

export function useItemPointers(spaceId?: string) {
  const [pointers, setPointers] = useState<ItemPointer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPointers = async () => {
    if (!spaceId) {
      setPointers([]);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: space } = await supabase
        .from('spaces')
        .select('is_public, user_id')
        .eq('id', spaceId)
        .single();

      const isPublic = space?.is_public;
      const isOwner = user && space?.user_id === user.id;

      let query = supabase
        .from('item_pointers')
        .select(`
          *,
          item:items(*)
        `)
        .eq('space_id', spaceId);

      // Filter out hidden items if not owner
      if (!isOwner && !isPublic) {
        query = query.eq('hidden', false);
      }

      const { data, error } = await query.order('position', { ascending: true });

      if (error) throw error;
      setPointers((data || []) as unknown as ItemPointer[]);
    } catch (error) {
      console.error('Error fetching item pointers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPointer = async (params: {
    itemId: string;
    spaceId: string;
    permissions?: object;
    renderProperties?: object;
    upstreamToken?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('item_pointers')
        .insert({
          item_id: params.itemId,
          space_id: params.spaceId,
          shared_by_user_id: user.id,
          permissions: params.permissions as any,
          render_properties: params.renderProperties as any,
          upstream_token: params.upstreamToken,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ItemPointer;
    } catch (error) {
      console.error('Error creating pointer:', error);
      return null;
    }
  };

  const updatePointer = async (pointerId: string, updates: Partial<ItemPointer>) => {
    try {
      const { error } = await supabase
        .from('item_pointers')
        .update(updates)
        .eq('id', pointerId);

      if (error) throw error;
      await fetchPointers();
      return true;
    } catch (error) {
      console.error('Error updating pointer:', error);
      return false;
    }
  };

  const deletePointer = async (pointerId: string) => {
    try {
      const { error } = await supabase
        .from('item_pointers')
        .delete()
        .eq('id', pointerId);

      if (error) throw error;
      await fetchPointers();
      return true;
    } catch (error) {
      console.error('Error deleting pointer:', error);
      return false;
    }
  };

  const hidePointer = async (pointerId: string) => {
    return updatePointer(pointerId, { hidden: true });
  };

  const showAllHidden = async (targetSpaceId: string) => {
    try {
      const { error } = await supabase
        .from('item_pointers')
        .update({ hidden: false })
        .eq('space_id', targetSpaceId)
        .eq('hidden', true);

      if (error) throw error;
      await fetchPointers();
      return true;
    } catch (error) {
      console.error('Error showing hidden pointers:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPointers();

    if (!spaceId) return;

    const channel = supabase
      .channel(`item-pointers-${spaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_pointers',
          filter: `space_id=eq.${spaceId}`,
        },
        () => {
          fetchPointers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);

  return {
    pointers,
    loading,
    fetchPointers,
    createPointer,
    updatePointer,
    deletePointer,
    hidePointer,
    showAllHidden,
  };
}
