import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { AddOptionsModal } from './AddOptionsModal';
import { DragDropZone } from './DragDropZone';
import { SpaceSelectionModal } from './SpaceSelectionModal';
import { videoCatalog, musicCatalog, friendsPosts, friends } from '@/data/catalogs';
import { Friend, Space } from '@/data/catalogs';
import lobbyBackground from '@/assets/lobby-background.jpg';
import appBackground from '@/assets/app-background.jpg';

interface HomeViewProps {
  pinnedContacts: Friend[];
  onContactClick: (contact: Friend) => void;
  onMediaClick: (item: any) => void;
  onMediaLongPress: (item: any) => void;
  backgroundImage?: string;
  floorName?: string;
  floorDescription?: string;
  isLobby?: boolean;
  show360?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  spaces?: Space[];
  onFilesDrop?: (files: File[], spaceId: string) => void;
  onCreateSpace?: (name: string) => void;
}

export function HomeView({ 
  pinnedContacts, 
  onContactClick, 
  onMediaClick, 
  onMediaLongPress,
  backgroundImage,
  floorName,
  floorDescription,
  isLobby = false,
  show360 = false,
  xAxisOffset,
  yAxisOffset,
  volume,
  isMuted,
  spaces = [],
  onFilesDrop,
  onCreateSpace
}: HomeViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSpaceSelectionModal, setShowSpaceSelectionModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const handleAddOptionSelect = (optionId: string) => {
    console.log('Selected option:', optionId);
    // TODO: Handle different add options
  };

  const handleFilesDropped = (files: File[]) => {
    setDroppedFiles(files);
    setShowSpaceSelectionModal(true);
  };

  const handleSpaceSelect = (spaceId: string) => {
    if (onFilesDrop && droppedFiles.length > 0) {
      onFilesDrop(droppedFiles, spaceId);
    }
    setShowSpaceSelectionModal(false);
    setDroppedFiles([]);
  };

  const handleCreateNewSpace = (name: string) => {
    if (onCreateSpace) {
      onCreateSpace(name);
      // After creating the space, we'll need to get its ID to add files
      // For now, we'll just close the modal
      setShowSpaceSelectionModal(false);
      setDroppedFiles([]);
    }
  };
  return (
    <DragDropZone onFilesDropped={handleFilesDropped}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pb-32"
      >
      {/* Hero Header */}
      <HeroHeaderVideo
        videoSrc={isLobby ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined}
        posterSrc={backgroundImage || "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"}
        title={floorName || "Lobby"}
        subtitle={floorDescription || "Welcome back"}
        backgroundImage={backgroundImage || (isLobby ? "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png" : "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png")}
        showVideo={isLobby}
        show360={show360}
        xAxisOffset={xAxisOffset}
        yAxisOffset={yAxisOffset}
        volume={volume}
        isMuted={isMuted}
      />

      {isLobby ? (
        <>
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

      <SpaceSelectionModal
        isOpen={showSpaceSelectionModal}
        onClose={() => {
          setShowSpaceSelectionModal(false);
          setDroppedFiles([]);
        }}
        onSpaceSelect={handleSpaceSelect}
        onCreateNewSpace={handleCreateNewSpace}
        spaces={spaces}
        droppedFiles={droppedFiles}
      />
      </motion.div>
    </DragDropZone>
  );
}