import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '@/components/DialinPortal/TopNav';
import { MobileTabBar } from '@/components/DialinPortal/MobileTabBar';
import { HomeView } from '@/components/DialinPortal/HomeView';
import { FriendsView } from '@/components/DialinPortal/FriendsView';
import { VideosView } from '@/components/DialinPortal/VideosView';
import { MusicView } from '@/components/DialinPortal/MusicView';
import { LocationsView } from '@/components/DialinPortal/LocationsView';
import { ShareMyBar } from '@/components/DialinPortal/ShareMyBar';
import { CombinedBottomBar } from '@/components/DialinPortal/CombinedBottomBar';
import { FloatingPlayer } from '@/components/DialinPortal/FloatingPlayer';
import { ContactPane } from '@/components/DialinPortal/ContactPane';
import { DialControlPanel } from '@/components/DialinPortal/DialControlPanel';
import { CreateSpaceModal } from '@/components/DialinPortal/CreateSpaceModal';
import { Settings360Modal } from '@/components/DialinPortal/Settings360Modal';
import { ChatWindow } from '@/components/DialinPortal/ChatWindow';
import { AIChat } from '@/components/DialinPortal/AIChat';
import { AddContactPanel } from '@/components/DialinPortal/AddContactPanel';
import { DragDropZone } from '@/components/DialinPortal/DragDropZone';
import { SpaceSelectionModal } from '@/components/DialinPortal/SpaceSelectionModal';
import { MetadataAdjustmentPanel } from '@/components/DialinPortal/MetadataAdjustmentPanel';
import { UploadLoader } from '@/components/DialinPortal/UploadLoader';
import { useContactFieldSharing } from '@/hooks/useContactFieldSharing';
import { useFileUpload, AIMetadata } from '@/hooks/useFileUpload';
import { useSpacesContext } from '@/contexts/SpacesContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  videoCatalog, 
  musicCatalog, 
  locations, 
  friends, 
  friendsPosts, 
  VideoItem,
  MusicItem,
  LocationItem,
  Friend,
  Space
} from '@/data/catalogs';
import { VIDEO_GROUPS, MUSIC_GROUPS, LOCATION_GROUPS } from '@/data/constants';
import { applyDials } from '@/lib/filters';
import { toast } from 'sonner';

export default function SpacePage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDials, setSelectedDials] = useState<Record<string, string[]>>({});
  const [pinnedContacts, setPinnedContacts] = useState<Friend[]>(friends.slice(0, 4));
  const [selectedContact, setSelectedContact] = useState<Friend | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([
    { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' },
  ]);
  
  // File upload hook
  const { uploadFile, uploading, analyzingWithAI, analyzeWithAI, saveMetadata } = useFileUpload();
  const { spaces: dbSpaces, loading: spacesLoading, updateSpace, deleteSpace, refetch } = useSpacesContext();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Sync UI spaces with database spaces (plus Lobby)
  useEffect(() => {
    const lobby: Space = { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
    const convertedDbSpaces: Space[] = dbSpaces.map(dbSpace => ({
      id: dbSpace.id,
      name: dbSpace.name,
      thumb: dbSpace.cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
      parentId: dbSpace.parent_id || undefined,
      backgroundImage: undefined,
      show360: false
    }));

    setSpaces([lobby, ...convertedDbSpaces]);
  }, [dbSpaces]);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);

  // Footer spaces (main navigation spaces)
  const footerSpaces = [
    { id: 'lobby', name: 'Lobby' },
    { id: 'videos', name: 'Videos' },
    { id: 'music', name: 'Music' },
    { id: 'locations', name: 'Locations' },
    { id: 'friends', name: 'Friends' }
  ];

  // Floors removed - using hierarchical space navigation instead
  
  // Use contact field sharing for the selected contact
  const { toggleableFields, sharedFields, toggleFieldShare } = useContactFieldSharing(
    selectedContact?.id
  );
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [floatingPlayer, setFloatingPlayer] = useState<{
    isVisible: boolean;
    item: any;
    isPlaying: boolean;
    progress: number;
  }>({
    isVisible: false,
    item: null,
    isPlaying: false,
    progress: 25
  });
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [show360Settings, setShow360Settings] = useState(false);
  const [showSpaceSelectionModal, setShowSpaceSelectionModal] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [pendingFile, setPendingFile] = useState<{
    file: { id: string; original_name: string; file_type: string };
    metadata: AIMetadata;
  } | null>(null);
  
  // Navigation breadcrumb path (e.g., ['lobby', 'space-1', 'space-2'])
  const [navigationPath, setNavigationPath] = useState<string[]>(['lobby']);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [selectedItemData, setSelectedItemData] = useState<any>(null);
  
  // Get current space items - only items/spaces within the selected space
  const currentSpaceId = navigationPath[navigationPath.length - 1];
  
  // Get nested spaces that belong to the current space
  const nestedSpaces = spaces.filter(s => s.parentId === currentSpaceId);
  
  // Only show nested spaces within the current space, not all user content
  const currentSpaceItems = nestedSpaces;

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Determine if the requested space exists either in local UI state or backend
  const spaceExists = React.useMemo(() => {
    const id = spaceId as string | undefined;
    if (!id || id === 'lobby') return true;
    return spaces.some(s => s.id === id) || dbSpaces.some(s => s.id === id);
  }, [spaceId, spaces, dbSpaces]);
  
  // Find current space (prefer UI state, fall back to backend list for instant render)
  const currentSpace = React.useMemo(() => {
    const uiSpace = spaces.find(space => space.id === spaceId);
    if (uiSpace) return uiSpace;
    const dbSpace = dbSpaces.find(s => s.id === spaceId);
    return dbSpace
      ? {
          id: dbSpace.id,
          name: dbSpace.name,
          thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
          parentId: dbSpace.parent_id || undefined,
          backgroundImage: undefined,
          show360: false,
        }
      : undefined;
  }, [spaces, dbSpaces, spaceId]);
  
  // Redirect only if we've finished loading and the space truly doesn't exist
  useEffect(() => {
    if (!spacesLoading && spaceId !== 'lobby' && !spaceExists) {
      navigate('/');
    }
  }, [spaceExists, spaceId, spacesLoading, navigate]);

  // Keep breadcrumb in sync with route (on direct loads/refresh)
  useEffect(() => {
    if (!spaceId || spaceId === 'lobby') {
      setNavigationPath(['lobby']);
    } else {
      setNavigationPath(prev => {
        if (prev.includes(spaceId)) {
          return prev.slice(0, prev.indexOf(spaceId) + 1);
        }
        return ['lobby', spaceId];
      });
    }
  }, [spaceId]);

  // Filter content based on selected dials
  const filteredVideos = applyDials(
    videoCatalog,
    selectedDials,
    (item: VideoItem) => ({
      type: item.type,
      vibe: item.vibe,
      decade: item.decade,
      energy: item.energy
    })
  );

  const filteredMusic = applyDials(
    musicCatalog,
    selectedDials,
    (item: MusicItem) => ({
      type: item.type,
      vibe: item.vibe,
      decade: item.decade,
      energy: item.energy
    })
  );

  const filteredLocations = applyDials(
    locations,
    selectedDials,
    (item: LocationItem) => ({
      type: item.type
    })
  );

  // Calculate selected chips count
  const selectedChipsCount = Object.values(selectedDials).reduce((acc, arr) => acc + arr.length, 0);

  // Handle dial toggle
  const handleDialToggle = (groupKey: string, option: string) => {
    setSelectedDials(prev => {
      const currentSelection = prev[groupKey] || [];
      const isSelected = currentSelection.includes(option);
      
      if (isSelected) {
        const newSelection = currentSelection.filter(item => item !== option);
        if (newSelection.length === 0) {
          const { [groupKey]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [groupKey]: newSelection };
      } else {
        return { ...prev, [groupKey]: [...currentSelection, option] };
      }
    });
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setSelectedDials({});
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSelectedContact(null);
    if (tab !== 'videos' && tab !== 'music' && tab !== 'locations') {
      setSelectedDials({});
    }
  };

  // Handle contact interactions
  const handleContactClick = (contact: Friend) => {
    setSelectedContact(contact);
  };

  const handleContactPin = () => {
    if (selectedContact && !pinnedContacts.find(c => c.id === selectedContact.id)) {
      setPinnedContacts(prev => [...prev, selectedContact]);
    }
  };

  const handleContactUnpin = () => {
    if (selectedContact) {
      setPinnedContacts(prev => prev.filter(c => c.id !== selectedContact.id));
    }
  };

  // Handle media interactions
  const handleMediaClick = (item: any) => {
    // Clear selection if null is passed
    if (!item) {
      setSelectedItemData(null);
      setFloatingPlayer(prev => ({ ...prev, isVisible: false }));
      return;
    }
    
    // Set the selected item data for hero header display
    setSelectedItemData(item);
    
    // Also show in floating player for convenience
    setFloatingPlayer({
      isVisible: true,
      item,
      isPlaying: true,
      progress: 25
    });
  };

  const handleMediaLongPress = (item: any) => {
    setDialPopupItem(item);
    setShowDialPopup(true);
  };

  // Handle dial popup
  const handleUseAsFilters = () => {
    if (dialPopupItem) {
      const newDials: Record<string, string[]> = {};
      
      if (dialPopupItem.type) newDials.type = [dialPopupItem.type];
      if (dialPopupItem.vibe) newDials.vibe = [dialPopupItem.vibe];
      if (dialPopupItem.decade) newDials.decade = [dialPopupItem.decade];
      if (dialPopupItem.energy) newDials.energy = [dialPopupItem.energy];
      
      setSelectedDials(newDials);
      
      // Navigate to appropriate tab
      if (dialPopupItem.artist || dialPopupItem.length) {
        setCurrentTab('music');
      } else if (dialPopupItem.duration) {
        setCurrentTab('videos');
      } else if (dialPopupItem.distance) {
        setCurrentTab('locations');
      }
    }
    setShowDialPopup(false);
    setDialPopupItem(null);
  };


  // Handle space creation
  const handleCreateSpace = async (name: string, coverUrl: string, parentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create spaces');
        return;
      }

      const { data, error } = await supabase
        .from('spaces')
        .insert({
          user_id: user.id,
          name,
          parent_id: parentId || null,
          cover_url: coverUrl
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating space:', error);
        toast.error('Failed to create space');
        return;
      }

      const newSpace: Space = {
        id: data.id,
        name: data.name,
        thumb: coverUrl,
        parentId: data.parent_id || undefined
      };
      
      setSpaces(prev => [...prev, newSpace]);
      toast.success(`Space "${name}" created successfully!`);
      setShowCreateSpaceModal(false);
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space');
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    const success = await deleteSpace(spaceId);
    if (success) {
      setSpaces(prev => prev.filter(space => space.id !== spaceId));
      if (navigationPath[navigationPath.length - 1] === spaceId) {
        navigate('/');
      }
    } else {
      toast.error('Failed to delete space');
    }
  };

  // Handle space renaming
  const handleRenameSpace = async (spaceId: string, newName: string) => {
    const success = await updateSpace(spaceId, { name: newName });
    if (!success) {
      // Revert on failure
      refetch();
    }
  };

  // Handle space description update
  const handleUpdateSpaceDescription = async (spaceId: string, newDescription: string) => {
    const success = await updateSpace(spaceId, { description: newDescription });
    if (!success) {
      refetch();
    }
  };

  // Handle space thumbnail update
  const handleUpdateSpaceThumbnail = async (spaceId: string, thumbnailUrl: string) => {
    const success = await updateSpace(spaceId, { cover_url: thumbnailUrl });
    if (!success) {
      refetch();
    }
  };

  // Drag and drop handlers
  const handleFilesDropped = async (files: File[]) => {
    if (files.length === 0 || !currentUser) return;

    const currentSpaceId = navigationPath[navigationPath.length - 1];

    for (const file of files) {
      try {
        // Auto-upload file first
        toast.info('Uploading and analyzing...');
        const uploadResult = await uploadFile(file, currentSpaceId);
        
        if (uploadResult) {
          // Auto-trigger AI analysis
          const aiMetadata = await analyzeWithAI(file, uploadResult.id);
          
          if (aiMetadata) {
            // Show adjustment panel with AI results
            setPendingFile({
              file: uploadResult,
              metadata: aiMetadata
            });
          } else {
            // If AI fails, show panel with defaults
            setPendingFile({
              file: uploadResult,
              metadata: {
                hashtags: ['untagged'],
                dial_values: {},
                suggested_dials: [],
                confidence: 0,
                suggested_spaces: [currentSpaceId],
                fallback: true
              }
            });
          }
        }
      } catch (error) {
        console.error('File processing error:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }
  };

  const handleMetadataSave = async (metadata: {
    hashtags: string[];
    dialValues: Record<string, any>;
    selectedSpaceId: string;
    location?: { lat: number; lng: number; address?: string };
  }) => {
    if (!pendingFile) return;

    try {
      // Save metadata with location
      const dialValuesWithLocation = {
        ...metadata.dialValues,
        ...(metadata.location && { location: metadata.location })
      };

      await saveMetadata(
        pendingFile.file.id,
        metadata.hashtags,
        dialValuesWithLocation,
        !pendingFile.metadata.fallback,
        pendingFile.metadata.confidence
      );

      // If space changed, move the file
      const currentSpaceId = navigationPath[navigationPath.length - 1];
      if (metadata.selectedSpaceId !== currentSpaceId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Remove from current space
        await supabase
          .from('space_files')
          .delete()
          .eq('file_id', pendingFile.file.id)
          .eq('space_id', currentSpaceId);

        // Add to new space
        await supabase
          .from('space_files')
          .insert({
            space_id: metadata.selectedSpaceId,
            file_id: pendingFile.file.id,
            added_by: user?.id
          });
      }

      toast.success('File organized with Dial OS');
      setPendingFile(null);
    } catch (error) {
      console.error('Failed to save metadata:', error);
      toast.error('Failed to save metadata');
    }
  };

  // Handle space reordering
  const handleReorderSpace = (spaceId: string, direction: 'left' | 'right') => {
    setSpaces(prev => {
      const currentIndex = prev.findIndex(space => space.id === spaceId);
      if (currentIndex === -1) return prev;

      const newSpaces = [...prev];
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= newSpaces.length) return prev;

      [newSpaces[currentIndex], newSpaces[targetIndex]] = [newSpaces[targetIndex], newSpaces[currentIndex]];
      return newSpaces;
    });
  };

  // Handle space navigation
  const handleSpaceClick = (space: Space) => {
    if (space.id === 'lobby') {
      navigate('/');
      setNavigationPath(['lobby']);
    } else {
      navigate(`/space/${space.id}`);
      // Build the path by checking parent relationships
      const buildPath = (spaceId: string): string[] => {
        const currentSpace = spaces.find(s => s.id === spaceId);
        if (!currentSpace) return ['lobby', spaceId];
        if (!currentSpace.parentId || currentSpace.parentId === 'lobby') {
          return ['lobby', spaceId];
        }
        return [...buildPath(currentSpace.parentId), spaceId];
      };
      setNavigationPath(buildPath(space.id));
    }
    setSelectedItemId(undefined);
    setSelectedItemData(null);
  };

  // Handle navigation via breadcrumb
  const handleBreadcrumbNavigate = (spaceId: string) => {
    if (spaceId === 'lobby') {
      navigate('/');
      setNavigationPath(['lobby']);
      setSelectedItemId(undefined);
      setSelectedItemData(null);
    } else {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        handleSpaceClick(space);
      }
    }
  };

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    // Find the item data from catalogs
    const item = [...videoCatalog, ...musicCatalog, ...locations].find(i => i.id === itemId);
    setSelectedItemData(item);
    
    // Update hero header to show selected item
    console.log('Selected item:', item);
  };

  // Handle floating player actions
  const handlePlayerPlay = () => {
    setFloatingPlayer(prev => ({ ...prev, isPlaying: true }));
  };

  const handlePlayerPause = () => {
    setFloatingPlayer(prev => ({ ...prev, isPlaying: false }));
  };

  const handlePlayerClose = () => {
    setFloatingPlayer(prev => ({ ...prev, isVisible: false }));
  };

  const handleToggle360 = (spaceId: string, enabled: boolean) => {
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, show360: enabled }
        : space
    ));
  };

  const handle360AxisChange = (spaceId: string, axis: 'x' | 'y', value: number) => {
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, [axis === 'x' ? 'xAxis' : 'yAxis']: value }
        : space
    ));
  };

  const handle360VolumeChange = (spaceId: string, volume: number) => {
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, volume }
        : space
    ));
  };

  const handle360MuteToggle = (spaceId: string, muted: boolean) => {
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, isMuted: muted }
        : space
    ));
  };

  // Handle chat and AI chat toggles
  const handleToggleChatWindow = () => {
    setShowChatWindow(prev => !prev);
  };

  const handleToggleAIChat = () => {
    setShowAIChat(prev => !prev);
  };

  // Handle contact click from chat window
  const handleChatContactClick = (contactId: string) => {
    const contact = pinnedContacts.find(c => c.id === contactId);
    if (contact) {
      handleContactClick(contact);
    }
  };

  // Handle opening chat for specific contact
  const handleContactChatClick = (contact: Friend) => {
    setSelectedContact(contact);
    setShowChatWindow(true);
  };

  // Handle opening add panel for contact
  const handleContactAddClick = () => {
    setShowAddPanel(true);
  };

  // Handle 360 settings modal
  const handleOpen360Settings = () => {
    setShow360Settings(true);
  };

  const isPinned = selectedContact ? pinnedContacts.some(c => c.id === selectedContact.id) : false;
  const isViewingContact = !!selectedContact;
  const showSpacesBar = ['home', 'friends', 'videos', 'music', 'locations'].includes(currentTab) && !isViewingContact;

  // Get background image
  const backgroundImage = currentSpace?.backgroundImage || currentSpace?.thumb || '/media/lobby-poster.png';
  
  // Check if this space should show 360 view
  const show360 = currentSpace?.show360 || false;

  // Show loading state while space is being confirmed
  if (spacesLoading || (!currentSpace && spaceId !== 'lobby')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropZone onFilesDropped={handleFilesDropped}>
      <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image - only show when not using 360° view */}
      {!show360 && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <TopNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          selectedChipsCount={selectedChipsCount}
          dialCount={1240}
          show360={show360}
          onOpen360Settings={handleOpen360Settings}
        />

        <MobileTabBar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          selectedChipsCount={selectedChipsCount}
        />

        {/* Main Content */}
        <main className="relative">
          {currentTab === 'home' && (
            <HomeView
              pinnedContacts={pinnedContacts}
              onContactClick={handleContactClick}
              onMediaClick={handleMediaClick}
              onMediaLongPress={handleMediaLongPress}
              backgroundImage={backgroundImage}
              spaceName={currentSpace?.name || 'Lobby'}
              spaceDescription={currentSpace?.description}
              isLobby={spaceId === 'lobby'}
              show360={show360}
              xAxisOffset={currentSpace?.xAxis}
              yAxisOffset={currentSpace?.yAxis}
              volume={currentSpace?.volume}
              isMuted={currentSpace?.isMuted}
              selectedItem={selectedItemData}
            />
          )}

          {currentTab === 'friends' && (
            <FriendsView
              pinnedContacts={pinnedContacts}
              posts={friendsPosts}
              onContactClick={handleContactClick}
              onPostClick={handleMediaClick}
              onPostLongPress={handleMediaLongPress}
            />
          )}

          {currentTab === 'videos' && (
            <VideosView
              videos={filteredVideos}
              selectedDials={selectedDials}
              onDialToggle={handleDialToggle}
              onClearAll={handleClearAllFilters}
              onVideoClick={handleMediaClick}
              onVideoLongPress={handleMediaLongPress}
            />
          )}

          {currentTab === 'music' && (
            <MusicView
              music={filteredMusic}
              selectedDials={selectedDials}
              onDialToggle={handleDialToggle}
              onClearAll={handleClearAllFilters}
              onMusicClick={handleMediaClick}
              onMusicLongPress={handleMediaLongPress}
            />
          )}

          {currentTab === 'locations' && (
            <LocationsView
              locations={filteredLocations}
              selectedDials={selectedDials}
              onDialToggle={handleDialToggle}
              onClearAll={handleClearAllFilters}
              onLocationClick={handleMediaClick}
              onLocationLongPress={handleMediaLongPress}
            />
          )}
        </main>

        {/* Bottom Bar */}
        {isViewingContact ? (
          <ShareMyBar
            fields={toggleableFields}
            sharedFields={sharedFields}
            onToggleChange={toggleFieldShare}
          />
        ) : showSpacesBar ? (
          <CombinedBottomBar
            spaces={spaces}
            currentSpaceId={spaceId}
            onCreateSpace={() => setShowCreateSpaceModal(true)}
            onDeleteSpace={handleDeleteSpace}
            onRenameSpace={handleRenameSpace}
            onUpdateSpaceDescription={handleUpdateSpaceDescription}
            onUpdateSpaceThumbnail={handleUpdateSpaceThumbnail}
            onReorderSpace={handleReorderSpace}
            onToggle360={handleToggle360}
            on360AxisChange={handle360AxisChange}
            on360VolumeChange={handle360VolumeChange}
            on360MuteToggle={handle360MuteToggle}
            onSpaceClick={handleSpaceClick}
            showChatWindow={showChatWindow}
            onToggleChatWindow={handleToggleChatWindow}
            showCreateSpaceModal={showCreateSpaceModal}
            showAIChat={showAIChat}
            onToggleAIChat={handleToggleAIChat}
          />
        ) : null}

        {/* Overlays */}
        <ContactPane
          isOpen={isViewingContact}
          contact={selectedContact}
          isPinned={isPinned}
          sharedToggles={[]}
          onClose={() => setSelectedContact(null)}
          onPin={handleContactPin}
          onUnpin={handleContactUnpin}
          onChatClick={handleContactChatClick}
          onAIClick={() => setShowAIChat(true)}
          onAddClick={handleContactAddClick}
        />

        <FloatingPlayer
          isVisible={floatingPlayer.isVisible}
          item={floatingPlayer.item}
          isPlaying={floatingPlayer.isPlaying}
          progress={floatingPlayer.progress}
          onPlay={handlePlayerPlay}
          onPause={handlePlayerPause}
          onSkipBack={() => {}}
          onSkipForward={() => {}}
          onExpand={() => {}}
          onClose={handlePlayerClose}
        />

        <DialControlPanel
          isOpen={showDialPopup}
          item={dialPopupItem}
          onClose={() => setShowDialPopup(false)}
          onSelect={(selectedDials, selectedSets) => {
            console.log('Selected dials:', selectedDials, 'sets:', selectedSets);
            setShowDialPopup(false);
          }}
          onOwnerClick={(ownerId) => {
            console.log('Owner clicked:', ownerId);
          }}
          onDelete={() => {
            console.log('Delete item:', dialPopupItem?.id);
            setShowDialPopup(false);
          }}
          onShare={() => {
            console.log('Share item:', dialPopupItem?.id);
            setShowDialPopup(false);
          }}
          onPost={() => {
            console.log('Post item:', dialPopupItem?.id);
            setShowDialPopup(false);
          }}
          onSettings={() => {
            console.log('Settings for item:', dialPopupItem?.id);
          }}
          onDialSaved={() => {
            console.log('Dial saved for item:', dialPopupItem?.id);
          }}
        />

        <CreateSpaceModal
          isOpen={showCreateSpaceModal}
          parentId={(window as any).__pendingSpaceParentId}
          onClose={() => {
            setShowCreateSpaceModal(false);
            // Clean up the pending parent ID
            delete (window as any).__pendingSpaceParentId;
          }}
          onCreate={(name, coverUrl, parentId) => {
            const storedParentId = (window as any).__pendingSpaceParentId;
            const finalParentId = parentId || (storedParentId && storedParentId !== 'lobby' ? storedParentId : undefined);
            handleCreateSpace(name, coverUrl, finalParentId);
            delete (window as any).__pendingSpaceParentId;
          }}
        />

        <ChatWindow
          isOpen={showChatWindow}
          onClose={() => setShowChatWindow(false)}
          pinnedContacts={pinnedContacts}
          onContactClick={handleChatContactClick}
          selectedContactId={selectedContact?.id}
        />

        <AIChat
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
        />

        <AddContactPanel
          isOpen={showAddPanel}
          contact={selectedContact}
          onClose={() => setShowAddPanel(false)}
          spaces={spaces}
          onAddToSpace={(spaceId) => {
            console.log(`Adding ${selectedContact?.name} to space ${spaceId}`);
            setShowAddPanel(false);
          }}
        />

        <Settings360Modal
          isOpen={show360Settings}
          onClose={() => setShow360Settings(false)}
          show360={show360}
          onToggle360={() => handleToggle360(spaceId || 'lobby', !show360)}
          xAxisOffset={currentSpace?.xAxis}
          yAxisOffset={currentSpace?.yAxis}
          onAxisChange={(axis, value) => handle360AxisChange(spaceId || 'lobby', axis, value)}
          volume={currentSpace?.volume}
          isMuted={currentSpace?.isMuted}
          onVolumeChange={(volume) => handle360VolumeChange(spaceId || 'lobby', volume)}
          onMuteToggle={() => handle360MuteToggle(spaceId || 'lobby', !currentSpace?.isMuted)}
        />

        {/* Metadata Adjustment Panel */}
        <AnimatePresence>
          {pendingFile && (
            <MetadataAdjustmentPanel
              fileName={pendingFile.file.original_name}
              fileType={pendingFile.file.file_type}
              initialHashtags={pendingFile.metadata.hashtags}
              initialDialValues={pendingFile.metadata.dial_values}
              suggestedDials={pendingFile.metadata.suggested_dials}
              suggestedSpaces={pendingFile.metadata.suggested_spaces}
              availableSpaces={[
                { id: 'lobby', name: 'Lobby', parent_id: null },
                ...dbSpaces.map(s => ({ 
                  id: s.id, 
                  name: s.name,
                  parent_id: (s as any).parent_id || null
                }))
              ]}
              confidence={pendingFile.metadata.confidence}
              isAiGenerated={!pendingFile.metadata.fallback}
              onSave={handleMetadataSave}
              onCancel={() => setPendingFile(null)}
              onCreateSpace={async (name: string, parentId: string) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                const { error } = await supabase
                  .from('spaces')
                  .insert({
                    user_id: user.id,
                    name,
                    parent_id: parentId
                  });
                
                if (!error) {
                  // Refetch spaces to update the list
                  const { data } = await supabase
                    .from('spaces')
                    .select('*')
                    .eq('user_id', user.id);
                  // This will trigger useSpaces to refetch
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
      </div>
      <UploadLoader isUploading={uploading || analyzingWithAI} />
    </DragDropZone>
  );
}