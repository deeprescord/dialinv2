import React from 'react';
import { motion } from 'framer-motion';
import { DialsBar } from './DialsBar';
import { SelectedChips } from './SelectedChips';
import { MediaGrid } from './MediaGrid';
import { MusicItem } from '@/data/catalogs';
import { MUSIC_GROUPS } from '@/data/constants';

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
        dialGroups={MUSIC_GROUPS}
        selectedDials={selectedDials}
        onDialToggle={onDialToggle}
        onClearAll={onClearAll}
      />

      <MediaGrid
        items={musicGridItems}
        onItemClick={onMusicClick}
        onItemLongPress={onMusicLongPress}
      />
    </motion.div>
  );
}