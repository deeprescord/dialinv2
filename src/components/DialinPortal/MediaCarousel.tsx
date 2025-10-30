import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaCarouselProps {
  items: string[];
  mediaTypes: ('image' | 'video')[];
  onSelect: (url: string) => void;
  onRemove: (index: number) => void;
  selectedUrl?: string;
}

export function MediaCarousel({ items, mediaTypes, onSelect, onRemove, selectedUrl }: MediaCarouselProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-white/40">
        No media uploaded yet
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {items.map((url, index) => (
        <motion.div
          key={url}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group shrink-0"
        >
          <button
            onClick={() => onSelect(url)}
            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              selectedUrl === url
                ? 'border-primary shadow-lg shadow-primary/50'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            {mediaTypes[index] === 'video' ? (
              <video
                src={url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="none"
              />
            ) : (
              <img
                src={url}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            {mediaTypes[index] === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5" />
                </div>
              </div>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
