import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';

interface MediaCarouselProps {
  items: string[];
  mediaTypes: ('image' | 'video')[];
  itemIds?: string[];
  onSelect: (url: string) => void;
  onRemove: (index: number) => void;
  onDOSOpen?: (itemId: string) => void;
  selectedUrl?: string;
}

interface MediaCarouselItemProps {
  url: string;
  index: number;
  mediaType: 'image' | 'video';
  itemId?: string;
  onSelect: (url: string) => void;
  onRemove: (index: number) => void;
  onDOSOpen?: (itemId: string) => void;
  isSelected: boolean;
}

function MediaCarouselItem({ url, index, mediaType, itemId, onSelect, onRemove, onDOSOpen, isSelected }: MediaCarouselItemProps) {
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (onDOSOpen && itemId) {
        onDOSOpen(itemId);
      }
    },
    onClick: () => onSelect(url),
    delay: 500
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group shrink-0"
    >
      <div
        {...longPressHandlers}
        className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
          isSelected
            ? 'border-primary shadow-lg shadow-primary/50'
            : 'border-white/10 hover:border-white/30'
        }`}
      >
        {mediaType === 'video' ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              try { e.currentTarget.currentTime = 0.1; } catch {}
            }}
            onSeeked={(e) => {
              try { e.currentTarget.pause(); } catch {}
            }}
          />
        ) : (
          <img
            src={url}
            alt={`Media ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {mediaType === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent ml-0.5" />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </motion.div>
  );
}

export function MediaCarousel({ items, mediaTypes, itemIds, onSelect, onRemove, onDOSOpen, selectedUrl }: MediaCarouselProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-white/40">
        No media uploaded yet
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 px-2">
      {items.map((url, index) => (
        <MediaCarouselItem
          key={url}
          url={url}
          index={index}
          mediaType={mediaTypes[index]}
          itemId={itemIds?.[index]}
          onSelect={onSelect}
          onRemove={onRemove}
          onDOSOpen={onDOSOpen}
          isSelected={selectedUrl === url}
        />
      ))}
    </div>
  );
}
