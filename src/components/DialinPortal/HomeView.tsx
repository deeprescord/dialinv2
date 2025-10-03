import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { AddOptionsModal } from './AddOptionsModal';
import { DragDropZone } from './DragDropZone';
import { SpaceSelectionModal } from './SpaceSelectionModal';
import { AuthModal } from './AuthModal';
import { DialControlPanel } from './DialControlPanel';
import { CelebrationAnimation } from './CelebrationAnimation';
import { useSpaces } from '@/hooks/useSpaces';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
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
  spaceName?: string;
  spaceDescription?: string;
  isLobby?: boolean;
  show360?: boolean;
  xAxisOffset?: number;
  yAxisOffset?: number;
  volume?: number;
  isMuted?: boolean;
  spaces?: Space[];
  onFilesDrop?: (files: File[], spaceId: string) => void;
  onCreateSpace?: (name: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  onAddOptionSelect?: (optionId: string) => void;
  onOpenAddPanel?: () => void;
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
  spaces = [],
  onFilesDrop,
  onCreateSpace,
  isAddModalOpen = false,
  onCloseAddModal,
  onAddOptionSelect,
  onOpenAddPanel
}: HomeViewProps) {
  const [showSpaceSelectionModal, setShowSpaceSelectionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDialControlPanel, setShowDialControlPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const { spaces: userSpaces, createSpace, loading: spacesLoading } = useSpaces();
  const { uploadMultipleFiles, uploading } = useFileUpload();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddOptionSelect = (optionId: string) => {
    if (onAddOptionSelect) {
      onAddOptionSelect(optionId);
    }
  };


  const handleFilesDropped = (files: File[]) => {
    if (!user) {
      setShowAuthModal(true);
      setDroppedFiles(files); // Store files for after auth
      return;
    }
    
    setDroppedFiles(files);
    setShowSpaceSelectionModal(true);
  };

  const handleSpaceSelect = async (spaceId: string, autoDetectedDials?: any[]) => {
    try {
      if (droppedFiles.length > 0) {
        await uploadMultipleFiles(droppedFiles, spaceId);
        if (onFilesDrop) {
          onFilesDrop(droppedFiles, spaceId);
        }
        
        // If auto-detected dials were provided, save them and show celebration
        if (autoDetectedDials && autoDetectedDials.length > 0) {
          // TODO: Save auto-detected dials to the database for this space
          console.log('Auto-detected dials to save:', autoDetectedDials, 'for space:', spaceId);
          toast.success(`Files saved to space with ${autoDetectedDials.length} auto-detected dials!`);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        } else {
          toast.success('Files saved to space!');
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to save files to space');
    } finally {
      setShowSpaceSelectionModal(false);
      setDroppedFiles([]);
    }
  };

  const handleCreateNewSpace = async (name: string, autoDetectedDials?: any[]) => {
    const newSpace = await createSpace(name);
    if (newSpace && droppedFiles.length > 0) {
      await handleSpaceSelect(newSpace.id, autoDetectedDials);
    } else {
      setShowSpaceSelectionModal(false);
      setDroppedFiles([]);
    }
    if (onCreateSpace) {
      onCreateSpace(name);
    }
  };

  const handleAuthSuccess = () => {
    // User is now authenticated, continue with file drop if files were dropped
    if (droppedFiles.length > 0) {
      setShowSpaceSelectionModal(true);
    }
  };

  const handleItemLongPress = (item: any) => {
    setSelectedItem(item);
    setShowDialControlPanel(true);
  };

  const handleDialControlPanelClose = () => {
    setShowDialControlPanel(false);
    setSelectedItem(null);
  };

  const handleDialSaved = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
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
        title={spaceName || "Lobby"}
        subtitle={spaceDescription || "Welcome back"}
        backgroundImage={backgroundImage || (isLobby ? "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png" : "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png")}
        showVideo={isLobby}
        show360={show360}
        xAxisOffset={xAxisOffset}
        yAxisOffset={yAxisOffset}
        volume={volume}
        isMuted={isMuted}
        onOpenAddPanel={onOpenAddPanel}
      />

      {isLobby ? (
        <>
          {/* Who's Here */}
          <div className="px-4 mb-2 mt-1">
            <h2 className="text-lg font-medium mb-2">Who's Here</h2>
          </div>
          
          <PinnedContactsRow 
            contacts={pinnedContacts.slice(0, 3)}
            onContactClick={onContactClick}
            title=""
          />

          {/* Items Section */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Items</h2>
            </div>
          </div>

          <MediaRow
            title=""
            items={[...friendsPosts.slice(0, 4), ...videoCatalog.slice(0, 4)]}
            onItemClick={onMediaClick}
            onItemLongPress={handleItemLongPress}
          />
        </>
      ) : (
        <>
          {/* Who's Here */}
          <div className="px-4 mb-2 mt-1">
            <h2 className="text-lg font-medium mb-2">Who's Here</h2>
          </div>
          
          <PinnedContactsRow 
            contacts={pinnedContacts.slice(0, 3)}
            onContactClick={onContactClick}
            title=""
          />

          {/* Items Section */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Items</h2>
            </div>
          </div>

          <MediaRow
            title=""
            items={[...friendsPosts.slice(0, 4), ...videoCatalog.slice(0, 4)]}
            onItemClick={onMediaClick}
            onItemLongPress={handleItemLongPress}
          />
        </>
      )}

      <AddOptionsModal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal || (() => {})}
        onOptionSelect={handleAddOptionSelect}
        onUploadClick={handleFilesDropped}
      />

      <SpaceSelectionModal
        isOpen={showSpaceSelectionModal}
        onClose={() => {
          setShowSpaceSelectionModal(false);
          setDroppedFiles([]);
        }}
        onSpaceSelect={handleSpaceSelect}
        onCreateNewSpace={handleCreateNewSpace}
        spaces={userSpaces.map(space => ({
          id: space.id,
          name: space.name,
          fileCount: 0, // TODO: Add file count query
        }))}
        footerSpaces={[
          { id: 'lobby', name: 'Lobby' },
          { id: 'music-den', name: 'Music Den' },
          { id: 'locations', name: 'Locations' },
          { id: 'friends', name: 'Friends' }
        ]}
        floors={[
          { id: 'floor-1', name: 'Floor 1' },
          { id: 'floor-2', name: 'Floor 2' },
          { id: 'floor-3', name: 'Floor 3' },
          { id: 'floor-4', name: 'Floor 4' },
          { id: 'floor-5', name: 'Floor 5' }
        ]}
        droppedFiles={droppedFiles}
        loading={spacesLoading || uploading}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      <DialControlPanel
        isOpen={showDialControlPanel}
        item={selectedItem}
        onClose={handleDialControlPanelClose}
        onSelect={() => {}}
        onDialSaved={handleDialSaved}
      />

      <CelebrationAnimation isVisible={showCelebration} onComplete={() => setShowCelebration(false)} />
      </motion.div>
    </DragDropZone>
  );
}