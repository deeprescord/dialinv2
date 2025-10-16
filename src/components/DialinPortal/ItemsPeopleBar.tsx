import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { friends } from '@/data/catalogs';
import { FileText, Music, Video, Image as ImageIcon, File } from 'lucide-react';

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

  // Get thumbnail URL from storage
  const getItemThumbnail = (item: any) => {
    if (item.thumbnail_path) {
      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(item.thumbnail_path);
      return data.publicUrl;
    }
    
    if (item.file_type === 'image') {
      const { data } = supabase.storage
        .from('user-files')
        .getPublicUrl(item.storage_path);
      return data.publicUrl;
    }
    
    return null;
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
                  const thumbnail = getItemThumbnail(item);
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
                        onClick={() => onItemClick?.(item)}
                      >
                        <div
                          className="rounded-lg overflow-hidden group-hover:scale-105 transition-transform border border-white/10 relative bg-muted/50 flex items-center justify-center"
                          style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                        >
                          {thumbnail ? (
                            <img 
                              src={thumbnail}
                              alt={item.original_name}
                              className="w-full h-full object-cover"
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
