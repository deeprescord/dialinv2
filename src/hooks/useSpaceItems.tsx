import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SpaceItem {
  id: string;
  file_id: string;
  original_name: string;
  file_type: string;
  mime_type: string;
  storage_path: string;
  thumbnail_path?: string;
  created_at: string;
  hashtags?: string[];
  dial_values?: Record<string, any>;
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

      // Get files associated with this space
      const { data: spaceFiles, error: spaceFilesError } = await supabase
        .from('space_files')
        .select('file_id')
        .eq('space_id', spaceId);

      if (spaceFilesError) {
        console.error('Error fetching space files:', spaceFilesError);
        setItems([]);
        return;
      }

      if (!spaceFiles || spaceFiles.length === 0) {
        setItems([]);
        return;
      }

      const fileIds = spaceFiles.map(sf => sf.file_id);

      // Get file details
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select('*')
        .in('id', fileIds);

      if (filesError) {
        console.error('Error fetching files:', filesError);
        setItems([]);
        return;
      }

      // Get metadata for files
      const { data: metadata, error: metadataError } = await supabase
        .from('item_metadata')
        .select('file_id, hashtags, dial_values')
        .in('file_id', fileIds);

      if (metadataError) {
        console.error('Error fetching metadata:', metadataError);
      }

      // Combine file data with metadata
      const itemsWithMetadata: SpaceItem[] = files?.map(file => {
        const meta = metadata?.find(m => m.file_id === file.id);
        return {
          id: file.id,
          file_id: file.id,
          original_name: file.original_name,
          file_type: file.file_type,
          mime_type: file.mime_type,
          storage_path: file.storage_path,
          thumbnail_path: file.thumbnail_path || undefined,
          created_at: file.created_at,
          hashtags: meta?.hashtags as string[] || undefined,
          dial_values: (meta?.dial_values as Record<string, any>) || undefined,
        };
      }) || [];

      setItems(itemsWithMetadata);
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

  // Realtime updates: refetch when files are added/removed from this space
  useEffect(() => {
    if (!spaceId) return;

    const channel = supabase
      .channel(`space-items-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_files', filter: `space_id=eq.${spaceId}` },
        () => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);
  return {
    items,
    loading,
    refetch: fetchItems,
  };
}
