import React from 'react';
import { motion } from 'framer-motion';
import { DialsBar } from './DialsBar';
import { SelectedChips } from './SelectedChips';
import { MediaGrid } from './MediaGrid';
import { VideoItem } from '@/data/catalogs';
import { VIDEO_GROUPS, DialGroup } from '@/data/constants';

interface VideosViewProps {
  videos: VideoItem[];
  selectedDials: Record<string, string[]>;
  onDialToggle: (groupKey: string, option: string) => void;
  onClearAll: () => void;
  onVideoClick: (video: VideoItem) => void;
  onVideoLongPress: (video: VideoItem) => void;
}

export function VideosView({
  videos,
  selectedDials,
  onDialToggle,
  onClearAll,
  onVideoClick,
  onVideoLongPress
}: VideosViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-40 lg:pt-28 pb-20"
    >
      <SelectedChips 
        selectedDials={selectedDials}
        onRemoveChip={(groupKey, option) => onDialToggle(groupKey, option)}
      />

      <DialsBar
        dialGroups={VIDEO_GROUPS}
        selectedDials={selectedDials}
        onDialToggle={onDialToggle}
        onClearAll={onClearAll}
      />

      <MediaGrid
        items={videos}
        onItemClick={onVideoClick}
        onItemLongPress={onVideoLongPress}
      />
    </motion.div>
  );
}