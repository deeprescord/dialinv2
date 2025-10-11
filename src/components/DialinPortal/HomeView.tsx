import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { ContentViewer } from './ContentViewer';
import { PinnedContactsRow } from './PinnedContactsRow';
import { MediaRow } from './MediaRow';
import { AddOptionsModal } from './AddOptionsModal';
import { DragDropZone } from './DragDropZone';
import { MetadataAdjustmentPanel } from './MetadataAdjustmentPanel';
import { AuthModal } from './AuthModal';
import { DialControlPanel } from './DialControlPanel';
import { CelebrationAnimation } from './CelebrationAnimation';
import { UploadLoader } from './UploadLoader';
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
  selectedItem?: any;
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
  onOpenAddPanel,
  selectedItem
}: HomeViewProps) {
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<any>(null);
  const [localSelectedItem, setLocalSelectedItem] = useState<any>(null);
  const [showDialControlPanel, setShowDialControlPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [aiMetadata, setAiMetadata] = useState<any>(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);

  const { spaces: userSpaces, createSpace, loading: spacesLoading } = useSpaces();
  const { uploadMultipleFiles, uploading, analyzingWithAI } = useFileUpload();

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


  const handleFilesDropped = async (files: File[]) => {
    if (!user) {
      setShowAuthModal(true);
      setDroppedFiles(files); // Store files for after auth
      return;
    }
    
    setDroppedFiles(files);
    setAnalyzingFile(true);
    
    // Analyze the first file with AI if it's an image
    const firstFile = files[0];
    if (firstFile.type.startsWith('image/')) {
      try {
        // Convert image to base64
        const reader = new FileReader();
        const imageDataPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(firstFile);
        });
        
        const imageData = await imageDataPromise;
        
        // Call analyze-item function with image data
        const { data, error } = await supabase.functions.invoke('analyze-item', {
          body: {
            fileId: 'temp-' + Date.now(),
            fileName: firstFile.name,
            fileType: firstFile.type.split('/')[0],
            mimeType: firstFile.type,
            imageData
          }
        });
        
        if (!error && data) {
          setAiMetadata(data);
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
        toast.error('Failed to analyze image');
      }
    }
    
    setAnalyzingFile(false);
    setShowMetadataPanel(true);
  };

  const handleMetadataSave = async (metadata: {
    hashtags: string[];
    dialValues: Record<string, any>;
    selectedSpaceId: string;
    location?: { lat: number; lng: number; address?: string };
  }) => {
    try {
      if (droppedFiles.length > 0) {
        await uploadMultipleFiles(droppedFiles, metadata.selectedSpaceId);
        if (onFilesDrop) {
          onFilesDrop(droppedFiles, metadata.selectedSpaceId);
        }
        
        // Show celebration with dial values
        const dialCount = Object.keys(metadata.dialValues).length;
        if (dialCount > 0) {
          toast.success(`Files saved with ${dialCount} dial${dialCount > 1 ? 's' : ''} and ${metadata.hashtags.length} hashtag${metadata.hashtags.length !== 1 ? 's' : ''}!`);
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
      setShowMetadataPanel(false);
      setDroppedFiles([]);
    }
  };

  const handleCreateNewSpace = async (name: string, parentId: string): Promise<void> => {
    const newSpace = await createSpace(name);
    if (onCreateSpace) {
      onCreateSpace(name);
    }
  };

  const handleAuthSuccess = () => {
    // User is now authenticated, continue with file drop if files were dropped
    if (droppedFiles.length > 0) {
      setShowMetadataPanel(true);
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
  return (
    <DragDropZone onFilesDropped={handleFilesDropped}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pb-32"
      >
      {/* Hero Header - Show ContentViewer if item has file data, otherwise show HeroHeaderVideo */}
      {selectedItem?.storage_path ? (
        <ContentViewer
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
          videoSrc={selectedItem?.duration && !selectedItem?.artist ? selectedItem?.thumb : (isLobby ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined)}
          posterSrc={selectedItem?.thumb || selectedItem?.art || backgroundImage || "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"}
          title={isLobby ? "" : (selectedItem?.title || selectedItem?.name || spaceName || "")}
          subtitle={isLobby ? "" : (selectedItem?.artist || selectedItem?.type || spaceDescription || "")}
          backgroundImage={selectedItem?.thumb || selectedItem?.art || backgroundImage || (isLobby ? "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png" : "/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png")}
          showVideo={selectedItem?.duration && !selectedItem?.artist ? true : isLobby}
          show360={show360}
          xAxisOffset={xAxisOffset}
          yAxisOffset={yAxisOffset}
          volume={volume}
          isMuted={isMuted}
          onOpenAddPanel={onOpenAddPanel}
        />
      )}

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

      {showMetadataPanel && droppedFiles.length > 0 && (
        <MetadataAdjustmentPanel
          fileName={droppedFiles[0].name}
          fileType={droppedFiles[0].type}
          initialHashtags={aiMetadata?.hashtags || []}
          initialDialValues={aiMetadata?.dial_values || {}}
          suggestedDials={aiMetadata?.suggested_dials || []}
          suggestedSpaces={aiMetadata?.suggested_spaces || []}
          availableSpaces={userSpaces.map(space => ({
            id: space.id,
            name: space.name,
            parent_id: space.parent_id
          }))}
          confidence={aiMetadata?.confidence || 0}
          isAiGenerated={!!aiMetadata}
          onSave={handleMetadataSave}
          onCancel={() => {
            setShowMetadataPanel(false);
            setDroppedFiles([]);
            setAiMetadata(null);
          }}
          onCreateSpace={handleCreateNewSpace}
        />
      )}

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
      <UploadLoader isUploading={uploading || analyzingWithAI} />
    </DragDropZone>
  );
}