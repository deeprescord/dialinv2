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
import { AddOptionsModal } from '@/components/DialinPortal/AddOptionsModal';
import { AddWebLinkModal } from '@/components/DialinPortal/AddWebLinkModal';
import { DragDropZone } from '@/components/DialinPortal/DragDropZone';
import { SpaceSelectionModal } from '@/components/DialinPortal/SpaceSelectionModal';
import { MetadataAdjustmentPanel } from '@/components/DialinPortal/MetadataAdjustmentPanel';
import { UploadLoader } from '@/components/DialinPortal/UploadLoader';
import { useContactFieldSharing } from '@/hooks/useContactFieldSharing';
import { useFileUpload, AIMetadata } from '@/hooks/useFileUpload';
import { useSpacesContext } from '@/contexts/SpacesContext';
import { useMediaQueue } from '@/contexts/MediaQueueContext';
import { useSpaceOrganization } from '@/hooks/useSpaceOrganization';
import { useSpaceItems } from '@/hooks/useSpaceItems';
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
import { SpacePickerModal } from '@/components/DialinPortal/SpacePickerModal';
import type { SortOrder } from '@/types/organization';
import { toast } from 'sonner';

export default function SpacePage() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedDials, setSelectedDials] = useState<Record<string, string[]>>({});
  const [pinnedContacts, setPinnedContacts] = useState<Friend[]>(friends.slice(0, 4));
  const [selectedContact, setSelectedContact] = useState<Friend | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([
    { id: 'lobby', name: 'Home', thumb: '' },
  ]);
  
  // Video controls state
  const [videoState, setVideoState] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
    isLooping: boolean;
  }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: true,
    hasVideo: false,
    isLooping: true
  });
  const heroRef = React.useRef<HeroHeaderVideoHandle>(null);
  
  // File upload hook
  const { uploadFile, uploading, analyzingWithAI, analyzeWithAI, saveMetadata } = useFileUpload();
  const { spaces: dbSpaces, loading: spacesLoading, updateSpace, deleteSpace, refetch } = useSpacesContext();
  const { skipToNext, skipToPrevious, setCurrentSpace, setIsPlaying: setQueuePlaying, isAutoplay } = useMediaQueue();
  const { items: spaceItems } = useSpaceItems(spaceId && spaceId !== 'lobby' ? spaceId : undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lobbyRefreshTrigger, setLobbyRefreshTrigger] = useState(0);
  
  // Sync UI spaces with database spaces (plus Lobby)
  useEffect(() => {
    const updateSpaces = () => {
      // Determine Home (lobby) visuals from backend Home space first, then localStorage, then fallback
      const homeDb = dbSpaces.find(s => (s as any).is_home || (s as any).isHome);
      const lobbyThumbnail = homeDb?.thumbnail_url || localStorage.getItem('lobby-thumbnail') || '';
      const lobbyBackground = homeDb?.cover_url || localStorage.getItem('lobby-background') || '';
      
      const lobby: Space = { 
        id: 'lobby', 
        name: 'Home', 
        thumb: lobbyThumbnail,
        backgroundImage: lobbyBackground,
        isHome: true
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
        isHome: (dbSpace as any).is_home || (dbSpace as any).isHome || false,
        isPublic: dbSpace.is_public || false,
        shareSlug: dbSpace.share_slug || null,
      }));

      setSpaces([lobby, ...convertedDbSpaces]);
    };
    
    updateSpaces();
    
    // Listen for lobby updates
    const handleLobbyUpdate = () => {
      setLobbyRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('refetch-spaces', handleLobbyUpdate);
    return () => window.removeEventListener('refetch-spaces', handleLobbyUpdate);
  }, [dbSpaces, lobbyRefreshTrigger]);
  
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
    { id: 'lobby', name: 'Home' },
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
  const [isWebLinkModalOpen, setIsWebLinkModalOpen] = useState(false);
  const [show360Settings, setShow360Settings] = useState(false);
  const [showItemsBar, setShowItemsBar] = useState(false);
  const [itemsPeopleView, setItemsPeopleView] = useState<'items' | 'people'>('items');
  const [showSpaceSelectionModal, setShowSpaceSelectionModal] = useState(false);
  
  // Organization states
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');
  const [movieMode, setMovieMode] = useState(false);
  const [showSpacePickerModal, setShowSpacePickerModal] = useState(false);
  const [spacePickerAction, setSpacePickerAction] = useState<'add' | 'move' | 'connect'>('add');
  const [selectedOrgItemId, setSelectedOrgItemId] = useState<string | null>(null);
  const [selectedOrgIsSpace, setSelectedOrgIsSpace] = useState(false);
  
  // Organization hook
  const { addToSpace, moveToSpace, connectSpaces } = useSpaceOrganization();

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

  // Sync current space with media queue
  useEffect(() => {
    if (spaceId) {
      setCurrentSpace(spaceId === 'lobby' ? spaces.find(s => s.isHome)?.id || 'lobby' : spaceId);
    }
  }, [spaceId, setCurrentSpace, spaces]);

  // Keep breadcrumb in sync with route (on direct loads/refresh)
  useEffect(() => {
    if (!spaceId || spaceId === 'lobby') {
      setNavigationPath(['lobby']);
    } else {
      // Build the full path by tracing parent relationships
      const buildPath = (targetSpaceId: string): string[] => {
        const space = spaces.find(s => s.id === targetSpaceId);
        if (!space) return ['lobby', targetSpaceId];
        
        if (!space.parentId || space.parentId === 'lobby') {
          return ['lobby', targetSpaceId];
        }
        
        // Recursively build path through parents
        return [...buildPath(space.parentId), targetSpaceId];
      };
      
      setNavigationPath(buildPath(spaceId));
    }
  }, [spaceId, spaces]);

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
    console.log('handleAddOptionSelect called with:', optionId);
    if (optionId === 'space') {
      console.log('Setting isAddModalOpen to false and showCreateSpaceModal to true');
      setIsAddModalOpen(false);
      setShowCreateSpaceModal(true);
    } else if (optionId === 'web') {
      console.log('Opening web link modal');
      setIsAddModalOpen(false);
      setIsWebLinkModalOpen(true);
    }
    console.log('Selected option:', optionId);
  };

  // Handle web link submission
  const handleWebLinkSubmit = async (url: string, title: string) => {
    const targetSpaceId = spaceId || 'lobby';
    
    if (targetSpaceId === 'lobby') {
      toast.error('Cannot add web links to lobby. Please select a space first.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to add web links');
        return;
      }

      // Create a file entry for the web link
      const { data: file, error: fileError } = await supabase
        .from('files')
        .insert({
          owner_id: user.id,
          original_name: title,
          file_type: 'web',
          mime_type: 'text/html',
          storage_path: url, // Store the URL in storage_path
          file_size: 0,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Add to space_files
      const { error: spaceFileError } = await supabase
        .from('space_files')
        .insert({
          space_id: targetSpaceId,
          file_id: file.id,
          added_by: user.id,
        });

      if (spaceFileError) throw spaceFileError;

      toast.success(`Web link "${title}" added to space`);
    } catch (error) {
      console.error('Error adding web link:', error);
      toast.error('Failed to add web link');
    }
  };


  // Handle upload click from AddOptionsModal
  const handleUploadClick = (files: File[]) => {
    handleFilesDropped(files);
    setIsAddModalOpen(false);
  };

  // Handle create space from drop
  const handleCreateSpaceFromDrop = async (name: string) => {
    await handleCreateSpace(name);
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
  const handleCreateSpace = async (name: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create spaces');
        return;
      }

      // If we're in a space (not lobby), create nested space with current space as parent
      const parentId = spaceId && spaceId !== 'lobby' ? spaceId : null;

      const { data, error } = await supabase
        .from('spaces')
        .insert({
          user_id: user.id,
          name,
          description,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating space:', error);
        toast.error('Failed to create space');
        return;
      }

      setShowCreateSpaceModal(false);
      toast.success(`Space "${name}" created successfully`);
      refetch();
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

  // Drag and drop handlers
  const handleFilesDropped = async (files: File[]) => {
    if (files.length === 0) return;
    
    // If we're in a specific space (not lobby), upload directly
    if (spaceId && spaceId !== 'lobby') {
      try {
        toast.info(`Uploading ${files.length} file(s)...`);
        
        const uploadResults = [];
        for (const file of files) {
          const result = await uploadFile(file, spaceId);
          if (result) {
            uploadResults.push({ file, result });
          }
        }
        
        toast.success(`Added ${uploadResults.length} item(s) to space!`);
        refetch();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload files');
      }
    } else {
      // In lobby, show space selection modal
      setDroppedFiles(files);
      setShowSpaceSelectionModal(true);
    }
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

  
  // Handle item 360 toggle
  const handleItem360Toggle = async (itemId: string, enabled: boolean) => {
    // Re-fetch the item with updated 360 settings
    try {
      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();
      
      if (file && !error) {
        setSelectedItemData({
          id: file.id,
          title: file.original_name,
          type: file.file_type,
          storage_path: file.storage_path,
          file_type: file.file_type,
          mime_type: file.mime_type,
          show360: file.show_360,
          xAxisOffset: file.x_axis_offset,
          yAxisOffset: file.y_axis_offset,
          rotationEnabled: file.rotation_enabled,
          rotationSpeed: file.rotation_speed,
          rotationAxis: file.rotation_axis,
          thumb: file.storage_path, // Use storage_path for media
        } as any);
      }
    } catch (error) {
      console.error('Error refreshing item:', error);
    }
  };

  // Handle item selection
  const handleItemSelect = async (itemId: string) => {
    setSelectedItemId(itemId);
    
    // First check if it's a file from the database (including web links)
    try {
      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', itemId)
        .maybeSingle();
      
      if (file) {
        // It's a database item
        if (file.file_type === 'web') {
          // It's a web link - set the URL to display in iframe
          setSelectedItemData({
            id: file.id,
            title: file.original_name,
            type: 'web',
            url: file.storage_path, // For web links, we store the URL in storage_path
            show360: file.show_360,
            xAxisOffset: file.x_axis_offset,
            yAxisOffset: file.y_axis_offset,
            rotationEnabled: file.rotation_enabled,
            rotationSpeed: file.rotation_speed,
            rotationAxis: file.rotation_axis,
          } as any);
          console.log('Selected web link:', file.storage_path);
        } else {
          // It's a regular file - set the storage_path for ContentViewer
          setSelectedItemData({
            id: file.id,
            title: file.original_name,
            type: file.file_type,
            storage_path: file.storage_path,
            file_type: file.file_type,
            mime_type: file.mime_type,
            show360: file.show_360,
            xAxisOffset: file.x_axis_offset,
            yAxisOffset: file.y_axis_offset,
            rotationEnabled: file.rotation_enabled,
            rotationSpeed: file.rotation_speed,
            rotationAxis: file.rotation_axis,
          } as any);
        }
        return;
      }
    } catch (error) {
      console.log('Error fetching file:', error);
    }
    
    // Otherwise find the item data from catalogs
    const item = [...videoCatalog, ...musicCatalog, ...locations].find(i => i.id === itemId);
    setSelectedItemData(item);
    
    // Update hero header to show selected item
    console.log('Selected item:', item);
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
  
  const handleMediaEnd = () => {
    // When autoplay is enabled, advance to the next item within the current space
    if (isAutoplay) {
      handleNextItem();
    }
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
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, flipHorizontal: flipped }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { flip_horizontal: flipped });
    }
  };

  const handleFlipVerticalToggle = async (spaceId: string, flipped: boolean) => {
    // Update local state immediately for responsive UI
    setSpaces(spaces.map(space => 
      space.id === spaceId 
        ? { ...space, flipVertical: flipped }
        : space
    ));
    
    // Persist to database
    if (spaceId !== 'lobby') {
      await updateSpace(spaceId, { flip_vertical: flipped });
    }
  };

  // Handle chat and AI chat toggles
  const handleToggleChatWindow = () => {
    setShowChatWindow(prev => !prev);
    if (showAIChat) setShowAIChat(false);
  };

  const handleToggleAIChat = () => {
    setShowAIChat(prev => !prev);
    if (showChatWindow) setShowChatWindow(false);
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
  const handleVideoStateChange = React.useCallback((state: typeof videoState) => {
    setVideoState(state);
  }, []);

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

  const handleVideoLoopToggle = () => {
    heroRef.current?.toggleLoop();
    setVideoState(prev => ({ ...prev, isLooping: !prev.isLooping }));
  };

  // Handle next/previous item within current space
  const handleNextItem = () => {
    if (!selectedItemData || spaceItems.length === 0) return;
    
    const currentIndex = spaceItems.findIndex(item => item.id === selectedItemData.id);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % spaceItems.length;
    const nextItem = spaceItems[nextIndex];
    
    if (nextItem.is_space) {
      // Navigate to the space
      handleSpaceClick(spaces.find(s => s.id === nextItem.id) as Space);
    } else {
      // Select the file
      handleItemSelect(nextItem.id);
    }
  };

  const handlePreviousItem = () => {
    if (!selectedItemData || spaceItems.length === 0) return;
    
    const currentIndex = spaceItems.findIndex(item => item.id === selectedItemData.id);
    if (currentIndex === -1) return;
    
    const prevIndex = currentIndex === 0 ? spaceItems.length - 1 : currentIndex - 1;
    const prevItem = spaceItems[prevIndex];
    
    if (prevItem.is_space) {
      // Navigate to the space
      handleSpaceClick(spaces.find(s => s.id === prevItem.id) as Space);
    } else {
      // Select the file
      handleItemSelect(prevItem.id);
    }
  };

  // Organization handlers
  const handleOrgAdd = (itemId: string, isSpace: boolean) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(isSpace);
    setSpacePickerAction('add');
    setShowSpacePickerModal(true);
  };

  const handleOrgMove = (itemId: string, isSpace: boolean) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(isSpace);
    setSpacePickerAction('move');
    setShowSpacePickerModal(true);
  };

  const handleOrgConnect = (itemId: string) => {
    setSelectedOrgItemId(itemId);
    setSelectedOrgIsSpace(true);
    setSpacePickerAction('connect');
    setShowSpacePickerModal(true);
  };

  const handleOrgDelete = async (itemId: string, isSpace: boolean) => {
    if (!currentSpaceId) return;
    
    try {
      if (isSpace) {
        await handleDeleteSpace(itemId);
      } else {
        const { error } = await supabase
          .from('space_files')
          .delete()
          .match({ space_id: currentSpaceId, file_id: itemId });
        
        if (error) throw error;
        toast.success('Item removed from space');
        refetch();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const handleSpacePickerSelect = async (targetSpaceId: string) => {
    if (!selectedOrgItemId || !currentSpaceId) return;

    try {
      if (spacePickerAction === 'add') {
        await addToSpace(selectedOrgItemId, targetSpaceId, selectedOrgIsSpace);
        toast.success('Added to space');
      } else if (spacePickerAction === 'move') {
        await moveToSpace(selectedOrgItemId, currentSpaceId, targetSpaceId, selectedOrgIsSpace);
        toast.success('Moved to space');
      } else if (spacePickerAction === 'connect') {
        await connectSpaces(selectedOrgItemId, targetSpaceId);
        toast.success('Spaces connected');
      }
      
      setShowSpacePickerModal(false);
      setSelectedOrgItemId(null);
      refetch();
    } catch (error) {
      console.error('Organization action failed:', error);
      toast.error('Action failed');
    }
  };

  const isPinned = selectedContact ? pinnedContacts.some(c => c.id === selectedContact.id) : false;
  const isViewingContact = !!selectedContact;
  const showSpacesBar = ['home', 'friends', 'videos', 'music', 'locations'].includes(currentTab) && !isViewingContact;

  // Get background image
  const backgroundImage = currentSpace?.backgroundImage || currentSpace?.thumb || '';
  
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
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          movieMode={movieMode}
          onMovieModeToggle={() => setMovieMode(!movieMode)}
          spaceId={spaceId}
          isPublic={spaces.find(s => s.id === spaceId)?.isPublic}
          shareSlug={spaces.find(s => s.id === spaceId)?.shareSlug}
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
                spaceName={currentSpace?.name || 'Home'}
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
                
                onCreateSpace={handleCreateSpaceFromDrop}
                isAddModalOpen={isAddModalOpen}
                onCloseAddModal={() => setIsAddModalOpen(false)}
                onAddOptionSelect={handleAddOptionSelect}
                onOpenAddPanel={() => openPanel('add')}
                selectedItem={selectedItemData}
                onVideoStateChange={handleVideoStateChange}
                heroRef={heroRef}
                onMediaEnd={handleMediaEnd}
                spaceId={spaceId}
                onItemClick={handleMediaClick}
                showItemsBar={showItemsBar}
                onCloseItemsBar={() => setShowItemsBar(false)}
                itemsPeopleView={itemsPeopleView}
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
                on360RotationAxisChange={handle360RotationAxisChange}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                movieMode={movieMode}
                onMovieModeToggle={() => setMovieMode(!movieMode)}
                onItem360Toggle={handleItem360Toggle}
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
            breadcrumbs={navigationPath.map(id => ({
              id,
              name: spaces.find(s => s.id === id)?.name || id
            }))}
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
            onItemClick={handleMediaClick}
            showChatWindow={showChatWindow}
            onToggleChatWindow={handleToggleChatWindow}
            showCreateSpaceModal={showCreateSpaceModal}
            showAIChat={showAIChat}
            onToggleAIChat={handleToggleAIChat}
            onToggleAddModal={() => setIsAddModalOpen(prev => !prev)}
            videoControlsState={videoState}
            onVideoPlayPause={handleVideoPlayPause}
            onVideoSeek={handleVideoSeek}
            onVideoVolumeChange={handleVideoVolumeChange}
            onVideoMuteToggle={handleVideoMuteToggle}
            onVideoLoopToggle={handleVideoLoopToggle}
            onNextItem={handleNextItem}
            onPreviousItem={handlePreviousItem}
            onToggleItemsBar={() => {
              if (showItemsBar && itemsPeopleView === 'items') {
                // Currently showing items - close it
                setShowItemsBar(false);
              } else {
                // Either closed or showing people - open items
                setItemsPeopleView('items');
                setShowItemsBar(true);
              }
            }}
            onTogglePeopleBar={() => {
              if (showItemsBar && itemsPeopleView === 'people') {
                // Currently showing people - close it
                setShowItemsBar(false);
              } else {
                // Either closed or showing items - open people
                setItemsPeopleView('people');
                setShowItemsBar(true);
              }
            }}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
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
          onCreate={(name, description) => {
            handleCreateSpace(name, description);
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

        <AddOptionsModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onOptionSelect={handleAddOptionSelect}
          onUploadClick={handleUploadClick}
        />

        <AddWebLinkModal
          isOpen={isWebLinkModalOpen}
          onClose={() => setIsWebLinkModalOpen(false)}
          onSubmit={handleWebLinkSubmit}
        />

        <Settings360Modal
          isOpen={show360Settings}
          onClose={() => setShow360Settings(false)}
          show360={show360}
          onToggle360={() => handleToggle360(spaceId || 'lobby', !show360)}
          xAxisOffset={currentSpace?.xAxis}
          yAxisOffset={currentSpace?.yAxis}
          onAxisChange={(axis, value) => handle360AxisChange(spaceId || 'lobby', axis, value)}
          volume={(currentSpace?.volume ?? 50) / 100}
          isMuted={currentSpace?.isMuted ?? true}
          onVolumeChange={(volume) => handle360VolumeChange(spaceId || 'lobby', volume * 100)}
          onMuteToggle={() => handle360MuteToggle(spaceId || 'lobby', !currentSpace?.isMuted)}
          rotationEnabled={currentSpace?.rotationEnabled}
          onRotationToggle={() => handle360RotationToggle(spaceId || 'lobby', !currentSpace?.rotationEnabled)}
          rotationSpeed={currentSpace?.rotationSpeed}
          onRotationSpeedChange={(speed) => handle360RotationSpeedChange(spaceId || 'lobby', speed)}
          flipHorizontal={currentSpace?.flipHorizontal}
          flipVertical={currentSpace?.flipVertical}
          onFlipHorizontalToggle={() => handleFlipHorizontalToggle(spaceId || 'lobby', !currentSpace?.flipHorizontal)}
          onFlipVerticalToggle={() => handleFlipVerticalToggle(spaceId || 'lobby', !currentSpace?.flipVertical)}
        />

        <SpacePickerModal
          open={showSpacePickerModal}
          onClose={() => setShowSpacePickerModal(false)}
          onSelect={handleSpacePickerSelect}
          currentSpaceId={currentSpaceId}
          title={
            spacePickerAction === 'add' ? 'Add to Space' :
            spacePickerAction === 'move' ? 'Move to Space' :
            'Connect Spaces'
          }
          description={
            spacePickerAction === 'add' ? 'Select a space to add this item to (keeps it in current space too)' :
            spacePickerAction === 'move' ? 'Select a space to move this item to (removes from current space)' :
            'Select a space to connect with'
          }
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