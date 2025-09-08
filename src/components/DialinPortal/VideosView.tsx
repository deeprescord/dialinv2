import React from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
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
      {/* Hero Header */}
      <HeroHeaderVideo
        posterSrc="/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"
        title="Videos"
        subtitle="Explore visual stories"
        backgroundImage="/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"
        showVideo={false}
      />

      <div className="mt-8">
        <CompactFilterHeader
          filters={VIDEO_FILTERS}
          selectedFilters={selectedDials}
          onFilterChange={handleFilterChange}
          onClearAll={onClearAll}
          title="Filters"
          subtitle="Refine your video discovery"
        />

        <MediaGrid
          items={videos}
          onItemClick={onVideoClick}
          onItemLongPress={onVideoLongPress}
        />
      </div>
    </motion.div>
  );
}