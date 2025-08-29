import React from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { videoCatalog, musicCatalog, friendsPosts, friends } from '@/data/catalogs';
import { Friend } from '@/data/catalogs';

interface HomeViewProps {
  pinnedContacts: Friend[];
  onContactClick: (contact: Friend) => void;
  onMediaClick: (item: any) => void;
  onMediaLongPress: (item: any) => void;
  backgroundImage?: string;
  floorName?: string;
}

export function HomeView({ 
  pinnedContacts, 
  onContactClick, 
  onMediaClick, 
  onMediaLongPress,
  backgroundImage,
  floorName 
}: HomeViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Header */}
      <HeroHeaderVideo
        videoSrc="https://dialin.io/s/Skull-2.mp4"
        posterSrc="/media/lobby-poster.png"
        title={floorName || "Lobby"}
        subtitle="Welcome back"
        backgroundImage={backgroundImage}
      />

      {/* Pinned Contacts */}
      <PinnedContactsRow 
        contacts={pinnedContacts}
        onContactClick={onContactClick}
      />

      {/* Content Rows */}
      <MediaRow
        title="FRIENDS"
        items={friendsPosts}
        onItemClick={onMediaClick}
        onItemLongPress={onMediaLongPress}
      />

      <MediaRow
        title="VIDEOS"
        items={videoCatalog.slice(0, 8)}
        onItemClick={onMediaClick}
        onItemLongPress={onMediaLongPress}
      />

      <MediaRow
        title="MUSIC"
        items={musicCatalog.slice(0, 6).map(item => ({
          ...item,
          thumb: item.art,
          sharedBy: item.artist,
          sharedByAvatar: undefined
        }))}
        onItemClick={onMediaClick}
        onItemLongPress={onMediaLongPress}
      />
    </motion.div>
  );
}