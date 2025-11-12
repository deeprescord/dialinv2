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
  position?: number; // For custom ordering
  file_size?: number; // For size sorting
}

export function useSpaceItems(spaceId?: string) {
  const [items, setItems] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublicSpace, setIsPublicSpace] = useState(false);

  const fetchItems = async () => {
    if (!spaceId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      // Public-friendly: don't depend on auth; Brave may block storage
      let userId: string | null = null;
      try {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id ?? null;
      } catch (e) {
        // Ignore auth errors; proceed anonymously
      }
      
      console.log('useSpaceItems: Fetching items for spaceId:', spaceId, 'User:', userId || 'anonymous');

      // First check if this space is public
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('is_public')
        .eq('id', spaceId)
        .single();
      
      const isPublic = spaceData?.is_public || false;
      setIsPublicSpace(isPublic);
      console.log('Space is public:', isPublic);

      // Optimized: Use Promise.all to fetch spaces and files in parallel
      const [spacesResult, spaceFilesResult] = await Promise.all([
        // Get child spaces with minimal fields
        supabase
          .from('spaces')
          .select('id, name, created_at, thumbnail_url, cover_url, position')
          .eq('parent_id', spaceId)
          .order('position', { ascending: true })
          .limit(50), // Limit initial load
        
        // Get space_files first - this has public RLS policy
        supabase
          .from('space_files')
          .select('file_id, position')
          .eq('space_id', spaceId)
          .order('position', { ascending: true })
          .limit(50)
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
          position: space.position || 0,
        }));
        allItems.push(...spaceItems);
      }

      // Process files - fetch file details separately to avoid INNER JOIN RLS issues
      if (spaceFilesResult.data && spaceFilesResult.data.length > 0) {
        const fileIds = spaceFilesResult.data.map(sf => sf.file_id);
        
        const { data: filesData } = await supabase
          .from('files')
          .select('id, original_name, file_type, mime_type, storage_path, thumbnail_path, duration, created_at, file_size')
          .in('id', fileIds);
        
        if (filesData) {
          const fileItems: SpaceItem[] = filesData.map(file => {
            const spaceFile = spaceFilesResult.data.find(sf => sf.file_id === file.id);
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
              position: spaceFile?.position || 0,
              file_size: file.file_size || 0,
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

  // Optimized realtime: immediate refetch on changes with visual feedback
  useEffect(() => {
    if (!spaceId) return;

    let refetchTimeout: NodeJS.Timeout;
    const handleChange = (payload: any) => {
      console.log('Real-time update detected:', payload.eventType, payload.table);
      clearTimeout(refetchTimeout);
      // Immediate refetch for INSERT events (new uploads)
      if (payload.eventType === 'INSERT') {
        fetchItems();
      } else {
        // Slight delay for other events
        refetchTimeout = setTimeout(() => fetchItems(), 150);
      }
    };

    const channel = supabase
      .channel(`space-items-${spaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'space_files', filter: `space_id=eq.${spaceId}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces', filter: `parent_id=eq.${spaceId}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'files' },
        handleChange
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
    isPublicSpace,
    refetch: fetchItems,
  };
}
