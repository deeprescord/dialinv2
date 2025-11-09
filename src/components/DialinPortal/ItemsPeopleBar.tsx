import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { friends } from '@/data/catalogs';
import { FileText, Music, Video, Image as ImageIcon, File, LayoutGrid, List, Grid3x3, Columns, RefreshCw } from 'lucide-react';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { safeLocalStorage } from '@/lib/safeLocalStorage';
import { PinnedContactsRow } from './PinnedContactsRow';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';

interface ItemsPeopleBarProps {
  scale?: number;
  view: 'items' | 'people';
  spaceId?: string;
  onItemClick?: (item: any) => void;
  onClose?: () => void;
  onDeleteSpace?: (spaceId: string) => void;
  onRenameSpace?: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription?: (spaceId: string, newDescription: string) => void;
  onUpdateSpaceThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorderSpace?: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360?: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  on360RotationToggle?: (spaceId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (spaceId: string, speed: number) => void;
  on360RotationAxisChange?: (spaceId: string, axis: 'x' | 'y') => void;
  onItem360Toggle?: (itemId: string, enabled: boolean) => void;
}

type ViewMode = 'carousel' | 'icon' | 'list' | 'tile';

export function ItemsPeopleBar({ 
  scale = 30, 
  view, 
  spaceId, 
  onItemClick, 
  onClose,
  onDeleteSpace,
  onRenameSpace,
  onUpdateSpaceDescription,
  onUpdateSpaceThumbnail,
  onReorderSpace,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  on360RotationToggle,
  on360RotationSpeedChange,
  on360RotationAxisChange,
  onItem360Toggle
}: ItemsPeopleBarProps) {
  const { items, loading } = useSpaceItems(spaceId);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = safeLocalStorage.getItem('itemsViewMode');
    return (saved as ViewMode) || 'tile';
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [contextMenu, setContextMenu] = useState<{
    space: any;
    position: { x: number; y: number };
  } | null>(null);

  // Persist view mode preference
  useEffect(() => {
    safeLocalStorage.setItem('itemsViewMode', viewMode);
  }, [viewMode]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scale-responsive sizing (reduced by 25%)
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const cardWidth = getScaled(150);
  const cardHeight = getScaled(180);
  const spacing = getScaled(12);
  const padding = getScaled(16);

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'space': return <LayoutGrid className="w-12 h-12 text-primary" />;
      case 'image': return <ImageIcon className="w-12 h-12 text-primary" />;
      case 'video': return <Video className="w-12 h-12 text-primary" />;
      case 'audio': return <Music className="w-12 h-12 text-primary" />;
      case 'document': return <FileText className="w-12 h-12 text-primary" />;
      default: return <File className="w-12 h-12 text-primary" />;
    }
  };

  // Signed thumbnail URLs for private bucket
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [regeneratingThumbs, setRegeneratingThumbs] = useState(false);

  // Function to regenerate thumbnails
  const handleRegenerateThumbnails = async () => {
    setRegeneratingThumbs(true);
    toast.info('Generating thumbnails for faster loading...');
    
    try {
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('file_type', 'image')
        .is('thumbnail_path', null);

      if (error || !files || files.length === 0) {
        toast.info('No images need thumbnail generation');
        setRegeneratingThumbs(false);
        return;
      }

      let processed = 0;
      const batchSize = 3;
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (file) => {
            try {
              await supabase.functions.invoke('generate-thumbnail', {
                body: {
                  fileId: file.id,
                  storagePath: file.storage_path,
                  mimeType: file.mime_type || 'image/jpeg'
                }
              });
              processed++;
            } catch (err) {
              console.warn(`Error generating thumbnail for ${file.id}:`, err);
            }
          })
        );
      }

      toast.success(`Generated ${processed} thumbnails. Refreshing...`);
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error('Error regenerating thumbnails:', error);
      toast.error('Failed to regenerate thumbnails');
    } finally {
      setRegeneratingThumbs(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadThumbs = async () => {
      if (!items?.length) return;
      
      // Batch create signed URLs more efficiently
      const urlPromises = items.map(async (item) => {
        // Prefer thumbnail for faster loading
        const path = item.thumbnail_path || item.storage_path;
        if (!path) return [item.id, null] as const;
        
        // Check if absolute URL
        if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
          return [item.id, path] as const;
        }
        
        // Check if public bucket
        if (path.startsWith('space-covers/')) {
          const { data } = supabase.storage
            .from('space-covers')
            .getPublicUrl(path);
          return [item.id, data.publicUrl] as const;
        }
        
        // Private bucket - sign URL
        try {
          const { data, error } = await supabase.storage
            .from('user-files')
            .createSignedUrl(path, 7200); // 2 hour cache
            
          if (error) throw error;
          return [item.id, data.signedUrl] as const;
        } catch (err) {
          console.warn('Signed URL failed for', path, err);
          return [item.id, null] as const;
        }
      });

      const pairs = await Promise.all(urlPromises);
      
      if (!cancelled) {
        const urlMap: Record<string, string> = {};
        for (const [id, url] of pairs) {
          if (url) urlMap[id] = url;
        }
        setThumbUrls(urlMap);
      }
    };
    
    loadThumbs();
    return () => {
      cancelled = true;
    };
  }, [items]);

  // Handle long press
  const handleMouseDown = (item: any, event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      if (item.is_space) {
        // Show context menu for spaces
        setContextMenu({
          space: {
            id: item.id,
            name: item.original_name,
            thumb: thumbUrls[item.id] || '/placeholder.svg'
          },
          position: { x: event.clientX, y: event.clientY }
        });
      } else {
        // Show dial popup for files
        setDialPopupItem({
          id: item.id,
          title: item.original_name,
          thumb: thumbUrls[item.id],
          type: item.file_type
        });
        setShowDialPopup(true);
      }
    }, 500);
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Handle item click with proper transformation
  const handleItemClick = async (item: any) => {
    if (!onItemClick) return;
    
    // If it's a space, navigate to it instead of showing content
    if (item.is_space) {
      window.location.href = `/space/${item.id}`;
      return;
    }
    
    // Generate signed URL for the item
    const { data: signedData } = await supabase.storage
      .from('user-files')
      .createSignedUrl(item.storage_path, 3600);
    
    const url = signedData?.signedUrl || '';
    
    // Transform SpaceItem to the format expected by ContentViewer/HeroHeaderVideo
    const transformedItem = {
      id: item.id,
      title: item.original_name,
      type: item.file_type,
      url: url,
      thumb: item.thumbnail_path ? url : undefined,
      duration: item.duration,
      mime_type: item.mime_type,
      storage_path: item.storage_path,
      file_type: item.file_type,
      original_name: item.original_name,
      thumbnail_path: item.thumbnail_path
    };
    
    onItemClick(transformedItem);
    onClose?.(); // Close panel after clicking item
  };

  const renderCarouselView = () => (
    <Carousel 
      className="w-full max-w-5xl mx-auto"
      opts={{
        dragFree: true,
      }}
    >
      <CarouselContent className="-ml-2 cursor-grab active:cursor-grabbing">
        {items.map((item, index) => {
          const thumbnail = thumbUrls[item.id];
          return (
            <CarouselItem key={item.id} className="pl-2 md:basis-1/2 lg:basis-1/3">
              <div className="p-4">
                <div 
                  className="cursor-pointer group flex flex-col items-center gap-3"
                  onClick={() => handleItemClick(item)}
                  onMouseDown={(e) => handleMouseDown(item, e)}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleMouseDown(item, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                  }}
                  onTouchEnd={handleMouseUp}
                >
                  <div className="rounded-xl overflow-hidden group-hover:scale-105 transition-transform border border-white/20 relative bg-muted/50 flex items-center justify-center w-full aspect-[3/4]">
                    {thumbnail ? (
                      <ImageFallback 
                        src={thumbnail}
                        alt={item.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(item.file_type)
                    )}
                    {/* File type icon badge */}
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded p-1.5">
                      {item.file_type === 'space' && <LayoutGrid className="w-4 h-4 text-white" />}
                      {item.file_type === 'image' && <ImageIcon className="w-4 h-4 text-white" />}
                      {item.file_type === 'video' && <Video className="w-4 h-4 text-white" />}
                      {item.file_type === 'audio' && <Music className="w-4 h-4 text-white" />}
                      {item.file_type === 'document' && <FileText className="w-4 h-4 text-white" />}
                      {!['space', 'image', 'video', 'audio', 'document'].includes(item.file_type) && <File className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground/90 max-w-full truncate">
                    {item.original_name}
                  </span>
                </div>
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );

  const renderIconView = () => (
    <ScrollArea className="h-[500px] w-full">
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
        {items.map((item) => {
          const thumbnail = thumbUrls[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="cursor-pointer group flex flex-col items-center gap-2"
              onClick={() => handleItemClick(item)}
            >
              <div className="rounded-lg overflow-hidden group-hover:scale-110 transition-transform border border-white/10 relative bg-muted/50 flex items-center justify-center w-full aspect-square">
                {thumbnail ? (
                  <ImageFallback 
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8">{getFileIcon(item.file_type)}</div>
                )}
                {/* File type icon badge */}
                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded p-1">
                  {item.file_type === 'image' && <ImageIcon className="w-3 h-3 text-white" />}
                  {item.file_type === 'video' && <Video className="w-3 h-3 text-white" />}
                  {item.file_type === 'audio' && <Music className="w-3 h-3 text-white" />}
                  {item.file_type === 'document' && <FileText className="w-3 h-3 text-white" />}
                  {!['image', 'video', 'audio', 'document'].includes(item.file_type) && <File className="w-3 h-3 text-white" />}
                </div>
              </div>
              <span className="text-xs text-foreground/70 max-w-full truncate text-center px-1">
                {item.original_name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );

  const renderListView = () => (
    <ScrollArea className="h-[500px] w-full">
      <div className="flex flex-col gap-2 p-4">
        {items.map((item) => {
          const thumbnail = thumbUrls[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="cursor-pointer group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-white/5"
              onClick={() => handleItemClick(item)}
            >
              <div className="rounded overflow-hidden border border-white/10 bg-muted/50 flex items-center justify-center w-16 h-16 flex-shrink-0 relative">
                {thumbnail ? (
                  <ImageFallback 
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8">{getFileIcon(item.file_type)}</div>
                )}
                {/* File type icon badge */}
                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm rounded p-0.5">
                  {item.file_type === 'image' && <ImageIcon className="w-2.5 h-2.5 text-white" />}
                  {item.file_type === 'video' && <Video className="w-2.5 h-2.5 text-white" />}
                  {item.file_type === 'audio' && <Music className="w-2.5 h-2.5 text-white" />}
                  {item.file_type === 'document' && <FileText className="w-2.5 h-2.5 text-white" />}
                  {!['image', 'video', 'audio', 'document'].includes(item.file_type) && <File className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.original_name}</p>
                <p className="text-xs text-muted-foreground">{item.file_type}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );

  const renderTileView = () => (
    <ScrollArea className="h-[500px] w-full">
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 p-4">
        {items.map((item) => {
          const thumbnail = thumbUrls[item.id];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="cursor-pointer group mb-4 break-inside-avoid"
              onClick={() => handleItemClick(item)}
            >
              <div className="rounded-lg overflow-hidden group-hover:scale-105 transition-transform border border-white/10 relative bg-muted/50">
                {thumbnail ? (
                  <ImageFallback 
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    {getFileIcon(item.file_type)}
                  </div>
                )}
                {/* File type icon badge */}
                <div className="absolute bottom-12 right-2 bg-black/60 backdrop-blur-sm rounded p-1">
                  {item.file_type === 'image' && <ImageIcon className="w-3 h-3 text-white" />}
                  {item.file_type === 'video' && <Video className="w-3 h-3 text-white" />}
                  {item.file_type === 'audio' && <Music className="w-3 h-3 text-white" />}
                  {item.file_type === 'document' && <FileText className="w-3 h-3 text-white" />}
                  {!['image', 'video', 'audio', 'document'].includes(item.file_type) && <File className="w-3 h-3 text-white" />}
                </div>
                <div className="p-2 bg-background/80 backdrop-blur">
                  <span className="text-xs font-medium text-foreground/80 line-clamp-2">
                    {item.original_name}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );

  const renderContent = () => {
    if (view === 'people') {
      return (
        <div className="p-4">
          <PinnedContactsRow 
            contacts={friends} 
            onContactClick={(contact) => console.log('Contact clicked:', contact)}
            title="People in this Space"
          />
        </div>
      );
    }

    if (loading) {
      return <div className="text-sm text-muted-foreground p-8 text-center">Loading items...</div>;
    }

    if (items.length === 0) {
      return (
        <div className="text-sm text-muted-foreground p-8 text-center">
          No items yet. Drop files to add them to this space!
        </div>
      );
    }

    switch (viewMode) {
      case 'carousel':
        return renderCarouselView();
      case 'icon':
        return renderIconView();
      case 'list':
        return renderListView();
      case 'tile':
        return renderTileView();
      default:
        return renderCarouselView();
    }
  };

  return (
    <>
      <div className="fixed top-20 left-0 right-0 z-40 flex items-start justify-center pt-4" style={{ bottom: 'calc(12.5vh + 6rem)' }}>
        <div ref={panelRef} className="relative z-10 w-[85vw] max-w-4xl h-full max-h-full pointer-events-auto">
          <div className="w-full h-full glass-card rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl bg-black/40">
            {/* Header with View Selector */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              {view === 'items' && (
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'tile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('tile')}
                  >
                    <Columns className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'icon' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('icon')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'carousel' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('carousel')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <h2 className="text-lg font-semibold text-foreground ml-auto">
                {view === 'items' ? 'Items' : 'People'}
              </h2>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu for Spaces */}
      {contextMenu && onDeleteSpace && onRenameSpace && onUpdateSpaceDescription && (
        <SpaceContextMenu
          space={contextMenu.space}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          onDelete={onDeleteSpace}
          onRename={onRenameSpace}
          onUpdateDescription={onUpdateSpaceDescription}
          onUpdateThumbnail={onUpdateSpaceThumbnail}
          onReorder={onReorderSpace || (() => {})}
          onToggle360={onToggle360}
          on360AxisChange={on360AxisChange}
          on360VolumeChange={on360VolumeChange}
          on360MuteToggle={on360MuteToggle}
          on360RotationToggle={on360RotationToggle}
          on360RotationSpeedChange={on360RotationSpeedChange}
          on360RotationAxisChange={on360RotationAxisChange}
          position={contextMenu.position}
        />
      )}

      {/* Dial Popup for Files */}
      <DialPopup
        isOpen={showDialPopup}
        item={dialPopupItem}
        onClose={() => setShowDialPopup(false)}
        onUseAsFilters={() => {
          setShowDialPopup(false);
          setDialPopupItem(null);
        }}
        on360Toggle={onItem360Toggle}
      />
    </>
  );
}
