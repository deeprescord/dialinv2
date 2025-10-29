import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { ContentViewer } from './ContentViewer';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { AddOptionsModal } from './AddOptionsModal';
import { DialControlPanel } from './DialControlPanel';
import { CelebrationAnimation } from './CelebrationAnimation';
import { ItemsPeopleBar } from './ItemsPeopleBar';
import { supabase } from '@/integrations/supabase/client';
import { videoCatalog, musicCatalog, friendsPosts, friends } from '@/data/catalogs';
import { Friend, Space } from '@/data/catalogs';
import lobbyBackground from '@/assets/lobby-background.jpg';
import appBackground from '@/assets/app-background.jpg';
import type { HeroHeaderVideoHandle } from './HeroHeaderVideo';

interface HomeViewProps {
  pinnedContacts: Friend[];
  onContactClick: (contact: Friend) => void;
  onMediaClick: (item: any) => void;
  onMediaLongPress: (item: any) => void;
  backgroundImage?: string;
  spaceName?: string;
  spaceDescription?: string;
  isLobby?: boolean;
  show360?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  spaces?: Space[];
  onFilesDrop?: (files: File[], spaceId: string) => void;
  onCreateSpace?: (name: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  onAddOptionSelect?: (optionId: string) => void;
  onOpenAddPanel?: () => void;
  selectedItem?: any;
  onVideoStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
  }) => void;
  heroRef?: React.Ref<HeroHeaderVideoHandle>;
  spaceId?: string;
  onItemClick?: (item: any) => void;
  showItemsBar?: boolean;
  onCloseItemsBar?: () => void;
  itemsPeopleView?: 'items' | 'people';
  onDeleteSpace?: (spaceId: string) => void;
  onRenameSpace?: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription?: (spaceId: string, newDescription: string) => void;
  onUpdateSpaceThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorderSpace?: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360?: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  on360RotationToggle?: (spaceId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (spaceId: string, speed: number) => void;
  on360RotationAxisChange?: (spaceId: string, axis: 'x' | 'y') => void;
}

export function HomeView({ 
  pinnedContacts, 
  onContactClick, 
  onMediaClick, 
  onMediaLongPress,
  backgroundImage,
  spaceName,
  spaceDescription,
  isLobby = false,
  show360 = false,
  xAxisOffset,
  yAxisOffset,
  volume,
  isMuted,
  rotationEnabled,
  rotationSpeed,
  flipHorizontal,
  flipVertical,
  spaces = [],
  onFilesDrop,
  onCreateSpace,
  isAddModalOpen = false,
  onCloseAddModal,
  onAddOptionSelect,
  onOpenAddPanel,
  selectedItem,
  onVideoStateChange,
  heroRef,
  spaceId,
  onItemClick,
  showItemsBar = false,
  onCloseItemsBar,
  itemsPeopleView = 'items',
  onDeleteSpace,
  onRenameSpace,
  onUpdateSpaceDescription,
  onUpdateSpaceThumbnail,
  onReorderSpace,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  on360RotationToggle,
  on360RotationSpeedChange,
  on360RotationAxisChange
}: HomeViewProps) {
  const [localSelectedItem, setLocalSelectedItem] = useState<any>(null);
  const [showDialControlPanel, setShowDialControlPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAddOptionSelect = (optionId: string) => {
    if (onAddOptionSelect) {
      onAddOptionSelect(optionId);
    }
  };

  const handleItemLongPress = (item: any) => {
    setLocalSelectedItem(item);
    setShowDialControlPanel(true);
  };

  const handleDialControlPanelClose = () => {
    setShowDialControlPanel(false);
    setLocalSelectedItem(null);
  };

  const handleDialSaved = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Handle item click from ItemsPeopleBar
  const handleItemClickFromBar = async (item: any) => {
    if (!item) return;

    // Special case: web links should not be signed; use URL directly
    if (item.file_type === 'web') {
      const transformedItem = {
        id: item.id,
        title: item.original_name,
        type: 'web',
        url: item.storage_path,
        thumb: item.thumbnail_path,
        file_type: 'web',
      };
      onItemClick?.(transformedItem);
      return;
    }
    
    // Generate signed URL for regular storage files
    const { data: signedData } = await supabase.storage
      .from('user-files')
      .createSignedUrl(item.storage_path, 3600);
    
    const url = signedData?.signedUrl || '';
    
    // Transform SpaceItem to the format expected by ContentViewer/HeroHeaderVideo
    const transformedItem = {
      id: item.id,
      title: item.original_name,
      type: item.file_type,
      url: url,
      thumb: item.thumbnail_path ? url : undefined,
      duration: item.duration,
      mime_type: item.mime_type,
      storage_path: item.storage_path,
      file_type: item.file_type,
      original_name: item.original_name,
      thumbnail_path: item.thumbnail_path
    };
    
    onItemClick?.(transformedItem);
  };
  // Determine if lobby has a custom uploaded background (disable default video when true)
  const hasCustomBackground = isLobby && typeof backgroundImage === 'string' && (
    backgroundImage.startsWith('http') ||
    backgroundImage.startsWith('data:') ||
    backgroundImage.includes('/object/public/space-covers/')
  );
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-32"
    >
      {/* Items Bar - Fixed above space bar, floating over hero */}
      {!isLobby && showItemsBar && (
        <ItemsPeopleBar
          view={itemsPeopleView}
          spaceId={spaceId}
          onItemClick={handleItemClickFromBar}
          onClose={onCloseItemsBar}
        />
      )}

      {/* Hero Header - Show ContentViewer for files (excluding web links and PDFs), otherwise HeroHeaderVideo */}
      {selectedItem?.storage_path && (selectedItem?.type !== 'web' && selectedItem?.file_type !== 'web' && selectedItem?.file_type !== 'document' && selectedItem?.mime_type !== 'application/pdf') ? (
        <ContentViewer
          ref={heroRef as any}
          content={{
            id: selectedItem.id || selectedItem.thumb,
            storage_path: selectedItem.storage_path,
            file_type: selectedItem.file_type || (selectedItem.artist ? 'audio' : 'video'),
            mime_type: selectedItem.mime_type,
            original_name: selectedItem.title || selectedItem.name || 'Untitled',
            thumbnail_path: selectedItem.thumbnail_path || selectedItem.thumb,
            duration: selectedItem.duration
          }}
          onClose={() => {
            setLocalSelectedItem(null);
            // Also clear the parent's selected item if the handler is available
            onMediaClick?.(null);
          }}
        />
      ) : (
        <HeroHeaderVideo
           ref={heroRef as any}
           videoSrc={selectedItem?.duration && !selectedItem?.artist ? selectedItem?.thumb : (isLobby && !hasCustomBackground && !show360 ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined)}
           posterSrc={selectedItem?.thumb || selectedItem?.art || backgroundImage || "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"}
           title={isLobby ? "" : (selectedItem?.title || selectedItem?.name || spaceName || "")}
           subtitle={isLobby ? "" : (selectedItem?.artist || selectedItem?.type || spaceDescription || "")}
           backgroundImage={selectedItem?.thumb || selectedItem?.art || backgroundImage || (isLobby ? "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png" : "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png")}
           skyboxSrc={show360 ? (backgroundImage || (isLobby ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined)) : undefined}
           showVideo={selectedItem?.duration && !selectedItem?.artist ? true : (isLobby && !hasCustomBackground && !show360)}
           show360={show360}
           xAxisOffset={xAxisOffset}
           yAxisOffset={yAxisOffset}
           volume={volume}
           isMuted={isMuted}
           rotationEnabled={rotationEnabled}
           rotationSpeed={rotationSpeed}
           flipHorizontal={flipHorizontal}
           flipVertical={flipVertical}
           webUrl={(selectedItem?.type === 'web' || selectedItem?.file_type === 'web') ? (selectedItem?.url || selectedItem?.storage_path) : 
                   (selectedItem?.file_type === 'document' || selectedItem?.mime_type === 'application/pdf') ? selectedItem?.url : undefined}
           onOpenAddPanel={onOpenAddPanel}
           onVideoStateChange={onVideoStateChange}
         />
      )}


      <AddOptionsModal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal || (() => {})}
        onOptionSelect={handleAddOptionSelect}
      />

      <DialControlPanel
        isOpen={showDialControlPanel}
        item={selectedItem}
        onClose={handleDialControlPanelClose}
        onSelect={() => {}}
        onDialSaved={handleDialSaved}
      />

      <CelebrationAnimation isVisible={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Items/People Bar */}
      {showItemsBar && (
        <ItemsPeopleBar
          view={itemsPeopleView}
          spaceId={spaceId}
          onItemClick={onItemClick}
          onClose={onCloseItemsBar}
          onDeleteSpace={onDeleteSpace}
          onRenameSpace={onRenameSpace}
          onUpdateSpaceDescription={onUpdateSpaceDescription}
          onUpdateSpaceThumbnail={onUpdateSpaceThumbnail}
          onReorderSpace={onReorderSpace}
          onToggle360={onToggle360}
          on360AxisChange={on360AxisChange}
          on360VolumeChange={on360VolumeChange}
          on360MuteToggle={on360MuteToggle}
          on360RotationToggle={on360RotationToggle}
          on360RotationSpeedChange={on360RotationSpeedChange}
          on360RotationAxisChange={on360RotationAxisChange}
        />
      )}
    </motion.div>
  );
}