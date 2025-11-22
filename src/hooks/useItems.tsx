import { useState, useEffect } from 'react';
import { manualSupabase } from '@/lib/manualSupabase';

export interface Item {
  id: string;
  owner_id: string;
  file_url: string;
  file_type: string;
  original_name: string;
  mime_type: string | null;
  metadata: {
    size?: number;
    duration?: number;
    thumbnail_path?: string;
  };
  uip_metrics: {
    entropy_score: number;
  };
  created_at: string;
  updated_at: string;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      // Fetch ALL items (global view) - no user filter
      const { data, error } = await manualSupabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as Item[]);
      console.log('✅ Fetched items:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (itemData: {
    file_url: string;
    file_type: string;
    original_name: string;
    mime_type?: string;
    metadata?: object;
  }): Promise<Item | null> => {
    try {
      const { data: { user } } = await manualSupabase.auth.getUser();
      const ownerId = user?.id || null;

      const { data, error } = await manualSupabase
        .from('items')
        .insert([{
          owner_id: ownerId,
          file_url: itemData.file_url,
          file_type: itemData.file_type,
          original_name: itemData.original_name,
          mime_type: itemData.mime_type || null,
          metadata: (itemData.metadata || {}) as any,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as Item;
    } catch (error) {
      console.error('Error creating item:', error);
      return null;
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await manualSupabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchItems();
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchItems();

    // Realtime subscription for instant updates
    const channel = manualSupabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
        },
        (payload) => {
          console.log('🔄 Realtime update:', payload);
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      manualSupabase.removeChannel(channel);
    };
  }, []);

  return {
    items,
    loading,
    fetchItems,
    createItem,
    deleteItem,
  };
}
