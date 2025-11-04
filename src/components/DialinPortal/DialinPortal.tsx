import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { AuthModal } from './AuthModal';
import { TopNav } from './TopNav';
import { MobileTabBar } from './MobileTabBar';
import { HomeView } from './HomeView';
import { FriendsView } from './FriendsView';
import { VideosView } from './VideosView';
import { MusicView } from './MusicView';
import { LocationsView } from './LocationsView';
import { CombinedBottomBar } from './CombinedBottomBar';
import { ShareMyBar } from './ShareMyBar';
import { FloatingPlayer } from './FloatingPlayer';
import { ContactPane } from './ContactPane';
import { DialPopup } from './DialPopup';
import { DialControlPanel } from './DialControlPanel';
import { CreateSpaceModal } from './CreateSpaceModal';
import { ChatWindow } from './ChatWindow';
import { AIChat } from './AIChat';
import { AddContactPanel } from './AddContactPanel';
import { Settings360Modal } from './Settings360Modal';
import { CelebrationAnimation } from './CelebrationAnimation';
import { DragDropZone } from './DragDropZone';
import { SpaceSelectionModal } from './SpaceSelectionModal';
import { useContactFieldSharing } from '@/hooks/useContactFieldSharing';
import { useSpacesContext } from '@/contexts/SpacesContext';
import { useMediaQueue } from '@/contexts/MediaQueueContext';
import { useFileUpload } from '@/hooks/useFileUpload';

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
import lobbyPoster from '@/assets/lobby-poster.jpg';
import appBackground from '@/assets/app-background.jpg';
import { VIDEO_GROUPS, MUSIC_GROUPS, LOCATION_GROUPS } from '@/data/constants';
import { applyDials } from '@/lib/filters';
import { toast } from 'sonner';

const appendCacheBuster = (url?: string, seed?: string | number): string | undefined => {
  if (!url) return undefined;
  const v = typeof seed === 'number' ? seed : seed ? new Date(seed).getTime() : Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${v}`;
};

export function DialinPortal() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDials, setSelectedDials] = useState<Record<string, string[]>>({});
  const [pinnedContacts, setPinnedContacts] = useState<Friend[]>(friends.slice(0, 4));
  const [selectedContact, setSelectedContact] = useState<Friend | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showSpaceSelectionModal, setShowSpaceSelectionModal] = useState(false);
  
  // File upload integration
  const { uploadMultipleFiles, uploading, analyzeWithAI, saveMetadata } = useFileUpload();
  
  // Media queue integration
  const { skipToNext, skipToPrevious, setIsPlaying: setQueuePlaying, setProgress: setQueueProgress } = useMediaQueue();
  
  // Auth session persistence
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        toast.success('Welcome back!');
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setShowAuthModal(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Use contact field sharing for the selected contact
  const { toggleableFields, sharedFields, toggleFieldShare } = useContactFieldSharing(
    selectedContact?.id
  );

  const handleDialSaved = () => {
    setUserPoints(prev => prev + 1);
    setShowCelebration(true);
  };
const [spaces, setSpaces] = useState<Space[]>([]);
const { spaces: dbSpaces, createSpace: createDbSpace, updateSpace, deleteSpace, refetch } = useSpacesContext();

useEffect(() => {
  const convertedDbSpaces: Space[] = dbSpaces.map(dbSpace => ({
    id: dbSpace.id,
    name: dbSpace.name,
    thumb: (dbSpace as any).thumbnail_url ? appendCacheBuster((dbSpace as any).thumbnail_url, (dbSpace as any).updated_at) : '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
    parentId: (dbSpace as any).parent_id || undefined,
    backgroundImage: (dbSpace as any).cover_url ? appendCacheBuster((dbSpace as any).cover_url, (dbSpace as any).updated_at) : undefined,
    show360: (dbSpace as any).show_360,
    xAxis: (dbSpace as any).x_axis_offset,
    yAxis: (dbSpace as any).y_axis_offset,
    volume: (dbSpace as any).volume,
    isMuted: (dbSpace as any).is_muted,
    rotationEnabled: (dbSpace as any).rotation_enabled,
    rotationSpeed: (dbSpace as any).rotation_speed,
    flipHorizontal: (dbSpace as any).flip_horizontal,
    flipVertical: (dbSpace as any).flip_vertical,
    isHome: (dbSpace as any).is_home,
  }));
  setSpaces(convertedDbSpaces);
}, [dbSpaces]);

const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPeopleBar, setShowPeopleBar] = useState(false);
  const [sortOrder, setSortOrder] = useState<'custom' | 'date-newest' | 'date-oldest' | 'name-az' | 'name-za' | 'size-largest' | 'size-smallest' | 'type'>('custom');
  const [movieMode, setMovieMode] = useState(false);

  // Close other panels when one opens
  const openPanel = (panelName: 'chat' | 'ai' | 'add') => {
    if (panelName === 'chat') {
      setShowChatWindow(prev => !prev);
      setShowAIChat(false);
      setIsAddModalOpen(false);
    } else if (panelName === 'ai') {
      setShowAIChat(prev => !prev);
      setShowChatWindow(false);
      setIsAddModalOpen(false);
    } else if (panelName === 'add') {
      setIsAddModalOpen(prev => !prev);
      setShowChatWindow(false);
      setShowAIChat(false);
    }
  };
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [showDialControlPanel, setShowDialControlPanel] = useState(false);
  const [dialControlItem, setDialControlItem] = useState<any>(null);
  const [show360Settings, setShow360Settings] = useState(false);
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
    setSelectedContact(null); // Close contact pane when switching tabs
    if (tab !== 'videos' && tab !== 'music' && tab !== 'locations') {
      setSelectedDials({}); // Clear filters when leaving filter tabs
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

  // Handle dial control panel
  const handleDialControlSelect = (selectedDialsArray: string[], selectedSets: string[]) => {
    // Convert selected dials and sets to filter format
    const newDials: Record<string, string[]> = {};
    
    // Add emoji dials as 'mood' or 'vibe'
    if (selectedDialsArray.length > 0) {
      newDials.vibe = selectedDialsArray;
    }
    
    // Add sets as categories
    if (selectedSets.length > 0) {
      newDials.type = selectedSets;
    }
    
    setSelectedDials(newDials);
    
    // Navigate to appropriate tab based on item type
    if (dialControlItem) {
      if (dialControlItem.artist || dialControlItem.length) {
        setCurrentTab('music');
      } else if (dialControlItem.duration) {
        setCurrentTab('videos');
      } else if (dialControlItem.distance) {
        setCurrentTab('locations');
      }
    }
  };

  const handleOwnerClick = (ownerId: string) => {
    // Find and select the owner as a contact
    const owner = friends.find(f => f.name === ownerId);
    if (owner) {
      setSelectedContact(owner);
    }
    setShowDialControlPanel(false);
  };


  // Handle space creation
  const handleCreateSpace = async (name: string, _description?: string, parentId?: string) => {
    // Create space in database
    const newDbSpace = await createDbSpace(name, undefined, parentId);
    
    if (newDbSpace) {
      const newSpace: Space = {
        id: newDbSpace.id,
        name: newDbSpace.name,
        thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        parentId: newDbSpace.parent_id || undefined
      };
      setSpaces(prev => [...prev, newSpace]);
    }
    setShowCreateSpaceModal(false);
  };

// Handle space deletion
  const handleDeleteSpace = async (spaceId: string) => {
    const success = await deleteSpace(spaceId);
    if (success) {
      setSpaces(prev => prev.filter(space => space.id !== spaceId));
    } else {
      toast.error('Failed to delete space');
    }
  };

// Handle space renaming
  const handleRenameSpace = async (spaceId: string, newName: string) => {
    const success = await updateSpace(spaceId, { name: newName });
    if (!success) {
      refetch();
      toast.error('Failed to rename space');
    }
  };

// Handle space description update
  const handleUpdateSpaceDescription = async (spaceId: string, newDescription: string) => {
    const success = await updateSpace(spaceId, { description: newDescription });
    if (!success) {
      refetch();
      toast.error('Failed to update description');
    }
  };

// Handle space thumbnail update
  const handleUpdateSpaceThumbnail = async (spaceId: string, thumbnailUrl: string) => {
    const success = await updateSpace(spaceId, { cover_url: thumbnailUrl } as any);
    if (success) {
      toast.success('Cover updated');
    } else {
      refetch();
      toast.error('Failed to update cover');
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
    if (space.isHome) {
      // Navigate to home
      setCurrentTab('home');
      navigate('/');
    } else {
      navigate(`/space/${space.id}`);
    }
  };

  // Handle floating player actions
  const handlePlayerPlay = () => {
    setFloatingPlayer(prev => ({ ...prev, isPlaying: true }));
    setQueuePlaying(true);
  };

  const handlePlayerPause = () => {
    setFloatingPlayer(prev => ({ ...prev, isPlaying: false }));
    setQueuePlaying(false);
  };

  const handlePlayerClose = () => {
    setFloatingPlayer(prev => ({ ...prev, isVisible: false }));
  };
  
  const handlePlayerSkipForward = () => {
    skipToNext();
  };
  
  const handlePlayerSkipBack = () => {
    skipToPrevious();
  };

  const handleToggle360 = (spaceId: string, enabled: boolean) => {
    updateSpace(spaceId, { show_360: enabled }, { silent: true });
  };

  const handle360AxisChange = (spaceId: string, axis: 'x' | 'y', value: number) => {
    updateSpace(spaceId, axis === 'x' ? { x_axis_offset: value } : { y_axis_offset: value }, { silent: true });
  };

  const handle360VolumeChange = (spaceId: string, volume: number) => {
    updateSpace(spaceId, { volume }, { silent: true });
  };

  const handle360MuteToggle = (spaceId: string, muted: boolean) => {
    updateSpace(spaceId, { is_muted: muted }, { silent: true });
  };

  const handle360RotationToggle = (spaceId: string, enabled: boolean) => {
    updateSpace(spaceId, { rotation_enabled: enabled }, { silent: true });
  };

  const handle360RotationSpeedChange = (spaceId: string, speed: number) => {
    updateSpace(spaceId, { rotation_speed: speed }, { silent: true });
  };

  const handleFlipHorizontalToggle = (spaceId: string, flipped: boolean) => {
    updateSpace(spaceId, { flip_horizontal: flipped }, { silent: true });
  };

  const handleFlipVerticalToggle = (spaceId: string, flipped: boolean) => {
    updateSpace(spaceId, { flip_vertical: flipped }, { silent: true });
  };

  // Handle contact click from chat window
  const handleChatContactClick = (contactId: string) => {
    const contact = friends.find(c => c.id === contactId);
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

  // Handle files dropped anywhere on the site
  const handleFilesDropped = (files: File[]) => {
    if (!user) {
      toast.error('Please sign in to upload files');
      setShowAuthModal(true);
      return;
    }
    
    setDroppedFiles(files);
    setShowSpaceSelectionModal(true);
  };

  // Handle space selection and upload
  const handleSpaceSelect = async (spaceId: string) => {
    setShowSpaceSelectionModal(false);
    
    try {
      toast.info(`Uploading ${droppedFiles.length} file${droppedFiles.length > 1 ? 's' : ''}...`);
      
      const results = await uploadMultipleFiles(droppedFiles, spaceId);
      
      toast.success(`Added ${results.length} item${results.length > 1 ? 's' : ''} to space!`);
      
      // Analyze files with AI in the background (non-blocking)
      Promise.all(results.map(async (result) => {
        const file = droppedFiles.find(f => f.name === result.original_name);
        if (file && user) {
          try {
            const aiMetadata = await analyzeWithAI(file, result.id);
            
            if (aiMetadata && aiMetadata.hashtags && aiMetadata.dial_values) {
              await saveMetadata(
                result.id,
                aiMetadata.hashtags,
                aiMetadata.dial_values,
                true,
                aiMetadata.confidence || 0
              );
            } else {
              await saveMetadata(result.id, [], {}, false, 0);
            }
          } catch (error) {
            console.error('Background AI analysis error:', error);
          }
        }
      })).then(() => {
        console.log('AI analysis complete');
        refetch(); // Refresh to show AI-generated metadata
      });
      
      refetch(); // Refresh spaces to show new files
      setDroppedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  // Handle creating new space and uploading
  const handleCreateSpaceAndUpload = async (name: string) => {
    setShowSpaceSelectionModal(false);
    
    try {
      const newSpace = await createDbSpace(name);
      if (newSpace) {
        await handleSpaceSelect(newSpace.id);
      }
    } catch (error) {
      console.error('Space creation error:', error);
      toast.error('Failed to create space');
    }
  };

  // Handle creating new space from file drop
  const handleCreateSpaceFromDrop = (name: string) => {
    const newSpace: Space = {
      id: Date.now().toString(),
      name,
      thumb: '' // No default thumbnail
    };
    setSpaces(prev => [...prev, newSpace]);
  };

  // Handle add option selection
  const handleAddOptionSelect = (optionId: string) => {
    if (optionId === 'space') {
      setShowCreateSpaceModal(true);
    }
    console.log('Selected option:', optionId);
    setIsAddModalOpen(false);
  };

  const isPinned = selectedContact ? pinnedContacts.some(c => c.id === selectedContact.id) : false;
  const isViewingContact = !!selectedContact;
  const showSpacesBar = ['home', 'friends', 'videos', 'music', 'locations'].includes(currentTab) && !isViewingContact;
  
  // Get home space for 360 settings
  const homeSpace = spaces.find(space => space.isHome);
  const show360 = homeSpace?.show360 || false;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        selectedChipsCount={selectedChipsCount}
        dialCount={1240}
        show360={show360}
        onOpen360Settings={handleOpen360Settings}
        userPoints={userPoints}
        onOpenAddPanel={() => openPanel('add')}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        movieMode={movieMode}
        onMovieModeToggle={() => setMovieMode(!movieMode)}
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
            backgroundImage={homeSpace?.backgroundImage || homeSpace?.thumb}
            spaceName={homeSpace?.name}
            spaceDescription={homeSpace?.description}
            isLobby={true}
            show360={show360}
            xAxisOffset={homeSpace?.xAxis}
            yAxisOffset={homeSpace?.yAxis}
            volume={homeSpace?.volume}
            isMuted={homeSpace?.isMuted}
            rotationEnabled={homeSpace?.rotationEnabled}
            rotationSpeed={homeSpace?.rotationSpeed}
            flipHorizontal={homeSpace?.flipHorizontal}
            flipVertical={homeSpace?.flipVertical}
            spaces={spaces}
            onCreateSpace={handleCreateSpaceFromDrop}
            isAddModalOpen={isAddModalOpen}
            onCloseAddModal={() => setIsAddModalOpen(false)}
            onAddOptionSelect={handleAddOptionSelect}
            onOpenAddPanel={() => openPanel('add')}
            onUploadClick={handleFilesDropped}
            movieMode={movieMode}
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
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <CombinedBottomBar
            spaces={spaces.filter(s => s.isHome || s.parentId === undefined)}
            currentSpaceId={homeSpace?.id || ''}
            onCreateSpace={() => openPanel('add')}
            onDeleteSpace={handleDeleteSpace}
            onRenameSpace={handleRenameSpace}
            onUpdateSpaceDescription={handleUpdateSpaceDescription}
            onUpdateSpaceThumbnail={handleUpdateSpaceThumbnail}
            onReorderSpace={handleReorderSpace}
            onToggle360={handleToggle360}
            on360AxisChange={handle360AxisChange}
            on360VolumeChange={handle360VolumeChange}
            on360MuteToggle={handle360MuteToggle}
            on360RotationToggle={handle360RotationToggle}
            on360RotationSpeedChange={handle360RotationSpeedChange}
            onFlipHorizontalToggle={handleFlipHorizontalToggle}
            onFlipVerticalToggle={handleFlipVerticalToggle}
            onSpaceClick={handleSpaceClick}
            showChatWindow={showChatWindow}
            onToggleChatWindow={() => showChatWindow ? setShowChatWindow(false) : openPanel('chat')}
            showCreateSpaceModal={showCreateSpaceModal}
            showAIChat={showAIChat}
            onToggleAIChat={() => showAIChat ? setShowAIChat(false) : openPanel('ai')}
            onTogglePeopleBar={() => setShowPeopleBar(!showPeopleBar)}
            pinnedContacts={pinnedContacts}
            onContactClick={handleContactClick}
            showPeopleBar={showPeopleBar}
            isHome={currentTab === 'home'}
          />
        </div>
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
        onAIClick={() => openPanel('ai')}
        onAddClick={handleContactAddClick}
      />

      <DialPopup
        isOpen={showDialPopup}
        item={dialPopupItem}
        onClose={() => setShowDialPopup(false)}
        onUseAsFilters={handleUseAsFilters}
      />

      <DialControlPanel
        isOpen={showDialControlPanel}
        item={dialControlItem}
        onClose={() => setShowDialControlPanel(false)}
        onSelect={handleDialControlSelect}
        onOwnerClick={handleOwnerClick}
        onDelete={() => {
          console.log('Delete item:', dialControlItem?.id);
          setShowDialControlPanel(false);
        }}
        onShare={() => {
          console.log('Share item:', dialControlItem?.id);
          setShowDialControlPanel(false);
        }}
        onPost={() => {
          console.log('Post item:', dialControlItem?.id);
          setShowDialControlPanel(false);
        }}
        onSettings={() => {
          console.log('Settings for item:', dialControlItem?.id);
          setShow360Settings(true);
          setShowDialControlPanel(false);
        }}
        onDialSaved={handleDialSaved}
      />

      <CreateSpaceModal
        isOpen={showCreateSpaceModal}
        onClose={() => setShowCreateSpaceModal(false)}
        onCreate={handleCreateSpace}
        parentId={undefined}
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
        onToggle360={() => homeSpace && handleToggle360(homeSpace.id, !show360)}
        xAxisOffset={homeSpace?.xAxis || 0}
        yAxisOffset={homeSpace?.yAxis || 0}
        onAxisChange={(axis, value) => homeSpace && handle360AxisChange(homeSpace.id, axis, value)}
        volume={homeSpace?.volume || 0.5}
        isMuted={homeSpace?.isMuted || false}
        onVolumeChange={(volume) => homeSpace && handle360VolumeChange(homeSpace.id, volume)}
        onMuteToggle={() => homeSpace && handle360MuteToggle(homeSpace.id, !homeSpace?.isMuted)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      <CelebrationAnimation
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Space Selection Modal for Uploads */}
      <SpaceSelectionModal
        isOpen={showSpaceSelectionModal}
        onClose={() => {
          setShowSpaceSelectionModal(false);
          setDroppedFiles([]);
        }}
        onSpaceSelect={handleSpaceSelect}
        onCreateNewSpace={handleCreateSpaceAndUpload}
        spaces={spaces.map(s => ({ id: s.id, name: s.name, thumb: s.thumb }))}
        droppedFiles={droppedFiles}
        loading={uploading}
      />

      {/* Global Drag & Drop Zone */}
      <DragDropZone onFilesDropped={handleFilesDropped}>
        <></>
      </DragDropZone>
    </div>
  );
}
