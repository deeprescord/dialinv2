import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { friends } from '@/data/catalogs';
import { FileText, Music, Video, Image as ImageIcon, File } from 'lucide-react';
import { ImageFallback } from '@/components/ui/image-fallback';

interface ItemsPeopleBarProps {
  scale?: number;
  view: 'items' | 'people';
  spaceId?: string;
  onItemClick?: (item: any) => void;
}

export function ItemsPeopleBar({ scale = 30, view, spaceId, onItemClick }: ItemsPeopleBarProps) {
  const { items, loading } = useSpaceItems(spaceId);

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

  return (
    <div className="mb-4 relative">
      <div className="relative" style={{ padding: `${padding}px` }}>
        {/* Scrollable Items/People List */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-center" style={{ gap: `${spacing}px` }}>
            {view === 'items' ? (
              loading ? (
                <div className="text-sm text-muted-foreground p-4">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4">
                  No items yet. Drop files to add them to this space!
                </div>
              ) : (
                items.map((item, index) => {
                  const thumbnail = thumbUrls[item.id];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex-shrink-0"
                    >
                      <div 
                        className="cursor-pointer group flex flex-col items-center gap-2"
                        onClick={() => handleItemClick(item)}
                      >
                        <div
                          className="rounded-lg overflow-hidden group-hover:scale-105 transition-transform border border-white/10 relative bg-muted/50 flex items-center justify-center"
                          style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                        >
                          {thumbnail ? (
                            <ImageFallback 
                              src={thumbnail}
                              alt={item.original_name}
                              className="w-full h-full object-cover"
                              role="button"
                              tabIndex={0}
                              onClick={() => handleItemClick(item)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(item); }}
                            />
                          ) : (
                            getFileIcon(item.file_type)
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground/80 max-w-full truncate px-2">
                          {item.original_name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )
            ) : (
              friends.map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-shrink-0"
                >
                  <div className="cursor-pointer group flex flex-col items-center gap-2">
                    <div
                      className="rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 bg-muted/50 flex items-center justify-center relative"
                      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                    >
                      <img 
                        src={person.avatar} 
                        alt={person.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                      {/* Status indicator - bottom right corner */}
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
