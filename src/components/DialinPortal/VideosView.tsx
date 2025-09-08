import React from 'react';
import { motion } from 'framer-motion';
import { CompactFilterHeader } from './CompactFilterHeader';
import { MediaGrid } from './MediaGrid';
import { VideoItem } from '@/data/catalogs';
import { VIDEO_FILTERS, DialGroup } from '@/data/constants';

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
  const handleFilterChange = (filterKey: string, values: string[]) => {
    // Clear current selection for this filter
    const currentSelection = selectedDials[filterKey] || [];
    currentSelection.forEach(value => {
      onDialToggle(filterKey, value);
    });
    
    // Add new selections
    values.forEach(value => {
      if (!currentSelection.includes(value)) {
        onDialToggle(filterKey, value);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-32"
    >
      <CompactFilterHeader
        filters={VIDEO_FILTERS}
        selectedFilters={selectedDials}
        onFilterChange={handleFilterChange}
        onClearAll={onClearAll}
        title="Videos"
        subtitle="Explore visual stories"
      />

      <MediaGrid
        items={videos}
        onItemClick={onVideoClick}
        onItemLongPress={onVideoLongPress}
      />
    </motion.div>
  );
}