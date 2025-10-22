import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { friends } from '@/data/catalogs';
import { FileText, Music, Video, Image as ImageIcon, File, LayoutGrid, List, Grid3x3, Columns } from 'lucide-react';
import { ImageFallback } from '@/components/ui/image-fallback';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItemsPeopleBarProps {
  scale?: number;
  view: 'items' | 'people';
  spaceId?: string;
  onItemClick?: (item: any) => void;
}

type ViewMode = 'carousel' | 'icon' | 'list' | 'tile';

export function ItemsPeopleBar({ scale = 30, view, spaceId, onItemClick }: ItemsPeopleBarProps) {
  const { items, loading } = useSpaceItems(spaceId);
  const [viewMode, setViewMode] = useState<ViewMode>('carousel');

  // Scale-responsive sizing (reduced by 25%)
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const cardWidth = getScaled(150);
  const cardHeight = getScaled(180);
  const spacing = getScaled(12);
  const padding = getScaled(16);

  // Get icon for file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-12 h-12 text-primary" />;
      case 'video': return <Video className="w-12 h-12 text-primary" />;
      case 'audio': return <Music className="w-12 h-12 text-primary" />;
      case 'document': return <FileText className="w-12 h-12 text-primary" />;
      default: return <File className="w-12 h-12 text-primary" />;
    }
  };

  // Signed thumbnail URLs for private bucket
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const loadThumbs = async () => {
      if (!items?.length) return;
      const pairs = await Promise.all(
        items.map(async (item) => {
          const path = item.thumbnail_path || item.storage_path;
          if (!path) return [item.id, null] as const;
          // Prefer signed URL (bucket 'user-files' is private)
          const { data, error } = await supabase.storage
            .from('user-files')
            .createSignedUrl(path, 3600);
          if (error) {
            const { data: pub } = supabase.storage
              .from('user-files')
              .getPublicUrl(path);
            return [item.id, pub.publicUrl] as const;
          }
          return [item.id, data.signedUrl] as const;
        })
      );
      if (!cancelled) {
        setThumbUrls((prev) => {
          const next = { ...prev };
          for (const [id, url] of pairs) {
            if (url) next[id] = url;
          }
          return next;
        });
      }
    };
    loadThumbs();
    return () => {
      cancelled = true;
    };
  }, [items]);

  // Handle item click with proper transformation
  const handleItemClick = async (item: any) => {
    if (!onItemClick) return;
    
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
  };

  const renderCarouselView = () => (
    <Carousel className="w-full max-w-5xl mx-auto">
      <CarouselContent>
        {items.map((item, index) => {
          const thumbnail = thumbUrls[item.id];
          return (
            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-4">
                <div 
                  className="cursor-pointer group flex flex-col items-center gap-3"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="rounded-xl overflow-hidden group-hover:scale-105 transition-transform border border-white/20 relative bg-muted/50 flex items-center justify-center w-full aspect-square">
                    {thumbnail ? (
                      <ImageFallback 
                        src={thumbnail}
                        alt={item.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(item.file_type)
                    )}
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
              <div className="rounded overflow-hidden border border-white/10 bg-muted/50 flex items-center justify-center w-16 h-16 flex-shrink-0">
                {thumbnail ? (
                  <ImageFallback 
                    src={thumbnail}
                    alt={item.original_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8">{getFileIcon(item.file_type)}</div>
                )}
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
        <div className="overflow-x-auto scrollbar-thin p-4">
          <div className="flex items-center gap-4">
            {friends.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-shrink-0"
              >
                <div className="cursor-pointer group flex flex-col items-center gap-2">
                  <div className="rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 bg-muted/50 flex items-center justify-center relative w-32 h-32">
                    <img 
                      src={person.avatar} 
                      alt={person.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                    <div 
                      className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white ${
                        person.status === 'online' ? 'bg-green-500' : 
                        person.status === 'away' ? 'bg-yellow-500' : 
                        'bg-gray-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground/80 max-w-full truncate px-2">
                    {person.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
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
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="w-full max-w-6xl mx-auto pointer-events-auto">
        <div className="glass-card rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header with View Selector */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-foreground">
              {view === 'items' ? 'Items' : 'People'}
            </h2>
            {view === 'items' && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'carousel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('carousel')}
                >
                  <Columns className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'icon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('icon')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'tile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tile')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="min-h-[300px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
