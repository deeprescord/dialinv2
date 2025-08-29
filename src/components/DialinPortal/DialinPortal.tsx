import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from './TopNav';
import { MobileTabBar } from './MobileTabBar';
import { HomeView } from './HomeView';
import { FriendsView } from './FriendsView';
import { VideosView } from './VideosView';
import { MusicView } from './MusicView';
import { LocationsView } from './LocationsView';
import { FloorsBar } from './FloorsBar';
import { StorageBar } from './StorageBar';
import { ShareMyBar } from './ShareMyBar';
import { FloatingPlayer } from './FloatingPlayer';
import { ContactPane } from './ContactPane';
import { DialPopup } from './DialPopup';
import { CreateFloorModal } from './CreateFloorModal';
import { FloatingChat } from './FloatingChat';
import { 
  videoCatalog, 
  musicCatalog, 
  locations, 
  friends, 
  friendsPosts, 
  initialFloors,
  VideoItem,
  MusicItem,
  LocationItem,
  Friend,
  Floor
} from '@/data/catalogs';
import { VIDEO_GROUPS, MUSIC_GROUPS, LOCATION_GROUPS } from '@/data/constants';
import { applyDials } from '@/lib/filters';

export function DialinPortal() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDials, setSelectedDials] = useState<Record<string, string[]>>({});
  const [pinnedContacts, setPinnedContacts] = useState<Friend[]>(friends.slice(0, 4));
  const [selectedContact, setSelectedContact] = useState<Friend | null>(null);
  const [activeShareToggles, setActiveShareToggles] = useState<string[]>(['personal', 'workEmail']);
  const [floors, setFloors] = useState<Floor[]>(initialFloors);
  const [showCreateFloorModal, setShowCreateFloorModal] = useState(false);
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

  // Handle share toggle
  const handleShareToggleChange = (toggleKey: string) => {
    setActiveShareToggles(prev => 
      prev.includes(toggleKey) 
        ? prev.filter(t => t !== toggleKey)
        : [...prev, toggleKey]
    );
  };

  // Handle floor creation
  const handleCreateFloor = (name: string, coverUrl: string) => {
    const newFloor: Floor = {
      id: Date.now().toString(),
      name,
      thumb: coverUrl
    };
    setFloors(prev => [...prev, newFloor]);
  };

  // Handle floor deletion
  const handleDeleteFloor = (floorId: string) => {
    setFloors(prev => prev.filter(floor => floor.id !== floorId));
  };

  // Handle floor renaming
  const handleRenameFloor = (floorId: string, newName: string) => {
    setFloors(prev => prev.map(floor => 
      floor.id === floorId ? { ...floor, name: newName } : floor
    ));
  };

  // Handle floor reordering
  const handleReorderFloor = (floorId: string, direction: 'left' | 'right') => {
    setFloors(prev => {
      const currentIndex = prev.findIndex(floor => floor.id === floorId);
      if (currentIndex === -1) return prev;

      const newFloors = [...prev];
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= newFloors.length) return prev;

      [newFloors[currentIndex], newFloors[targetIndex]] = [newFloors[targetIndex], newFloors[currentIndex]];
      return newFloors;
    });
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

  const isPinned = selectedContact ? pinnedContacts.some(c => c.id === selectedContact.id) : false;
  const isViewingContact = !!selectedContact;
  const showFloorsBar = ['home', 'friends', 'videos', 'music', 'locations'].includes(currentTab) && !isViewingContact;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <TopNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        selectedChipsCount={selectedChipsCount}
        dialCount={1240}
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

      {/* Bottom Bars */}
      {showFloorsBar && (
        <div className="fixed bottom-16 left-0 right-0 z-30">
          <FloorsBar
            floors={floors}
            onCreateFloor={() => setShowCreateFloorModal(true)}
            onDeleteFloor={handleDeleteFloor}
            onRenameFloor={handleRenameFloor}
            onReorderFloor={handleReorderFloor}
          />
        </div>
      )}

      {isViewingContact ? (
        <ShareMyBar
          activeToggles={activeShareToggles}
          onToggleChange={handleShareToggleChange}
        />
      ) : (
        <StorageBar
          usedGB={560}
          totalTB={1}
        />
      )}

      {/* Overlays */}
      <ContactPane
        isOpen={isViewingContact}
        contact={selectedContact}
        isPinned={isPinned}
        sharedToggles={activeShareToggles}
        onClose={() => setSelectedContact(null)}
        onPin={handleContactPin}
        onUnpin={handleContactUnpin}
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

      <CreateFloorModal
        isOpen={showCreateFloorModal}
        onClose={() => setShowCreateFloorModal(false)}
        onCreate={handleCreateFloor}
      />

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
}
