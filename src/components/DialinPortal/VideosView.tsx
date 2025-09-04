import React from 'react';
import { motion } from 'framer-motion';
import { FeaturedVideoHeader } from './FeaturedVideoHeader';
import { DialsBarCompact } from './DialsBarCompact';
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
  const featuredVideo = videos[0];
  const remainingVideos = videos.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-40 lg:pt-28 pb-40"
    >
      {/* Featured Video Header */}
      {featuredVideo && (
        <FeaturedVideoHeader
          video={featuredVideo}
          onVideoClick={onVideoClick}
        />
      )}

      <SelectedChips 
        selectedDials={selectedDials}
        onRemoveChip={(groupKey, option) => onDialToggle(groupKey, option)}
      />

      <DialsBarCompact
        dialGroups={VIDEO_GROUPS}
        selectedDials={selectedDials}
        onDialToggle={onDialToggle}
        onClearAll={onClearAll}
      />

      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">More Videos</h2>
      </div>

      <MediaGrid
        items={remainingVideos}
        onItemClick={onVideoClick}
        onItemLongPress={onVideoLongPress}
      />
    </motion.div>
  );
}