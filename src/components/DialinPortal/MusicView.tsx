import React from 'react';
import { motion } from 'framer-motion';
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
      <CompactFilterHeader
        filters={MUSIC_FILTERS}
        selectedFilters={selectedDials}
        onFilterChange={handleFilterChange}
        onClearAll={onClearAll}
        title="Music"
        subtitle="Discover your sound"
      />

      <MediaGrid
        items={musicGridItems}
        onItemClick={onMusicClick}
        onItemLongPress={onMusicLongPress}
      />
    </motion.div>
  );
}