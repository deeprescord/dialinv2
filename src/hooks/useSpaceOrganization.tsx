import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SortOrder, OrganizationAction } from '@/types/organization';

export function useSpaceOrganization() {
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');

  const addToSpace = async (itemId: string, targetSpaceId: string, isSpace: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isSpace) {
        // For spaces, we don't duplicate - just change parent
        const { error } = await supabase
          .from('spaces')
          .update({ parent_id: targetSpaceId })
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        // For files, check if already in target space
        const { data: existing } = await supabase
          .from('space_files')
          .select('id')
          .eq('file_id', itemId)
          .eq('space_id', targetSpaceId)
          .single();

        if (existing) {
          toast.info('Item already in this space');
          return;
        }

        // Get max position in target space
        const { data: maxPos } = await supabase
          .from('space_files')
          .select('position')
          .eq('space_id', targetSpaceId)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        const newPosition = (maxPos?.position || 0) + 1;

        const { error } = await supabase
          .from('space_files')
          .insert({
            file_id: itemId,
            space_id: targetSpaceId,
            added_by: user.id,
            position: newPosition,
          });

        if (error) throw error;
      }

      toast.success('Added to space');
    } catch (error: any) {
      console.error('Error adding to space:', error);
      toast.error('Failed to add to space');
    }
  };

  const moveToSpace = async (itemId: string, currentSpaceId: string, targetSpaceId: string, isSpace: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isSpace) {
        // Just update parent
        const { error } = await supabase
          .from('spaces')
          .update({ parent_id: targetSpaceId })
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        // Remove from current space, add to target
        const { error: deleteError } = await supabase
          .from('space_files')
          .delete()
          .eq('file_id', itemId)
          .eq('space_id', currentSpaceId);

        if (deleteError) throw deleteError;

        // Get max position in target space
        const { data: maxPos } = await supabase
          .from('space_files')
          .select('position')
          .eq('space_id', targetSpaceId)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        const newPosition = (maxPos?.position || 0) + 1;

        const { error: insertError } = await supabase
          .from('space_files')
          .insert({
            file_id: itemId,
            space_id: targetSpaceId,
            added_by: user.id,
            position: newPosition,
          });

        if (insertError) throw insertError;
      }

      toast.success('Moved to space');
    } catch (error: any) {
      console.error('Error moving to space:', error);
      toast.error('Failed to move to space');
    }
  };

  const connectSpaces = async (fromSpaceId: string, toSpaceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('space_connections')
        .insert({
          from_space_id: fromSpaceId,
          to_space_id: toSpaceId,
          created_by: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Spaces already connected');
          return;
        }
        throw error;
      }

      toast.success('Spaces connected');
    } catch (error: any) {
      console.error('Error connecting spaces:', error);
      toast.error('Failed to connect spaces');
    }
  };

  const updateItemPosition = async (spaceId: string, itemId: string, newPosition: number, isSpace: boolean) => {
    try {
      if (isSpace) {
        const { error } = await supabase
          .from('spaces')
          .update({ position: newPosition })
          .eq('id', itemId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('space_files')
          .update({ position: newPosition })
          .eq('file_id', itemId)
          .eq('space_id', spaceId);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    }
  };

  const reorderItems = async (spaceId: string, itemIds: string[], isSpaces: boolean[]) => {
    try {
      // Update positions for all items
      const updates = itemIds.map((itemId, index) => 
        updateItemPosition(spaceId, itemId, index, isSpaces[index])
      );

      await Promise.all(updates);
      toast.success('Order updated');
    } catch (error: any) {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
    }
  };

  return {
    sortOrder,
    setSortOrder,
    addToSpace,
    moveToSpace,
    connectSpaces,
    updateItemPosition,
    reorderItems,
  };
}
