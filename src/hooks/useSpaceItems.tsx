import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpaceItem {
  id: string;
  file_id?: string; // Made optional since spaces won't have this
  original_name: string;
  file_type: string;
  mime_type?: string; // Made optional for spaces
  storage_path?: string; // Made optional for spaces
  thumbnail_path?: string;
  duration?: number;
  created_at: string;
  hashtags?: string[];
  dial_values?: Record<string, any>;
  is_space?: boolean; // New flag to identify spaces
  space_name?: string; // For display when it's a space
}

export function useSpaceItems(spaceId?: string) {
  const [items, setItems] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!spaceId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      // Optimized: Use Promise.all to fetch spaces and files in parallel
      const [spacesResult, filesResult] = await Promise.all([
        // Get child spaces with minimal fields
        supabase
          .from('spaces')
          .select('id, name, created_at, thumbnail_url, cover_url')
          .eq('parent_id', spaceId)
          .order('created_at', { ascending: false })
          .limit(50), // Limit initial load
        
        // Get files with metadata in a single query using joins
        supabase
          .from('space_files')
          .select(`
            file_id,
            files!inner(
              id,
              original_name,
              file_type,
              mime_type,
              storage_path,
              thumbnail_path,
              duration,
              created_at
            )
          `)
          .eq('space_id', spaceId)
          .limit(50) // Limit initial load
      ]);

      const allItems: SpaceItem[] = [];

      // Process child spaces
      if (spacesResult.data && spacesResult.data.length > 0) {
        const spaceItems: SpaceItem[] = spacesResult.data.map(space => ({
          id: space.id,
          original_name: space.name,
          file_type: 'space',
          created_at: space.created_at,
          is_space: true,
          space_name: space.name,
          thumbnail_path: space.thumbnail_url || space.cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        }));
        allItems.push(...spaceItems);
      }

      // Process files
      if (filesResult.data && filesResult.data.length > 0) {
        const fileItems: SpaceItem[] = filesResult.data.map((sf: any) => {
          const file = sf.files;
          return {
            id: file.id,
            file_id: file.id,
            original_name: file.original_name,
            file_type: file.file_type,
            mime_type: file.mime_type,
            storage_path: file.storage_path,
            thumbnail_path: file.thumbnail_path || undefined,
            duration: file.duration || undefined,
            created_at: file.created_at,
            is_space: false,
          };
        });
        allItems.push(...fileItems);
      }

      setItems(allItems);
    } catch (error) {
      console.error('Error in fetchItems:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [spaceId]);

  // Optimized realtime: debounce refetch and listen to both spaces and files
  useEffect(() => {
    if (!spaceId) return;

    let refetchTimeout: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(refetchTimeout);
      refetchTimeout = setTimeout(() => fetchItems(), 300);
    };

    const channel = supabase
      .channel(`space-items-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_files', filter: `space_id=eq.${spaceId}` },
        debouncedRefetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces', filter: `parent_id=eq.${spaceId}` },
        debouncedRefetch
      )
      .subscribe();

    return () => {
      clearTimeout(refetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [spaceId]);
  return {
    items,
    loading,
    refetch: fetchItems,
  };
}
