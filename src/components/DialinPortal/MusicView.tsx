import React from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { CompactFilterHeader } from './CompactFilterHeader';
import { MediaGrid } from './MediaGrid';
import { MusicItem } from '@/data/catalogs';
import { MUSIC_FILTERS } from '@/data/constants';

interface MusicViewProps {
  music: MusicItem[];
  selectedDials: Record<string, string[]>;
  onDialToggle: (groupKey: string, option: string) => void;
  onClearAll: () => void;
  onMusicClick: (music: MusicItem) => void;
  onMusicLongPress: (music: MusicItem) => void;
}

export function MusicView({
  music,
  selectedDials,
  onDialToggle,
  onClearAll,
  onMusicClick,
  onMusicLongPress
}: MusicViewProps) {
  const musicGridItems = music.map(item => ({
    ...item,
    thumb: item.art,
    sharedBy: item.artist,
    sharedByAvatar: undefined
  }));

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
        title="Music"
        subtitle="Discover your sound"
        backgroundImage="/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"
        showVideo={false}
      />

      <div className="mt-8">
        <CompactFilterHeader
          filters={MUSIC_FILTERS}
          selectedFilters={selectedDials}
          onFilterChange={handleFilterChange}
          onClearAll={onClearAll}
          title="Filters"
          subtitle="Refine your music discovery"
        />

        <MediaGrid
          items={musicGridItems}
          onItemClick={onMusicClick}
          onItemLongPress={onMusicLongPress}
        />
      </div>
    </motion.div>
  );
}