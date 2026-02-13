import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LayoutGrid, ListVideo, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SortDropdown } from './SortDropdown';
import type { SortOrder } from '@/types/organization';
import { HeroHeaderVideo } from './HeroHeaderVideo';
import { ContentViewer } from './ContentViewer';
import { PinnedContactsRow } from './PinnedContactsRow';
import { ItemsPeopleBar } from './ItemsPeopleBar';
import { MediaRow } from './MediaRow';
import { CreateSpaceModal } from './CreateSpaceModal';
import { DialControlPanel } from './DialControlPanel';
import { CelebrationAnimation } from './CelebrationAnimation';
import { InfiniteScrollView } from './InfiniteScrollView';
import { supabase } from '@/integrations/supabase/client';
import { videoCatalog, musicCatalog, friendsPosts, friends } from '@/data/catalogs';
import { Friend, Space } from '@/data/catalogs';
import lobbyBackground from '@/assets/lobby-background.jpg';
import appBackground from '@/assets/app-background.jpg';
import type { HeroHeaderVideoHandle } from './HeroHeaderVideo';
import { useMediaQueue } from '@/contexts/MediaQueueContext';
import { getAssetUrl } from '@/lib/signedUrl';

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
  onCreateSpace?: (name: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  onAddOptionSelect?: (optionId: string) => void;
  onOpenAddPanel?: () => void;
  onUploadClick?: (files: File[]) => void;
  selectedItem?: any;
  onVideoStateChange?: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
  }) => void;
  onMediaEnd?: () => void;
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
  sortOrder?: SortOrder;
  onSortChange?: (sort: SortOrder) => void;
  movieMode?: boolean;
  onMovieModeToggle?: () => void;
  onItem360Toggle?: (itemId: string, enabled: boolean) => void;
  isPublicSpace?: boolean;
  showPlayAllButton?: boolean;
  onEditMetadata?: (itemId: string) => void;
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
  onCreateSpace,
  isAddModalOpen = false,
  onCloseAddModal,
  onAddOptionSelect,
  onOpenAddPanel,
  onUploadClick,
  selectedItem,
  onVideoStateChange,
  onMediaEnd,
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
  on360RotationAxisChange,
  sortOrder = 'custom',
  onSortChange,
  movieMode = false,
  onMovieModeToggle,
  onItem360Toggle,
  isPublicSpace = false,
  showPlayAllButton = false,
  onEditMetadata
}: HomeViewProps) {
  const { isAutoplay, skipToNext, repeatMode } = useMediaQueue();
  const [localSelectedItem, setLocalSelectedItem] = useState<any>(null);
  const [showDialControlPanel, setShowDialControlPanel] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'infinite'>('grid');
  // PDF URL for hero header (signed if needed)
  const [pdfUrlForHero, setPdfUrlForHero] = useState<string | undefined>(undefined);
  // Signed media URL for item 360 playback in hero
  const [item360UrlForHero, setItem360UrlForHero] = useState<string | undefined>(undefined);

  // Movie mode triggers infinite scroll
  const showInfiniteScroll = movieMode;

  // DEBUG: Log selectedItem changes
  useEffect(() => {
    console.log('🎬 HomeView - selectedItem changed:', selectedItem);
    console.log('🎬 HomeView - selectedItem.storage_path:', selectedItem?.storage_path);
    console.log('🎬 HomeView - selectedItem.url:', selectedItem?.url);
    console.log('🎬 HomeView - selectedItem.file_type:', selectedItem?.file_type);
    console.log('🎬 HomeView - selectedItem.mime_type:', selectedItem?.mime_type);
  }, [selectedItem]);

  useEffect(() => {
    const loadPdfUrl = async () => {
      const si = selectedItem;
      const isPdf =
        !!si &&
        (si?.type === 'document' ||
         si?.file_type === 'document' ||
         si?.mime_type === 'application/pdf' ||
         (typeof si?.storage_path === 'string' && si.storage_path.toLowerCase().endsWith('.pdf')));
      if (!isPdf) {
        setPdfUrlForHero(undefined);
        return;
      }
      // Prefer provided URL
      if (si?.url) {
        setPdfUrlForHero(si.url);
        return;
      }
      if (si?.storage_path) {
        try {
          const url = await getAssetUrl({ path: si.storage_path, fileId: si.id, isPublicView: window.location.pathname.startsWith('/s/') });
          setPdfUrlForHero(url || undefined);
        } catch (e) {
          console.warn('Failed to resolve PDF URL', e);
          setPdfUrlForHero(undefined);
        }
      } else {
        setPdfUrlForHero(undefined);
      }
    };
    loadPdfUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, selectedItem?.url, selectedItem?.storage_path, selectedItem?.mime_type, selectedItem?.file_type, selectedItem?.type]);

  // Load signed media URL for 360 item in hero header
  useEffect(() => {
    const loadItem360Url = async () => {
      const si = selectedItem;
      if (!si || !si.show360) {
        setItem360UrlForHero(undefined);
        return;
      }
      // If the item already has a direct URL (e.g., from ItemsPeopleBar), use it
      if (si.url) {
        setItem360UrlForHero(si.url);
        return;
      }
      // Otherwise, sign the storage path
      if (si.storage_path) {
        try {
          const url = await getAssetUrl({ path: si.storage_path, fileId: si.id, isPublicView: window.location.pathname.startsWith('/s/') });
          setItem360UrlForHero(url || undefined);
        } catch (e) {
          console.warn('Failed to sign 360 media URL', e);
          setItem360UrlForHero(undefined);
        }
      } else {
        setItem360UrlForHero(undefined);
      }
    };
    loadItem360Url();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id, selectedItem?.show360, selectedItem?.url, selectedItem?.storage_path]);

  // DEBUG: Log render conditions (deduped to avoid Safari spam)
  const lastRenderConditionsRef = React.useRef<string>('');
  useEffect(() => {
    const hasStoragePathOrUrl = !!(selectedItem?.storage_path || selectedItem?.url);
    const isViewerPlayable = !!selectedItem && (
      selectedItem?.file_type === 'video' ||
      selectedItem?.file_type === 'audio' ||
      (selectedItem?.file_type === 'image' || (typeof selectedItem?.mime_type === 'string' && selectedItem.mime_type.startsWith('image/'))) ||
      (selectedItem?.mime_type === 'application/pdf' || (typeof selectedItem?.storage_path === 'string' && selectedItem.storage_path.toLowerCase().endsWith('.pdf')))
    );
    const itemSkyboxReady = Boolean(selectedItem?.show360 && (item360UrlForHero || selectedItem?.url));
    const willRenderContentViewer = hasStoragePathOrUrl && isViewerPlayable && !itemSkyboxReady;
    
    const snapshotObj = {
      hasStoragePathOrUrl,
      isViewerPlayable,
      itemSkyboxReady,
      willRenderContentViewer,
    };
    const snapshot = JSON.stringify(snapshotObj);
    if (lastRenderConditionsRef.current !== snapshot) {
      lastRenderConditionsRef.current = snapshot;
      console.log('🎯 HomeView - Render conditions:', snapshotObj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.storage_path, selectedItem?.url, selectedItem?.file_type, selectedItem?.mime_type, selectedItem?.show360, item360UrlForHero]);

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
    console.log('🔍 HomeView handleItemClickFromBar - isPublicSpace:', isPublicSpace);

    // Fast-path for public viewers: use provided data when possible without DB reads
    try {
      // Web links: never sign, just use URL directly
      if (item.file_type === 'web' || item.type === 'web') {
        const transformedItem = {
          id: item.id,
          title: item.original_name || item.title,
          type: 'web',
          url: item.storage_path || item.url,
          thumb: item.thumbnail_path || item.thumb,
          file_type: 'web',
        };
        onItemClick?.(transformedItem);
        return;
      }
    } catch {
      // ignore and try next strategy
    }

    // Preferred (when permitted): fetch full file data to include 360 settings
    try {
      const { data: fileData, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', item.id)
        .maybeSingle();

      if (fileData && !error) {
        // Special case: web links should not be signed; use URL directly
        if (fileData.file_type === 'web') {
          const transformedItem = {
            id: fileData.id,
            title: fileData.original_name,
            type: 'web',
            url: fileData.storage_path,
            thumb: fileData.thumbnail_path,
            file_type: 'web',
            show360: fileData.show_360,
            xAxisOffset: fileData.x_axis_offset,
            yAxisOffset: fileData.y_axis_offset,
            rotationEnabled: fileData.rotation_enabled,
            rotationSpeed: fileData.rotation_speed,
            rotationAxis: fileData.rotation_axis,
          };
          onItemClick?.(transformedItem);
          return;
        }
        
        // Transform with all 360 settings; NO URL signing here - ContentViewer resolves via getAssetUrl
        console.log('🔍 Passing item to ContentViewer - storage_path:', fileData.storage_path);
        const transformedItem = {
          id: fileData.id,
          title: fileData.original_name,
          type: fileData.file_type,
          storage_path: fileData.storage_path, // ContentViewer will resolve via getAssetUrl
          thumb: fileData.thumbnail_path,
          duration: fileData.duration,
          mime_type: fileData.mime_type,
          file_type: fileData.file_type,
          original_name: fileData.original_name,
          thumbnail_path: fileData.thumbnail_path,
          show360: fileData.show_360,
          xAxisOffset: fileData.x_axis_offset,
          yAxisOffset: fileData.y_axis_offset,
          rotationEnabled: fileData.rotation_enabled,
          rotationSpeed: fileData.rotation_speed,
          rotationAxis: fileData.rotation_axis,
        };
        
        onItemClick?.(transformedItem);
        return;
      }
    } catch (error) {
      console.error('Error fetching file data:', error);
    }

    // Fallback: forward storage_path without signing
    console.log('🔍 Fallback - passing storage_path:', item.storage_path);
    const fallbackItem = {
      id: item.id,
      title: item.original_name || item.title,
      type: item.file_type || item.type,
      storage_path: item.storage_path,
      thumb: item.thumbnail_path || item.thumb,
      duration: item.duration,
      mime_type: item.mime_type,
      file_type: item.file_type || item.type,
      original_name: item.original_name || item.title,
    };
    onItemClick?.(fallbackItem);
  };

  // Determine if lobby has a custom uploaded background (disable default video when true)
  const hasCustomBackground = isLobby && typeof backgroundImage === 'string' && (
    backgroundImage.startsWith('http') ||
    backgroundImage.startsWith('data:') ||
    backgroundImage.includes('/object/public/space-covers/')
  );

  // Resolve 360 rendering preference and source
  const itemSkyboxReady = Boolean(selectedItem?.show360 && (item360UrlForHero || selectedItem?.url));
  
  // When 360 is toggled on home, use selected item's media (video/image) if available
  const get360Source = () => {
    if (itemSkyboxReady) {
      return item360UrlForHero || selectedItem?.url;
    }
    if (show360 && !selectedItem?.show360) {
      // If there's a selected item with media, use it for 360
      if (selectedItem?.thumb || selectedItem?.url || selectedItem?.storage_path) {
        return selectedItem.thumb || selectedItem.url;
      }
      // Otherwise fall back to background
      return backgroundImage || (isLobby ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined);
    }
    return undefined;
  };
  
  const skyboxSrcResolved = get360Source();
  const effectiveShow360 = itemSkyboxReady || (show360 && !selectedItem?.show360);

  // Determine if the selected item should open in the ContentViewer (supports video, audio, image, pdf)
  const isPdfSelected = !!selectedItem && (
    selectedItem?.mime_type === 'application/pdf' ||
    (typeof selectedItem?.storage_path === 'string' && selectedItem.storage_path.toLowerCase().endsWith('.pdf'))
  );
  const isImageSelected = !!selectedItem && (
    selectedItem?.file_type === 'image' || (typeof selectedItem?.mime_type === 'string' && selectedItem.mime_type.startsWith('image/'))
  );
  const isViewerPlayable = !!selectedItem && (
    selectedItem?.file_type === 'video' ||
    selectedItem?.file_type === 'audio' ||
    isImageSelected ||
    isPdfSelected
  );

  // Show infinite scroll mode when movie mode is active (moved to end after all hooks)
  if (showInfiniteScroll) {
    return (
      <InfiniteScrollView
        spaceId={spaceId}
        onClose={onMovieModeToggle || (() => {})}
       />
     );
   }
 
   return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-32"
    >


      {/* Hero Header / Content Viewer */}
      {selectedItem?.storage_path && isViewerPlayable && !itemSkyboxReady ? (
        <ContentViewer
          ref={heroRef as any}
          content={{
            id: selectedItem.id || selectedItem.thumb,
            storage_path: selectedItem.storage_path, // Always pass storage_path (no URL fallback)
            file_type: selectedItem.file_type,
            mime_type: selectedItem.mime_type,
            original_name: selectedItem.title || selectedItem.original_name || selectedItem.name || 'Untitled',
            thumbnail_path: selectedItem.thumbnail_path || selectedItem.thumb,
            duration: selectedItem.duration
          }}
          onClose={() => {
            setLocalSelectedItem(null);
            // Also clear the parent's selected item if the handler is available
            onMediaClick?.(null);
          }}
          onVideoStateChange={onVideoStateChange}
          onMediaEnded={() => {
            if (onMediaEnd) {
              onMediaEnd();
              return;
            }
            console.log('HomeView: Media ended, isAutoplay:', isAutoplay);
            if (isAutoplay) {
              console.log('HomeView: Calling skipToNext');
              skipToNext();
            }
          }}
        />
      ) : (
         <HeroHeaderVideo
           ref={heroRef as any}
           videoSrc={selectedItem?.duration && !selectedItem?.artist ? selectedItem?.thumb : (isLobby && !hasCustomBackground && !show360 && !selectedItem?.show360 ? "https://dialin.io/s/TownSquare2-1.mp4" : undefined)}
           posterSrc={selectedItem?.thumb || selectedItem?.art || (!backgroundImage ? undefined : (/\.(mp4|webm|ogg|mov)$/i.test((backgroundImage||'').split('?')[0]) ? undefined : backgroundImage))}
           title={isLobby ? "" : (selectedItem?.title || selectedItem?.name || spaceName || "")}
           subtitle={isLobby ? "" : (selectedItem?.artist || selectedItem?.type || spaceDescription || "")}
           backgroundImage={selectedItem?.thumb || selectedItem?.art || backgroundImage || undefined}
           skyboxSrc={skyboxSrcResolved}
           showVideo={(selectedItem?.duration && !selectedItem?.artist && !effectiveShow360) ? true : (isLobby && !hasCustomBackground && !effectiveShow360)}
           show360={effectiveShow360}
           xAxisOffset={selectedItem?.show360 ? selectedItem?.xAxisOffset : xAxisOffset}
           yAxisOffset={selectedItem?.show360 ? selectedItem?.yAxisOffset : yAxisOffset}
           volume={volume}
           isMuted={isMuted}
           rotationEnabled={selectedItem?.show360 ? selectedItem?.rotationEnabled : rotationEnabled}
           rotationSpeed={selectedItem?.show360 ? selectedItem?.rotationSpeed : rotationSpeed}
           flipHorizontal={flipHorizontal}
           flipVertical={flipVertical}
           webUrl={
             (selectedItem?.type === 'web' || selectedItem?.file_type === 'web')
               ? (selectedItem?.url || selectedItem?.storage_path)
               : (selectedItem?.type === 'document' || selectedItem?.file_type === 'document' || selectedItem?.mime_type === 'application/pdf')
               ? (selectedItem?.url || pdfUrlForHero)
               : undefined
           }
           allowDynamicHeight={true}
           showPlayAllButton={(() => {
             const result = (selectedItem?.show_play_all_button || showPlayAllButton) && !isLobby;
             console.log('🎬 HeroHeaderVideo showPlayAllButton check:', {
               selectedItemButton: selectedItem?.show_play_all_button,
               spaceButton: showPlayAllButton,
               isLobby,
               result,
               onMovieModeToggle: !!onMovieModeToggle
             });
             return result;
           })()}
           onOpenAddPanel={onOpenAddPanel}
           onVideoStateChange={onVideoStateChange}
           onMediaEnd={onMediaEnd}
           onMovieModeToggle={onMovieModeToggle}
         />
      )}


      <CreateSpaceModal
        isOpen={isAddModalOpen}
        onClose={onCloseAddModal || (() => {})}
        onCreate={(name) => {
          if (onCreateSpace) {
            onCreateSpace(name);
          }
          if (onCloseAddModal) {
            onCloseAddModal();
          }
        }}
      />

      <DialControlPanel
        isOpen={showDialControlPanel}
        item={selectedItem}
        onClose={handleDialControlPanelClose}
        onSelect={() => {}}
        onDialSaved={handleDialSaved}
      />

      <CelebrationAnimation isVisible={showCelebration} onComplete={() => setShowCelebration(false)} />


      {showItemsBar && spaceId && (
        <ItemsPeopleBar
          view={itemsPeopleView}
          spaceId={spaceId}
          onItemClick={handleItemClickFromBar}
          onClose={onCloseItemsBar}
          onItem360Toggle={onItem360Toggle}
          isPublicSpace={isPublicSpace}
          onMovieModeToggle={onMovieModeToggle}
        />
      )}
    </motion.div>
  );
}