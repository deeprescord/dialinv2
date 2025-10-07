import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/DialinPortal/TopNav';
import { MobileTabBar } from '@/components/DialinPortal/MobileTabBar';
import { HomeView } from '@/components/DialinPortal/HomeView';
import { FriendsView } from '@/components/DialinPortal/FriendsView';
import { VideosView } from '@/components/DialinPortal/VideosView';
import { MusicView } from '@/components/DialinPortal/MusicView';
import { LocationsView } from '@/components/DialinPortal/LocationsView';
import { BreadcrumbNavBar } from '@/components/DialinPortal/BreadcrumbNavBar';
import { ShareMyBar } from '@/components/DialinPortal/ShareMyBar';
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
import { useContactFieldSharing } from '@/hooks/useContactFieldSharing';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useSpaces } from '@/hooks/useSpaces';
import { 
  videoCatalog, 
  musicCatalog, 
  locations, 
  friends, 
  friendsPosts, 
  initialSpaces,
  VideoItem,
  MusicItem,
  LocationItem,
  Friend,
  Space
} from '@/data/catalogs';
import { VIDEO_GROUPS, MUSIC_GROUPS, LOCATION_GROUPS } from '@/data/constants';
import { applyDials } from '@/lib/filters';

export default function SpacePage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDials, setSelectedDials] = useState<Record<string, string[]>>({});
  const [pinnedContacts, setPinnedContacts] = useState<Friend[]>(friends.slice(0, 4));
  const [selectedContact, setSelectedContact] = useState<Friend | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([
    { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' },
    ...initialSpaces
  ]);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);

  // Footer spaces (main navigation spaces)
  const footerSpaces = [
    { id: 'lobby', name: 'Lobby' },
    { id: 'videos', name: 'Videos' },
    { id: 'music', name: 'Music' },
    { id: 'locations', name: 'Locations' },
    { id: 'friends', name: 'Friends' }
  ];

  const floors = [
    { id: 'floor-1', name: 'Floor 1' },
    { id: 'floor-2', name: 'Floor 2' },
    { id: 'floor-3', name: 'Floor 3' },
    { id: 'floor-4', name: 'Floor 4' },
    { id: 'floor-5', name: 'Floor 5' }
  ];
  
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
  
  // Navigation breadcrumb path (e.g., ['lobby', 'space-1', 'space-2'])
  const [navigationPath, setNavigationPath] = useState<string[]>(['lobby']);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [selectedItemData, setSelectedItemData] = useState<any>(null);
  
  // Get current space items - only items/spaces within the selected space
  const currentSpaceId = navigationPath[navigationPath.length - 1];
  const currentSpaceItems = currentSpaceId === 'lobby' 
    ? [] // Lobby shows nothing after separator
    : [...videoCatalog.slice(0, 3), ...musicCatalog.slice(0, 3)]; // Only show content items, not other spaces

  // File upload hook
  const { uploadMultipleFiles, uploading } = useFileUpload();
  const { spaces: dbSpaces } = useSpaces();

  // Find current space
  const currentSpace = spaces.find(space => space.id === spaceId);
  
  // Redirect if space not found
  useEffect(() => {
    if (!currentSpace && spaceId !== 'lobby') {
      navigate('/');
    }
  }, [currentSpace, spaceId, navigate]);

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
  const handleCreateSpace = (name: string, coverUrl: string) => {
    const newSpace: Space = {
      id: Date.now().toString(),
      name,
      thumb: coverUrl
    };
    setSpaces(prev => [...prev, newSpace]);
  };

  // Handle space deletion
  const handleDeleteSpace = (spaceId: string) => {
    setSpaces(prev => prev.filter(space => space.id !== spaceId));
  };

  // Handle space renaming
  const handleRenameSpace = (spaceId: string, newName: string) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, name: newName } : space
    ));
  };

  // Handle space description update
  const handleUpdateSpaceDescription = (spaceId: string, newDescription: string) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, description: newDescription } : space
    ));
  };

  // Handle space thumbnail update
  const handleUpdateSpaceThumbnail = (spaceId: string, thumbnailUrl: string) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId ? { ...space, thumb: thumbnailUrl } : space
    ));
  };

  // Drag and drop handlers
  const handleFilesDropped = (files: File[]) => {
    setDroppedFiles(files);
    setShowSpaceSelectionModal(true);
  };

  const handleSpaceSelect = async (selectedSpaceId: string) => {
    if (droppedFiles.length > 0) {
      await uploadMultipleFiles(droppedFiles, selectedSpaceId);
      setShowSpaceSelectionModal(false);
      setDroppedFiles([]);
    }
  };

  const handleCreateNewSpace = async (name: string) => {
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name,
      thumb: '/placeholder.svg'
    };
    setSpaces(prev => [...prev, newSpace]);
    
    if (droppedFiles.length > 0) {
      await uploadMultipleFiles(droppedFiles, newSpace.id);
      setShowSpaceSelectionModal(false);
      setDroppedFiles([]);
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
      const existingIndex = navigationPath.indexOf(space.id);
      if (existingIndex >= 0) {
        // Navigate back to this space, trim path
        setNavigationPath(navigationPath.slice(0, existingIndex + 1));
      } else {
        // Append new nested space to breadcrumb path
        setNavigationPath([...navigationPath, space.id]);
      }
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
          <div className="fixed bottom-0 left-0 right-0 z-30">
            <BreadcrumbNavBar 
              navigationPath={navigationPath}
              spaces={spaces}
              currentSpaceItems={currentSpaceItems}
              selectedItemId={selectedItemId}
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
              onNavigate={handleBreadcrumbNavigate}
              onItemSelect={handleItemSelect}
              showChatWindow={showChatWindow}
              onToggleChatWindow={handleToggleChatWindow}
              showCreateSpaceModal={showCreateSpaceModal}
              showAIChat={showAIChat}
              onToggleAIChat={handleToggleAIChat}
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
          onClose={() => setShowCreateSpaceModal(false)}
          onCreate={handleCreateSpace}
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

        <SpaceSelectionModal
          isOpen={showSpaceSelectionModal}
          onClose={() => {
            setShowSpaceSelectionModal(false);
            setDroppedFiles([]);
          }}
          onSpaceSelect={handleSpaceSelect}
          onCreateNewSpace={handleCreateNewSpace}
          spaces={spaces.map(s => ({ id: s.id, name: s.name }))}
          footerSpaces={footerSpaces.map(s => ({ id: s.id, name: s.name }))}
          floors={floors.map(f => ({ id: f.id, name: f.name }))}
          droppedFiles={droppedFiles}
          loading={uploading}
        />
      </div>
      </div>
    </DragDropZone>
  );
}