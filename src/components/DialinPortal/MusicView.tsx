import React from 'react';
import { motion } from 'framer-motion';
import { FeaturedMusicHeader } from './FeaturedMusicHeader';
import { DialsBarCompact } from './DialsBarCompact';
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
  const featuredMusic = music[0];
  const remainingMusic = music.slice(1);
  
  const musicGridItems = remainingMusic.map(item => ({
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
      {/* Featured Music Header */}
      {featuredMusic && (
        <FeaturedMusicHeader
          music={featuredMusic}
          onMusicClick={onMusicClick}
        />
      )}

      <SelectedChips 
        selectedDials={selectedDials}
        onRemoveChip={(groupKey, option) => onDialToggle(groupKey, option)}
      />

      <DialsBarCompact
        dialGroups={MUSIC_GROUPS}
        selectedDials={selectedDials}
        onDialToggle={onDialToggle}
        onClearAll={onClearAll}
      />

      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">More Music</h2>
      </div>

      <MediaGrid
        items={musicGridItems}
        onItemClick={onMusicClick}
        onItemLongPress={onMusicLongPress}
      />
    </motion.div>
  );
}