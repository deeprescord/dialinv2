import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card } from '../ui/card';
import { ImageFallback } from '../ui/image-fallback';

interface GridItem {
  id: string;
  title: string;
  thumb: string;
  sharedBy?: string;
  sharedByAvatar?: string;
  duration?: string;
  artist?: string;
  distance?: string;
}

interface MediaGridProps {
  items: GridItem[];
  onItemClick: (item: any) => void;
  onItemLongPress?: (item: any) => void;
}

export function MediaGrid({ items, onItemClick, onItemLongPress }: MediaGridProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const handleMouseDown = (item: GridItem) => {
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

  const handleClick = (item: GridItem) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      setIsPressed(null);
    }
    onItemClick(item);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card 
            className={`glass-card hover:bg-white/10 cursor-pointer transition-all duration-200 overflow-hidden group hover-lift ${
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
                className="w-full h-32 sm:h-40 object-cover"
              />
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {item.duration}
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.sharedBy || item.artist || item.distance || ''}
                  </p>
                </div>
                {item.sharedByAvatar && (
                  <Avatar className="h-6 w-6 flex-shrink-0">
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
  );
}