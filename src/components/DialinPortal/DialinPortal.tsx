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
import { useContactFieldSharing } from '@/hooks/useContactFieldSharing';
import { useSpacesContext } from '@/contexts/SpacesContext';

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
const [spaces, setSpaces] = useState<Space[]>([
  { id: 'lobby', name: 'Lobby', thumb: lobbyPoster }
]);
const { spaces: dbSpaces, createSpace: createDbSpace, updateSpace, deleteSpace, refetch } = useSpacesContext();

useEffect(() => {
  const convertedDbSpaces: Space[] = dbSpaces.map(dbSpace => ({
    id: dbSpace.id,
    name: dbSpace.name,
    thumb: (dbSpace as any).cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
    parentId: (dbSpace as any).parent_id || undefined,
    backgroundImage: (dbSpace as any).cover_url || undefined,
  }));
  setSpaces(prev => {
    const prevLobby = prev.find(s => s.id === 'lobby') || { id: 'lobby', name: 'Lobby', thumb: lobbyPoster };
    const lobby: Space = {
      id: 'lobby',
      name: 'Lobby',
      thumb: prevLobby.thumb || lobbyPoster,
      // Preserve 360 settings across refetches
      show360: prevLobby.show360,
      xAxis: prevLobby.xAxis,
      yAxis: prevLobby.yAxis,
      volume: prevLobby.volume,
      isMuted: prevLobby.isMuted,
      rotationEnabled: prevLobby.rotationEnabled,
      rotationSpeed: prevLobby.rotationSpeed,
    };
    return [lobby, ...convertedDbSpaces];
  });
}, [dbSpaces]);

const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const handleCreateSpace = async (name: string, coverUrl: string, parentId?: string) => {
    // Create space in database
    const newDbSpace = await createDbSpace(name, undefined, parentId);
    
    if (newDbSpace) {
      const newSpace: Space = {
        id: newDbSpace.id,
        name: newDbSpace.name,
        thumb: coverUrl,
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
    // Lobby is a special case - update it in local state only
    if (spaceId === 'lobby') {
      setSpaces(prev => prev.map(space =>
        space.id === 'lobby' ? { ...space, thumb: thumbnailUrl, backgroundImage: thumbnailUrl } : space
      ));
      toast.success('Lobby cover updated');
      return;
    }
    
    // For other spaces, update in database
    const success = await updateSpace(spaceId, { cover_url: thumbnailUrl } as any);
    if (success) {
      // Update local state immediately
      setSpaces(prev => prev.map(space =>
        space.id === spaceId ? { ...space, thumb: thumbnailUrl, backgroundImage: thumbnailUrl } : space
      ));
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
    if (space.id === 'lobby') {
      // Already on lobby (home page)
      return;
    } else {
      navigate(`/space/${space.id}`);
    }
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
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, show360: enabled }
        : space
    ));
  };

  const handle360AxisChange = (spaceId: string, axis: 'x' | 'y', value: number) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, [axis === 'x' ? 'xAxis' : 'yAxis']: value }
        : space
    ));
  };

  const handle360VolumeChange = (spaceId: string, volume: number) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, volume }
        : space
    ));
  };

  const handle360MuteToggle = (spaceId: string, muted: boolean) => {
    setSpaces(prev => prev.map(space => 
      space.id === spaceId 
        ? { ...space, isMuted: muted }
        : space
    ));
  };

  const handle360RotationToggle = (spaceId: string, enabled: boolean) => {
    setSpaces(prev => prev.map(space =>
      space.id === spaceId
        ? { ...space, rotationEnabled: enabled }
        : space
    ));
  };

  const handle360RotationSpeedChange = (spaceId: string, speed: number) => {
    setSpaces(prev => prev.map(space =>
      space.id === spaceId
        ? { ...space, rotationSpeed: speed }
        : space
    ));
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

  // Handle file drop
  const handleFilesDrop = (files: File[], spaceId: string) => {
    console.log(`Files dropped in space ${spaceId}:`, files);
    // TODO: Implement file upload logic to backend
    // For now, just log the action
    files.forEach(file => {
      console.log(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
    });
  };

  // Handle creating new space from file drop
  const handleCreateSpaceFromDrop = (name: string) => {
    const newSpace: Space = {
      id: Date.now().toString(),
      name,
      thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' // Default thumbnail
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
  
  // Get lobby space for 360 settings
  const lobbySpace = spaces.find(space => space.id === 'lobby');
  const show360 = lobbySpace?.show360 || false;

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
        onOpenAddPanel={() => setIsAddModalOpen(true)}
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
            backgroundImage={lobbySpace?.thumb}
            spaceName={lobbySpace?.name}
            spaceDescription={lobbySpace?.description}
            isLobby={true}
            show360={show360}
            xAxisOffset={lobbySpace?.xAxis}
            yAxisOffset={lobbySpace?.yAxis}
            volume={lobbySpace?.volume}
            isMuted={lobbySpace?.isMuted}
            rotationEnabled={lobbySpace?.rotationEnabled}
            rotationSpeed={lobbySpace?.rotationSpeed}
            spaces={spaces}
            onFilesDrop={handleFilesDrop}
            onCreateSpace={handleCreateSpaceFromDrop}
            isAddModalOpen={isAddModalOpen}
            onCloseAddModal={() => setIsAddModalOpen(false)}
            onAddOptionSelect={handleAddOptionSelect}
            onOpenAddPanel={() => setIsAddModalOpen(true)}
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
            spaces={spaces.filter(s => s.id === 'lobby' || s.parentId === undefined)}
            currentSpaceId="lobby"
            onCreateSpace={() => setIsAddModalOpen(true)}
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
            onSpaceClick={handleSpaceClick}
            showChatWindow={showChatWindow}
            onToggleChatWindow={() => setShowChatWindow(!showChatWindow)}
            showCreateSpaceModal={showCreateSpaceModal}
            showAIChat={showAIChat}
            onToggleAIChat={() => setShowAIChat(!showAIChat)}
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
        onToggle360={() => handleToggle360('lobby', !show360)}
        xAxisOffset={lobbySpace?.xAxis || 0}
        yAxisOffset={lobbySpace?.yAxis || 0}
        onAxisChange={(axis, value) => handle360AxisChange('lobby', axis, value)}
        volume={lobbySpace?.volume || 0.5}
        isMuted={lobbySpace?.isMuted || false}
        onVolumeChange={(volume) => handle360VolumeChange('lobby', volume)}
        onMuteToggle={() => handle360MuteToggle('lobby', !lobbySpace?.isMuted)}
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
    </div>
  );
}
