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

interface SpaceItemsGridProps {
  spaceId?: string;
  onItemClick?: (item: any) => void;
  onItemLongPress?: (item: any) => void;
  showSort?: boolean;
  enableDragDrop?: boolean;
}

export function SpaceItemsGrid({ 
  spaceId, 
  onItemClick,
  onItemLongPress,
  showSort = true,
  enableDragDrop = true
}: SpaceItemsGridProps) {
  const { items, loading, refetch } = useSpaceItems(spaceId);
  const { addToSpace, moveToSpace, connectSpaces, reorderItems } = useSpaceOrganization();
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');
  const [showSpacePickerModal, setShowSpacePickerModal] = useState(false);
  const [spacePickerAction, setSpacePickerAction] = useState<'add' | 'move' | 'connect'>('add');
  const [selectedOrgItemId, setSelectedOrgItemId] = useState<string | null>(null);
  const [selectedOrgIsSpace, setSelectedOrgIsSpace] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Sort items
  const sortedItems = React.useMemo(() => {
    console.log('Sorting items with order:', sortOrder, 'Item count:', items.length);
    const sorted = sortItems(items, sortOrder);
    console.log('First 3 items after sort:', sorted.slice(0, 3).map(i => ({ name: i.original_name, created: i.created_at })));
    return sorted;
  }, [items, sortOrder]);

  // Generate signed URLs for thumbnails
  useEffect(() => {
    const generateUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const item of items) {
        const pathToUse = item.thumbnail_path || item.storage_path;
        if (!pathToUse) continue;
        
        // Bypass absolute URLs
        if (typeof pathToUse === 'string' && /^https?:\/\//i.test(pathToUse)) {
          urls[item.id] = pathToUse;
        } else if (pathToUse.startsWith('space-covers/')) {
          // Public bucket - use getPublicUrl
          const { data } = supabase.storage
            .from('space-covers')
            .getPublicUrl(pathToUse);
          urls[item.id] = data.publicUrl;
        } else {
          // Private bucket - use createSignedUrl
          try {
            const { data } = await supabase.storage
              .from('user-files')
              .createSignedUrl(pathToUse, 3600);
            if (data?.signedUrl) {
              urls[item.id] = data.signedUrl;
            }
          } catch (error) {
            console.error('Error signing URL:', error);
          }
        }
      }
      
      setThumbUrls(urls);
    };

    if (items.length > 0) {
      generateUrls();
    }
  }, [items]);

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
  const gridItems = sortedItems.map(item => ({
    id: item.id,
    title: item.original_name,
    thumb: thumbUrls[item.id] || '/placeholder.svg',
    duration: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : undefined,
    is_space: item.is_space
  }));

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
