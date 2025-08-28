import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Close } from '../icons';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

interface FloatingPlayerProps {
  isVisible: boolean;
  item: {
    id: string;
    title: string;
    artist?: string;
    sharedBy?: string;
    thumb: string;
    duration?: string;
  } | null;
  isPlaying: boolean;
  progress: number;
  onPlay: () => void;
  onPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onExpand: () => void;
  onClose: () => void;
}

export function FloatingPlayer({
  isVisible,
  item,
  isPlaying,
  progress,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
  onExpand,
  onClose
}: FloatingPlayerProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  if (!item) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed z-50 cursor-move"
          style={{ left: position.x, bottom: position.y }}
          drag
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event, info) => {
            setIsDragging(false);
            setPosition({
              x: Math.max(0, Math.min(window.innerWidth - 320, position.x + info.offset.x)),
              y: Math.max(0, Math.min(window.innerHeight - 120, position.y - info.offset.y))
            });
          }}
        >
          <Card className="w-80 glass-card border-white/20 overflow-hidden">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 p-1 h-6 w-6 bg-black/50 hover:bg-black/70"
              onClick={onClose}
            >
              <Close size={12} />
            </Button>

            {/* Content */}
            <div className="flex items-center p-3">
              <img
                src={item.thumb}
                alt={item.title}
                className="w-12 h-12 rounded object-cover flex-shrink-0"
              />
              
              <div className="flex-1 mx-3 min-w-0">
                <h3 className="font-medium text-sm truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {item.artist || item.sharedBy}
                </p>
                <Progress value={progress} className="h-1 mt-2" />
              </div>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={onSkipBack}>
                  <SkipBack size={14} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-8 w-8" 
                  onClick={isPlaying ? onPause : onPlay}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </Button>
                
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={onSkipForward}>
                  <SkipForward size={14} />
                </Button>
                
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={onExpand}>
                  <Maximize2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}