import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { AddOptionsModal } from './AddOptionsModal';
import { videoCatalog, musicCatalog, friendsPosts, friends } from '@/data/catalogs';
import { Friend } from '@/data/catalogs';

interface HomeViewProps {
  pinnedContacts: Friend[];
  onContactClick: (contact: Friend) => void;
  onMediaClick: (item: any) => void;
  onMediaLongPress: (item: any) => void;
  backgroundImage?: string;
  floorName?: string;
  isLobby?: boolean;
}

export function HomeView({ 
  pinnedContacts, 
  onContactClick, 
  onMediaClick, 
  onMediaLongPress,
  backgroundImage,
  floorName,
  isLobby = false
}: HomeViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddOptionSelect = (optionId: string) => {
    console.log('Selected option:', optionId);
    // TODO: Handle different add options
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
        videoSrc={isLobby ? "https://dialin.io/s/Skull-2.mp4" : undefined}
        posterSrc="/media/lobby-poster.png"
        title={floorName || "Lobby"}
        subtitle="Welcome back"
        backgroundImage={backgroundImage}
        showVideo={isLobby}
      />

      {isLobby ? (
        <>
          {/* Pinned Contacts */}
          <PinnedContactsRow 
            contacts={pinnedContacts}
            onContactClick={onContactClick}
          />

          {/* Content Rows */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">FRIENDS</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <span className="text-lg font-semibold">+</span>
              </button>
            </div>
          </div>

          <MediaRow
            title=""
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
        </>
      ) : (
        <>
          {/* Shared With */}
          <PinnedContactsRow 
            contacts={pinnedContacts.slice(0, 3)}
            onContactClick={onContactClick}
            title="Shared With"
          />

          {/* Contents Section */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Contents</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <span className="text-lg font-semibold">+</span>
              </button>
            </div>
          </div>

          <MediaRow
            title=""
            items={[...friendsPosts.slice(0, 4), ...videoCatalog.slice(0, 4)]}
            onItemClick={onMediaClick}
            onItemLongPress={onMediaLongPress}
          />
        </>
      )}

      <AddOptionsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOptionSelect={handleAddOptionSelect}
      />
    </motion.div>
  );
}