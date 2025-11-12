import React, { useState, useEffect } from 'react';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { useSpaceOrganization } from '@/hooks/useSpaceOrganization';
import { MediaGrid } from './MediaGrid';
import { SpacePickerModal } from './SpacePickerModal';
import { SortDropdown } from './SortDropdown';
import { sortItems } from '@/lib/sortItems';
import type { SortOrder } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import defaultVideoThumb from '@/assets/video-thumbnails.jpg';

interface SpaceItemsGridProps {
  spaceId?: string;
  onItemClick?: (item: any) => void;
  onItemLongPress?: (item: any) => void;
  showSort?: boolean;
  enableDragDrop?: boolean;
  isPublicSpace?: boolean;
}

export function SpaceItemsGrid({ 
  spaceId, 
  onItemClick,
  onItemLongPress,
  showSort = true,
  enableDragDrop = true,
  isPublicSpace = false
}: SpaceItemsGridProps) {
  const { items, loading, refetch } = useSpaceItems(spaceId);
  const { addToSpace, moveToSpace, connectSpaces, reorderItems } = useSpaceOrganization();
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');
  const [showSpacePickerModal, setShowSpacePickerModal] = useState(false);
  const [spacePickerAction, setSpacePickerAction] = useState<'add' | 'move' | 'connect'>('add');
  const [selectedOrgItemId, setSelectedOrgItemId] = useState<string | null>(null);
  const [selectedOrgIsSpace, setSelectedOrgIsSpace] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  
  // Track processed items to avoid duplicate generation
  const processedRef = React.useRef<Set<string>>(new Set());

  // Auto-generate thumbnails for images in this space missing them
  useEffect(() => {
    const generateMissingThumbs = async () => {
      const missing = items.filter(
        (it) => it.file_type === 'image' && !it.thumbnail_path && it.storage_path && !processedRef.current.has(it.id)
      );
      if (missing.length === 0) return;
      console.log(`Auto-generating thumbnails for ${missing.length} images in this space...`);
      const batchSize = 5;
      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (file) => {
            try {
              processedRef.current.add(file.id);
              const { error } = await supabase.functions.invoke('generate-thumbnail', {
                body: {
                  fileId: file.id,
                  storagePath: file.storage_path,
                  mimeType: file.mime_type || 'image/jpeg',
                }
              });
              if (error) {
                console.warn('Thumb gen failed for', file.id, error);
              }
            } catch (err) {
              console.warn('Thumb gen error for', file.id, err);
            }
          })
        );
      }
    };

    if (items.length > 0) generateMissingThumbs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Sort items
  const sortedItems = React.useMemo(() => {
    console.log('Sorting items with order:', sortOrder, 'Item count:', items.length);
    const sorted = sortItems(items, sortOrder);
    console.log('First 3 items after sort:', sorted.slice(0, 3).map(i => ({ name: i.original_name, created: i.created_at })));
    return sorted;
  }, [items, sortOrder]);

  // Generate signed URLs for thumbnails (batched for performance, esp. Safari)
  useEffect(() => {
    const generateUrls = async () => {
      const t0 = performance.now();
      const urls: Record<string, string> = {};

      // Collect paths to sign in batch
      const userFilePaths: string[] = [];
      const pathToIds: Record<string, string[]> = {};

      for (const item of items) {
        // Only use original file as a fallback if it's an image
        let pathToUse: string | undefined;
        if (item.thumbnail_path) {
          pathToUse = item.thumbnail_path;
        } else if (item.file_type === 'image' && item.storage_path) {
          pathToUse = item.storage_path;
        } else {
          // For videos without a generated thumbnail, skip so UI uses a placeholder
          continue;
        }

        if (typeof pathToUse === 'string' && /^https?:\/\//i.test(pathToUse)) {
          urls[item.id] = pathToUse;
          continue;
        }

        if (pathToUse.startsWith('space-covers/')) {
          // Public bucket - use getPublicUrl
          const { data } = supabase.storage.from('space-covers').getPublicUrl(pathToUse);
          urls[item.id] = data.publicUrl;
          continue;
        }

        // Private bucket - batch sign (normalize path)
        const norm = pathToUse.replace(/^user-files\//, '');
        if (!pathToIds[norm]) {
          pathToIds[norm] = [];
          userFilePaths.push(norm);
        }
        pathToIds[norm].push(item.id);
      }

      if (userFilePaths.length > 0) {
        try {
          const cacheBuster = Date.now();
          const { data, error } = await supabase.storage
            .from('user-files')
            .createSignedUrls(userFilePaths, 7200); // 2 hours

          if (error) {
            console.error('[Chrome Debug] SpaceItemsGrid: batch signing error:', error);
            // Retry individually if batch fails
            for (const path of userFilePaths) {
              try {
                const { data: retryData, error: retryError } = await supabase.storage
                  .from('user-files')
                  .createSignedUrl(path, 7200);
                if (retryError) {
                  console.error('[Chrome Debug] Retry failed for path:', path, retryError);
                } else if (retryData?.signedUrl) {
                  const signedWithCache = `${retryData.signedUrl}&cb=${cacheBuster}`;
                  const ids = pathToIds[path] || [];
                  ids.forEach((id) => (urls[id] = signedWithCache));
                  console.log('[Chrome Debug] Retry success for path:', path);
                }
              } catch (retryErr) {
                console.error('[Chrome Debug] Retry exception for path:', path, retryErr);
              }
            }
          } else if (Array.isArray(data)) {
            for (const entry of data) {
              const ids = pathToIds[entry.path] || [];
              if (entry.signedUrl) {
                // Add cache-buster to prevent Chrome caching issues
                const signedWithCache = `${entry.signedUrl}&cb=${cacheBuster}`;
                ids.forEach((id) => (urls[id] = signedWithCache));
              } else {
                console.warn('[Chrome Debug] No signedUrl for path:', entry.path);
              }
            }
            console.log('[Chrome Debug] Batch signed', data.length, 'URLs successfully');
          }
        } catch (err) {
          console.error('[Chrome Debug] SpaceItemsGrid: batch sign exception:', err);
        }
      }

      console.log(
        'SpaceItemsGrid: Generated',
        Object.keys(urls).length,
        'thumbnail URLs for',
        items.length,
        'items in',
        Math.round(performance.now() - t0),
        'ms'
      );
      setThumbUrls(urls);
    };

    if (items.length > 0) {
      generateUrls();
    }
  }, [items, isPublicSpace]);

  const handleOrgAdd = (itemId: string, isSpace: boolean) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(isSpace);
    setSpacePickerAction('add');
    setShowSpacePickerModal(true);
  };

  const handleOrgMove = (itemId: string, isSpace: boolean) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(isSpace);
    setSpacePickerAction('move');
    setShowSpacePickerModal(true);
  };

  const handleOrgConnect = (itemId: string) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(true);
    setSpacePickerAction('connect');
    setShowSpacePickerModal(true);
  };

  const handleOrgDelete = async (itemId: string, isSpace: boolean) => {
    if (!spaceId) return;
    
    try {
      if (isSpace) {
        const { error } = await supabase
          .from('spaces')
          .delete()
          .eq('id', itemId);
        
        if (error) throw error;
        toast.success('Space deleted');
      } else {
        const { error } = await supabase
          .from('space_files')
          .delete()
          .match({ space_id: spaceId, file_id: itemId });
        
        if (error) throw error;
        toast.success('Item removed from space');
      }
      refetch();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const handleReorder = async (itemIds: string[]) => {
    if (!spaceId) return;
    
    try {
      const isSpaces = items.map(item => item.is_space);
      await reorderItems(spaceId, itemIds, isSpaces);
      refetch();
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    }
  };

  const handleSpacePickerSelect = async (targetSpaceId: string) => {
    if (!selectedOrgItemId || !spaceId) return;

    try {
      if (spacePickerAction === 'add') {
        await addToSpace(selectedOrgItemId, targetSpaceId, selectedOrgIsSpace);
        toast.success('Added to space');
      } else if (spacePickerAction === 'move') {
        await moveToSpace(selectedOrgItemId, spaceId, targetSpaceId, selectedOrgIsSpace);
        toast.success('Moved to space');
      } else if (spacePickerAction === 'connect') {
        await connectSpaces(selectedOrgItemId, targetSpaceId);
        toast.success('Spaces connected');
      }
      
      setShowSpacePickerModal(false);
      setSelectedOrgItemId(null);
      refetch();
    } catch (error) {
      console.error('Organization action failed:', error);
      toast.error('Action failed');
    }
  };

  // Transform items to MediaGrid format
  const gridItems = sortedItems.map(item => {
    const thumb = (item.file_type === 'video' && !thumbUrls[item.id])
      ? defaultVideoThumb
      : (thumbUrls[item.id] || '/placeholder.svg');

    return {
      id: item.id,
      title: item.original_name,
      thumb,
      duration: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : undefined,
      is_space: item.is_space
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No items in this space yet</p>
      </div>
    );
  }

  return (
    <>
      {showSort && (
        <div className="flex justify-end px-4 mb-4">
          <SortDropdown currentSort={sortOrder} onSortChange={setSortOrder} />
        </div>
      )}
      
      <MediaGrid
        items={gridItems}
        onItemClick={onItemClick || (() => {})}
        onItemLongPress={onItemLongPress}
        enableDragDrop={enableDragDrop && sortOrder === 'custom'}
        onReorder={handleReorder}
        onAdd={handleOrgAdd}
        onMove={handleOrgMove}
        onConnect={handleOrgConnect}
        onDelete={handleOrgDelete}
      />

      <SpacePickerModal
        open={showSpacePickerModal}
        onClose={() => setShowSpacePickerModal(false)}
        onSelect={handleSpacePickerSelect}
        currentSpaceId={spaceId}
        title={
          spacePickerAction === 'add' ? 'Add to Space' :
          spacePickerAction === 'move' ? 'Move to Space' :
          'Connect Spaces'
        }
        description={
          spacePickerAction === 'add' ? 'Select a space to add this item to (keeps it in current space too)' :
          spacePickerAction === 'move' ? 'Select a space to move this item to (removes from current space)' :
          'Select a space to connect with'
        }
      />
    </>
  );
}
