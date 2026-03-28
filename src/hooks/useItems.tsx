import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as Item[]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('items')
        .insert([{
          owner_id: user.id,
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
      const { error } = await supabase
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

    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel('items-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'items',
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            fetchItems();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
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
