import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '@/components/DialinPortal/TopNav';
import { MobileTabBar } from '@/components/DialinPortal/MobileTabBar';
import { HomeView } from '@/components/DialinPortal/HomeView';
import type { HeroHeaderVideoHandle } from '@/components/DialinPortal/HeroHeaderVideo';
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
  
  // Video controls state
  const [videoState, setVideoState] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
  }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: true,
    hasVideo: false
  });
  const heroRef = React.useRef<HeroHeaderVideoHandle>(null);
  
  // File upload hook
  const { uploadFile, uploading, analyzingWithAI, analyzeWithAI, saveMetadata } = useFileUpload();
  const { spaces: dbSpaces, loading: spacesLoading, updateSpace, deleteSpace, refetch } = useSpacesContext();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Sync UI spaces with database spaces (plus Lobby)
  useEffect(() => {
    const updateSpaces = () => {
      // Get lobby thumbnail and background from localStorage
      const lobbyThumbnail = localStorage.getItem('lobby-thumbnail') || '/media/lobby-poster.png';
      const lobbyBackground = localStorage.getItem('lobby-background') || '/lovable-uploads/cropped-header-bg.png';
      
      const lobby: Space = { 
        id: 'lobby', 
        name: 'Lobby', 
        thumb: lobbyThumbnail,
        backgroundImage: lobbyBackground
      };
      const convertedDbSpaces: Space[] = dbSpaces.map(dbSpace => ({
        id: dbSpace.id,
        name: dbSpace.name,
        thumb: dbSpace.thumbnail_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        parentId: dbSpace.parent_id || undefined,
        backgroundImage: dbSpace.cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        show360: dbSpace.show_360 || false,
        xAxis: dbSpace.x_axis_offset || 0,
        yAxis: dbSpace.y_axis_offset || 0,
        volume: dbSpace.volume || 50,
        isMuted: dbSpace.is_muted !== undefined ? dbSpace.is_muted : true,
        rotationEnabled: dbSpace.rotation_enabled || false,
        rotationSpeed: dbSpace.rotation_speed || 1,
        rotationAxis: (dbSpace.rotation_axis as 'x' | 'y') || 'x',
        flipHorizontal: dbSpace.flip_horizontal || false,
        flipVertical: dbSpace.flip_vertical || false,
      }));

      setSpaces([lobby, ...convertedDbSpaces]);
    };
    
    updateSpaces();
    
    // Listen for lobby updates
    const handleLobbyUpdate = () => {
      updateSpaces();
    };
    
    window.addEventListener('refetch-spaces', handleLobbyUpdate);
    return () => window.removeEventListener('refetch-spaces', handleLobbyUpdate);
  }, [dbSpaces]);
  
  // Listen for refetch events from SpaceContextMenu
  useEffect(() => {
    const handleRefetch = () => {
      refetch();
    };
    
    window.addEventListener('refetch-spaces', handleRefetch);
    return () => window.removeEventListener('refetch-spaces', handleRefetch);
  }, [refetch]);
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [show360Settings, setShow360Settings] = useState(false);
  const [showItemsBar, setShowItemsBar] = useState(false);
  const [itemsPeopleView, setItemsPeopleView] = useState<'items' | 'people'>('items');
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
          thumb: dbSpace.thumbnail_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
          parentId: dbSpace.parent_id || undefined,
          backgroundImage: dbSpace.cover_url || undefined,
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

  // Panel management
  const openPanel = (panelName: 'chat' | 'ai' | 'add') => {
    setShowChatWindow(panelName === 'chat');
    setShowAIChat(panelName === 'ai');
    setIsAddModalOpen(panelName === 'add');
  };

  // Handle add option selection
  const handleAddOptionSelect = (optionId: string) => {
    if (optionId === 'SPACE') {
      setShowCreateSpaceModal(true);
    }
    console.log('Selected option:', optionId);
    setIsAddModalOpen(false);
  };

  // Handle create space from drop
  const handleCreateSpaceFromDrop = async (name: string) => {
    await handleCreateSpace(name, '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png');
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
    // Update local state immediately
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, thumb: thumbnailUrl }
        : space
    ));
    
    // Only persist to database if not lobby
    if (spaceId !== 'lobby') {
      const success = await updateSpace(spaceId, { thumbnail_url: thumbnailUrl });
      if (!success) {
        refetch();
      }
    }
  };

  // Drag and drop handlers - show space selection modal
  const handleFilesDropped = async (files: File[]) => {
    if (files.length === 0) return;
    
    setDroppedFiles(files);
    setShowSpaceSelectionModal(true);
  };

  // Handle space selection for dropped files
  const handleSpaceSelect = async (spaceId: string) => {
    if (droppedFiles.length === 0) return;

    try {
      setShowSpaceSelectionModal(false);
      toast.info(`Uploading ${droppedFiles.length} file(s)...`);

      // Upload all files to the selected space
      const uploadResults = [];
      for (const file of droppedFiles) {
        const result = await uploadFile(file, spaceId);
        if (result) {
          uploadResults.push({ file, result });
        }
      }

      // Refetch spaces to show new files
      if (refetch) refetch();

      // Background AI analysis (non-blocking)
      Promise.all(
        uploadResults.map(async ({ file, result }) => {
          try {
            const aiMetadata = await analyzeWithAI(file, result.id);
            if (aiMetadata) {
              await saveMetadata(
                result.id,
                aiMetadata.hashtags,
                aiMetadata.dial_values,
                true,
                aiMetadata.confidence
              );
            }
          } catch (err) {
            console.error('AI analysis failed for', file.name, err);
          }
        })
      ).then(() => {
        if (refetch) refetch(); // Refetch again after AI metadata is saved
      });

      toast.success(`${droppedFiles.length} file(s) uploaded!`);
      setDroppedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  // Handle create new space from selection modal
  const handleCreateSpaceAndUpload = async (name: string) => {
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
          parent_id: null,
          cover_url: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png'
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
        thumb: data.cover_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        parentId: data.parent_id || undefined
      };

      setSpaces(prev => [...prev, newSpace]);
      toast.success(`Space "${name}" created!`);

      // Upload files to the new space
      await handleSpaceSelect(data.id);
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space');
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

  const handleToggle360 = async (spaceId: string, enabled: boolean) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, show360: enabled }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { show_360: enabled });
    }
  };

  const handle360AxisChange = async (spaceId: string, axis: 'x' | 'y', value: number) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, [axis === 'x' ? 'xAxis' : 'yAxis']: value }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { 
        [axis === 'x' ? 'x_axis_offset' : 'y_axis_offset']: value 
      }, { silent: true });
    }
  };

  const handle360VolumeChange = async (spaceId: string, volume: number) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, volume }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { volume }, { silent: true });
    }
  };

  const handle360MuteToggle = async (spaceId: string, muted: boolean) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, isMuted: muted }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { is_muted: muted });
    }
  };

  const handle360RotationToggle = async (spaceId: string, enabled: boolean) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, rotationEnabled: enabled }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { rotation_enabled: enabled });
    }
  };

  const handle360RotationSpeedChange = async (spaceId: string, speed: number) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, rotationSpeed: speed }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { rotation_speed: speed }, { silent: true });
    }
  };

  const handle360RotationAxisChange = async (spaceId: string, axis: 'x' | 'y') => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, rotationAxis: axis }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { rotation_axis: axis });
    }
  };

  const handleFlipHorizontalToggle = async (spaceId: string, flipped: boolean) => {
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { flip_horizontal: flipped });
    }
  };

  const handleFlipVerticalToggle = async (spaceId: string, flipped: boolean) => {
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { flip_vertical: flipped });
    }
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

  // Video control handlers
  const handleVideoStateChange = (state: typeof videoState) => {
    setVideoState(state);
  };

  const handleVideoPlayPause = () => {
    heroRef.current?.playPause();
    setVideoState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleVideoSeek = (value: number) => {
    heroRef.current?.seek(value);
    setVideoState(prev => ({ ...prev, currentTime: value }));
  };

  const handleVideoVolumeChange = (value: number) => {
    heroRef.current?.setVolume(value);
    setVideoState(prev => ({ ...prev, volume: value, isMuted: value === 0 }));
  };

  const handleVideoMuteToggle = () => {
    heroRef.current?.toggleMute();
    setVideoState(prev => ({ ...prev, isMuted: !prev.isMuted }));
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
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <TopNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          selectedChipsCount={selectedChipsCount}
          dialCount={1240}
          show360={show360}
          onOpen360Settings={handleOpen360Settings}
          onOpenAddPanel={() => openPanel('add')}
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
               rotationEnabled={currentSpace?.rotationEnabled}
               rotationSpeed={currentSpace?.rotationSpeed}
               flipHorizontal={currentSpace?.flipHorizontal}
               flipVertical={currentSpace?.flipVertical}
               spaces={spaces}
               onFilesDrop={handleFilesDropped}
               onCreateSpace={handleCreateSpaceFromDrop}
               isAddModalOpen={isAddModalOpen}
               onCloseAddModal={() => setIsAddModalOpen(false)}
               onAddOptionSelect={handleAddOptionSelect}
               onOpenAddPanel={() => openPanel('add')}
               selectedItem={selectedItemData}
               onVideoStateChange={handleVideoStateChange}
               heroRef={heroRef}
               spaceId={spaceId}
               onItemClick={handleMediaClick}
                showItemsBar={showItemsBar}
                onCloseItemsBar={() => setShowItemsBar(false)}
                itemsPeopleView={itemsPeopleView}
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
              onVideoStateChange={handleVideoStateChange}
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
              onVideoStateChange={handleVideoStateChange}
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
              onVideoStateChange={handleVideoStateChange}
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
            on360RotationToggle={handle360RotationToggle}
            on360RotationSpeedChange={handle360RotationSpeedChange}
            onFlipHorizontalToggle={handleFlipHorizontalToggle}
            onFlipVerticalToggle={handleFlipVerticalToggle}
            onSpaceClick={handleSpaceClick}
            showChatWindow={showChatWindow}
            onToggleChatWindow={handleToggleChatWindow}
            showCreateSpaceModal={showCreateSpaceModal}
            showAIChat={showAIChat}
            onToggleAIChat={handleToggleAIChat}
            videoControlsState={videoState}
            onVideoPlayPause={handleVideoPlayPause}
            onVideoSeek={handleVideoSeek}
            onVideoVolumeChange={handleVideoVolumeChange}
            onVideoMuteToggle={handleVideoMuteToggle}
            onToggleItemsBar={() => {
              setItemsPeopleView('items');
              setShowItemsBar(!showItemsBar);
            }}
            onTogglePeopleBar={() => {
              setItemsPeopleView('people');
              setShowItemsBar(true);
            }}
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

        {/* Space Selection Modal */}
        <SpaceSelectionModal
          isOpen={showSpaceSelectionModal}
          onClose={() => {
            setShowSpaceSelectionModal(false);
            setDroppedFiles([]);
          }}
          onSpaceSelect={handleSpaceSelect}
          onCreateNewSpace={handleCreateSpaceAndUpload}
          spaces={spaces.map(s => ({
            id: s.id,
            name: s.name,
            fileCount: 0,
            thumbnail: s.thumb
          }))}
          droppedFiles={droppedFiles}
        />

        <UploadLoader isUploading={uploading || analyzingWithAI} />
      </div>
    </DragDropZone>
  );
}