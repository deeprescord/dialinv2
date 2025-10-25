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

      // Get child spaces (sub-spaces within this space)
      const { data: childSpaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('parent_id', spaceId)
        .order('created_at', { ascending: false });

      if (spacesError) {
        console.error('Error fetching child spaces:', spacesError);
      }

      // Get files associated with this space
      const { data: spaceFiles, error: spaceFilesError } = await supabase
        .from('space_files')
        .select('file_id')
        .eq('space_id', spaceId);

      if (spaceFilesError) {
        console.error('Error fetching space files:', spaceFilesError);
      }

      const allItems: SpaceItem[] = [];

      // Add child spaces as items
      if (childSpaces && childSpaces.length > 0) {
        console.log('Child spaces found:', childSpaces);
        const spaceItems: SpaceItem[] = childSpaces.map(space => ({
          id: space.id,
          original_name: space.name,
          file_type: 'space',
          created_at: space.created_at,
          is_space: true,
          space_name: space.name,
          // Use thumbnail_url or cover_url or fallback to default
          thumbnail_path: space.thumbnail_url || space.cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        }));
        console.log('Converted space items:', spaceItems);
        allItems.push(...spaceItems);
      }

      // Add files if any exist
      if (spaceFiles && spaceFiles.length > 0) {
        const fileIds = spaceFiles.map(sf => sf.file_id);

        // Get file details
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds);

        if (filesError) {
          console.error('Error fetching files:', filesError);
        } else if (files) {
          // Get metadata for files
          const { data: metadata, error: metadataError } = await supabase
            .from('item_metadata')
            .select('file_id, hashtags, dial_values')
            .in('file_id', fileIds);

          if (metadataError) {
            console.error('Error fetching metadata:', metadataError);
          }

          // Combine file data with metadata
          const fileItems: SpaceItem[] = files.map(file => {
            const meta = metadata?.find(m => m.file_id === file.id);
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
              hashtags: meta?.hashtags as string[] || undefined,
              dial_values: (meta?.dial_values as Record<string, any>) || undefined,
              is_space: false,
            };
          });
          allItems.push(...fileItems);
        }
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
