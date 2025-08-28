import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VideoItem, MusicItem, LocationItem, Post } from '@/data/catalogs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card } from '../ui/card';
import { ImageFallback } from '../ui/image-fallback';

interface MediaItem {
  id: string;
  title: string;
  thumb: string;
  sharedBy?: string;
  sharedByAvatar?: string;
  duration?: string;
  artist?: string;
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onItemClick: (item: any) => void;
  onItemLongPress?: (item: any) => void;
}

export function MediaRow({ title, items, onItemClick, onItemLongPress }: MediaRowProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const handleMouseDown = (item: MediaItem) => {
    setIsPressed(item.id);
    if (onItemLongPress) {
      const timer = setTimeout(() => {
        onItemLongPress(item);
        setIsPressed(null);
      }, 550);
      setPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsPressed(null);
  };

  const handleClick = (item: MediaItem) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      setIsPressed(null);
    }
    onItemClick(item);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 px-4">{title}</h2>
      <div className="flex space-x-4 px-4 overflow-x-auto scrollbar-thin pb-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            <Card 
              className={`w-72 glass-card hover:bg-white/10 cursor-pointer transition-all duration-200 overflow-hidden group hover-lift ${
                isPressed === item.id ? 'scale-95' : ''
              }`}
              onMouseDown={() => handleMouseDown(item)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => handleClick(item)}
            >
              <div className="relative">
                <ImageFallback 
                  src={item.thumb} 
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
                {item.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {item.duration}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{item.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {item.sharedBy || item.artist || ''}
                  </span>
                  {item.sharedByAvatar && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.sharedByAvatar} />
                      <AvatarFallback>{item.sharedBy?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}