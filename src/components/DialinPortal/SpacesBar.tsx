import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Package, Users, FileText, Music, Video, Image as ImageIcon, Folder, GripVertical, Play } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableItem } from './DraggableItem';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';
import { VideoControls } from './VideoControls';
import { PinnedContactsRow } from './PinnedContactsRow';
import { ContactsPanel } from './ContactsPanel';
import audioVisualizer from '@/assets/audio-visualizer-animated.gif';
import defaultVideoThumb from '@/assets/video-thumbnails.jpg';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Friend } from '@/data/catalogs';
import { sortItems } from '@/lib/sortItems';
import { safeLocalStorage } from '@/lib/safeLocalStorage';
import type { SortOrder } from '@/types/organization';
import { useSpaceOrganization } from '@/hooks/useSpaceOrganization';
import { useMediaQueue } from '@/contexts/MediaQueueContext';
interface SpacesBarProps {
  spaces: Space[];
  currentSpaceId?: string;
  onCreateSpace: () => void;
  onDeleteSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription: (spaceId: string, newDescription: string) => void;
  onUpdateSpaceThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorderSpace: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  on360RotationToggle?: (spaceId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (spaceId: string, speed: number) => void;
  on360RotationAxisChange?: (spaceId: string, axis: 'x' | 'y') => void;
  onFlipHorizontalToggle?: (spaceId: string, flipped: boolean) => void;
  onFlipVerticalToggle?: (spaceId: string, flipped: boolean) => void;
  onSpaceClick?: (space: Space) => void;
  onItemClick?: (item: any) => void;
  breadcrumbs?: Array<{ id: string; name: string }>;
  hideActionButtons?: boolean;
  hideNewButton?: boolean;
  hideAIButton?: boolean;
  hideChatButton?: boolean;
  onToggleAIChat?: () => void;
  onToggleChatWindow?: () => void;
  onToggleAddModal?: () => void;
  onToggleDOSPanel?: () => void;
  videoControlsState?: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
    isLooping?: boolean;
  };
  onVideoPlayPause?: () => void;
  onVideoSeek?: (value: number) => void;
  onVideoVolumeChange?: (value: number) => void;
  onVideoMuteToggle?: () => void;
  onVideoLoopToggle?: () => void;
  onNextItem?: () => void;
  onPreviousItem?: () => void;
  onToggleItemsBar?: () => void;
  onTogglePeopleBar?: () => void;
  pinnedContacts?: Friend[];
  onContactClick?: (contact: Friend) => void;
  showPeopleBar?: boolean;
  isHome?: boolean;
  sortOrder?: SortOrder;
  onSortChange?: (sort: SortOrder) => void;
  onMovieModeToggle?: () => void;
}

export function SpacesBar({
  spaces,
  currentSpaceId,
  onCreateSpace,
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
  onFlipHorizontalToggle,
  onFlipVerticalToggle,
  onSpaceClick,
  onItemClick,
  breadcrumbs,
  hideActionButtons = false,
  hideNewButton = false,
  hideAIButton = false,
  hideChatButton = false,
  onToggleAIChat,
  onToggleChatWindow,
  onToggleAddModal,
  onToggleDOSPanel,
  videoControlsState,
  onVideoPlayPause,
  onVideoSeek,
  onVideoVolumeChange,
  onVideoMuteToggle,
  onVideoLoopToggle,
  onNextItem,
  onPreviousItem,
  onToggleItemsBar,
  onTogglePeopleBar,
  pinnedContacts = [],
  onContactClick,
  showPeopleBar = false,
  isHome = false,
  sortOrder: propSortOrder,
  onSortChange: propOnSortChange,
  onMovieModeToggle
}: SpacesBarProps) {
  const { isAutoplay, setIsAutoplay, repeatMode, setRepeatMode } = useMediaQueue();
  const navigate = useNavigate();
  const { reorderItems } = useSpaceOrganization();
  
  const [scale, setScale] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('spaces-bar-scale');
    return saved ? parseInt(saved) : 65;
  });
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScale, setDragStartScale] = useState(65);
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const [showContactsPanel, setShowContactsPanel] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});
  const [loadingThumbs, setLoadingThumbs] = useState(true);
  const [internalSortOrder, setInternalSortOrder] = useState<SortOrder>('custom');
  
  // Use prop sortOrder if provided, otherwise use internal state
  const sortOrder = propSortOrder ?? internalSortOrder;
  const setSortOrder = propOnSortChange ?? setInternalSortOrder;

  // Set up drag sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag end event for reordering items
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !currentSpaceId || sortOrder !== 'custom') return;
    
    const oldIndex = spaceItems.findIndex(item => item.id === active.id);
    const newIndex = spaceItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newItems = [...spaceItems];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    const itemIds = newItems.map(item => item.id);
    const isSpaces = newItems.map(item => item.is_space);
    
    await reorderItems(currentSpaceId, itemIds, isSpaces);
    refetchItems();
  };

  // Persist scale to safeLocalStorage
  useEffect(() => {
    safeLocalStorage.setItem('spaces-bar-scale', scale.toString());
  }, [scale]);

  // Handle resize bar drag
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    setDragStartY(e.clientY);
    setDragStartScale(scale);
  };

  useEffect(() => {
    if (!isDraggingResize) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragStartY - e.clientY; // Inverted: drag up = bigger
      const scaleChange = Math.round(deltaY / 2); // 2px movement = 1% scale change
      const newScale = Math.max(25, Math.min(200, dragStartScale + scaleChange));
      setScale(newScale);
    };

    const handleMouseUp = () => {
      setIsDraggingResize(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingResize, dragStartY, dragStartScale]);

  // Fetch items for selected space
  const { items: rawSpaceItems, refetch: refetchItems } = useSpaceItems(currentSpaceId && currentSpaceId !== 'lobby' ? currentSpaceId : undefined);
  
  // Sort items based on selected sort order
  const spaceItems = React.useMemo(() => {
    console.log('SpacesBar sorting items with order:', sortOrder, 'Item count:', rawSpaceItems.length);
    const sorted = sortItems(rawSpaceItems, sortOrder);
    console.log('SpacesBar first 3 items after sort:', sorted.slice(0, 3).map(i => ({ name: i.original_name, created: i.created_at })));
    return sorted;
  }, [rawSpaceItems, sortOrder]);
  
  // Auto-generate thumbnails for images in this bar missing them (connect to thumbnail wizard)
  useEffect(() => {
    const generateMissingThumbs = async () => {
      const missing = rawSpaceItems.filter(
        (it: any) => it.file_type === 'image' && !it.thumbnail_path && it.storage_path
      );
      if (missing.length === 0) return;
      const batchSize = 5;
      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (file: any) => {
            try {
              await supabase.functions.invoke('generate-thumbnail', {
                body: {
                  fileId: file.id,
                  storagePath: file.storage_path,
                  mimeType: file.mime_type || 'image/jpeg',
                }
              });
            } catch (err) {
              console.warn('Thumb gen error for', file.id, err);
            }
          })
        );
      }
    };
    if (rawSpaceItems.length > 0) generateMissingThumbs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSpaceItems]);

  const [sharedUsers, setSharedUsers] = React.useState<Friend[]>([]);
  const [allContacts, setAllContacts] = React.useState<Friend[]>([]);
  
  // Fetch all users/contacts from profiles table
  React.useEffect(() => {
    const fetchAllContacts = async () => {
      if (!showPeopleBar) {
        setAllContacts([]);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_media_url')
          .neq('user_id', user.id); // Exclude current user
          
        if (error) throw error;
        
        const contacts: Friend[] = (profiles || []).map(p => ({
          id: p.user_id,
          name: p.full_name || 'Unknown',
          avatar: p.profile_media_url || '/placeholder.svg',
          status: 'offline' as const
        }));
          
        setAllContacts(contacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setAllContacts([]);
      }
    };
    
    if (showPeopleBar) {
      fetchAllContacts();
    }
  }, [showPeopleBar]);

  // Calculate scaled sizes
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const thumbWidth = getScaled(160); // Larger width
  const thumbHeight = getScaled(240); // Double height for more vertical space
  const buttonSize = getScaled(108);
  const iconSize = getScaled(34);
  const actionButtonIconSize = getScaled(17);
  const spacing = getScaled(16); // Increased from 12 for more space between items
  const padding = getScaled(6);
  const fontSize = 'text-xs'; // Smaller font to prevent overflow

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    setWasLongPress(false);
    const timer = setTimeout(() => {
      // Show SpaceContextMenu on long press
      setWasLongPress(true);
      setContextMenu({
        space,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500); // 500ms press and hold
    setPressTimer(timer);
  };

  const handleContextMenu = (space: Space, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      space,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      if (!currentSpaceId) throw new Error('No current space id');
      const { error } = await supabase
        .from('space_files')
        .delete()
        .match({ space_id: currentSpaceId, file_id: itemId });
      
      if (error) throw error;
      toast.success('Removed from space');
      setShowDialPopup(false);
      refetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to remove');
    }
  };

  const handleRenameItem = async (itemId: string, newName: string) => {
    try {
      const name = newName.trim();
      if (!name) throw new Error('Empty name');
      const { error } = await supabase
        .from('files')
        .update({ original_name: name })
        .eq('id', itemId);
      
      if (error) throw error;
      toast.success('Item renamed');
      setShowDialPopup(false);
      refetchItems();
    } catch (error) {
      console.error('Error renaming item:', error);
      toast.error('Failed to rename');
    }
  };

  const handleUseAsFilters = () => {
    setShowDialPopup(false);
    setDialPopupItem(null);
  };

  const handleAddOptionSelect = (optionId: string) => {
    if (optionId === 'space') {
      onCreateSpace();
    }
    // Handle other options as needed
    console.log('Add option selected:', optionId);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Use spaces from database, with home space first (already ordered correctly from useSpaces hook)
  const allSpaces: Space[] = spaces;

  const handleSpaceClick = (space: Space) => {
    if (onSpaceClick) {
      onSpaceClick(space);
    } else {
      if (space.isHome) {
        navigate('/');
      } else {
        navigate(`/space/${space.id}`);
      }
    }
  };

  // State to hold pre-signed media URLs (for immediate playback)
  const [mediaUrls, setMediaUrls] = React.useState<Record<string, { mediaUrl?: string; thumbUrl?: string; fileData?: any }>>({});
  
  // Optimized: Batch signed URL generation with localStorage cache (TTL) - now includes media URLs
  React.useEffect(() => {
    if (spaceItems.length > 0) {
      setLoadingThumbs(true);
    }
  }, [spaceItems.length]);
  
  React.useEffect(() => {
    const generateUrls = async () => {
      const thumbs: Record<string, string> = {};
      const medias: Record<string, { mediaUrl?: string; thumbUrl?: string; fileData?: any }> = {};
      const filesToProcess: Array<{ id: string; path: string; bucket: 'user-files' | 'space-covers' }>= [];

      const now = Date.now();
      const getCache = (bucket: string, path: string): string | undefined => {
        try {
          const raw = safeLocalStorage.getItem(`signed-url-cache:${bucket}:${path}`);
          if (!raw) return undefined;
          const parsed = JSON.parse(raw) as { url: string; exp: number };
          if (!parsed?.url || !parsed?.exp || parsed.exp < now) {
            safeLocalStorage.removeItem(`signed-url-cache:${bucket}:${path}`);
            return undefined;
          }
          return parsed.url;
        } catch { return undefined; }
      };
      const setCache = (bucket: string, path: string, url: string) => {
        try {
          const ttlMs = 25 * 60 * 1000; // 25 minutes
          safeLocalStorage.setItem(
            `signed-url-cache:${bucket}:${path}`,
            JSON.stringify({ url, exp: now + ttlMs })
          );
        } catch {}
      };

      // Check if current space is public
      const isPublicSpace = allSpaces.find(s => s.id === currentSpaceId)?.isPublic || false;
      
      // Lightweight: Only fetch thumbnails upfront, use public URLs for public spaces
      const fileDataPromises = spaceItems.map(async (item) => {
        if (item.is_space) return null;
        
        try {
          const { data: fileData, error } = await supabase
            .from('files')
            .select('*')
            .eq('id', item.id)
            .maybeSingle();
          
          if (!fileData || error) return null;
          
          // Get thumbnail URL only (lightweight) with smart fallbacks
          let thumbUrl: string | undefined;
          // Preferred: explicit thumbnail_path
          if (fileData.thumbnail_path) {
            if (fileData.thumbnail_path.startsWith('space-covers/')) {
              const { data } = supabase.storage.from('space-covers').getPublicUrl(fileData.thumbnail_path);
              thumbUrl = data.publicUrl;
            } else {
              const normThumb = fileData.thumbnail_path.replace(/^user-files\//, '');
              const cachedThumb = getCache('user-files', normThumb);
              if (cachedThumb) {
                thumbUrl = cachedThumb;
              } else {
                const { data: signedThumb } = await supabase.storage.from('user-files').createSignedUrl(normThumb, 3600);
                thumbUrl = signedThumb?.signedUrl;
                if (thumbUrl) setCache('user-files', normThumb, thumbUrl);
              }
            }
          } else if (fileData.file_type === 'image' && fileData.storage_path) {
            // Fallback: use original image until a thumbnail is generated
            const normOriginal = fileData.storage_path.replace(/^user-files\//, '');
            const cachedOrig = getCache('user-files', normOriginal);
            if (cachedOrig) {
              thumbUrl = cachedOrig;
            } else {
              const { data: signedOrig } = await supabase.storage.from('user-files').createSignedUrl(normOriginal, 3600);
              thumbUrl = signedOrig?.signedUrl;
              if (thumbUrl) setCache('user-files', normOriginal, thumbUrl);
            }
          } else if (fileData.file_type?.startsWith('video') && fileData.storage_path) {
            // Use signed original video URL so we can render a real preview loop
            const normVideo = fileData.storage_path.replace(/^user-files\//, '');
            const cachedVid = getCache('user-files', normVideo);
            if (cachedVid) {
              thumbUrl = cachedVid;
            } else {
              const { data: signedVid } = await supabase.storage.from('user-files').createSignedUrl(normVideo, 3600);
              thumbUrl = signedVid?.signedUrl;
              if (thumbUrl) setCache('user-files', normVideo, thumbUrl);
            }
          }
          
          // Store thumbnail for carousel display
          if (thumbUrl) {
            thumbs[item.id] = thumbUrl;
          }
          
          // Store file metadata only (no media URL pre-signing)
          medias[item.id] = {
            thumbUrl,
            fileData: {
              ...fileData,
              storage_path: fileData.storage_path?.replace(/^user-files\//, ''),
              isPublicSpace, // Pass this info for on-demand signing
            }
          };
          
          return null;
        } catch (error) {
          console.error('Error pre-fetching file data for', item.id, error);
          return null;
        }
      });
      
      await Promise.allSettled(fileDataPromises);
      
      setThumbUrls((prev) => ({ ...prev, ...thumbs }));
      setMediaUrls((prev) => ({ ...prev, ...medias }));
      setLoadingThumbs(false);
    };

    if (spaceItems.length > 0) {
      generateUrls();
    } else {
      setThumbUrls({});
      setMediaUrls({});
      setLoadingThumbs(false);
    }
  }, [spaceItems]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image')) return <ImageIcon size={iconSize * 0.4} />;
    if (fileType.startsWith('video')) return <Video size={iconSize * 0.4} />;
    if (fileType.startsWith('audio')) return <img src={audioVisualizer} alt="Playing" className="w-full h-full object-contain" />;
    if (fileType === 'space') return <ImageIcon size={iconSize * 0.4} />;
    return <FileText size={iconSize * 0.4} />;
  };

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const clean = url.split('?')[0].split('#')[0];
    return /(\.mp4|\.webm|\.ogg|\.mov)$/i.test(clean);
  };
  return (
    <>
      <div className="relative overflow-x-auto scrollbar-thin" style={{ padding: `${padding}px`, paddingTop: '16px' }}>
        <div className="inline-flex items-start w-max bg-gradient-to-t from-black/20 via-black/10 to-transparent rounded-2xl backdrop-blur-sm" style={{ gap: `${spacing}px`, minHeight: `${thumbHeight + 50}px`, padding: `${padding}px` }}>
          {showPeopleBar ? (
            // Show people/contacts instead of spaces
            allContacts.map((contact, idx) => (
              <motion.div 
                key={contact.id} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.2, delay: idx * 0.05 }} 
                className="flex-shrink-0" 
                style={{ width: `${thumbWidth}px` }}
              >
                <div 
                  className="flex flex-col items-center cursor-pointer group select-none relative" 
                  style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }} 
                  onClick={() => onContactClick?.(contact)}
                >
                  <div 
                    className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 flex-shrink-0" 
                    style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
                  >
                    <ImageFallback 
                      src={contact.avatar} 
                      alt={contact.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span 
                    className={`${fontSize} font-medium text-center overflow-hidden text-ellipsis text-white`} 
                    style={{ 
                      width: `${thumbWidth}px`, 
                      height: '2.5rem', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical' 
                    }}
                  >
                    {contact.name}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            // Show spaces as before
            <>
              {currentSpaceId && currentSpaceId !== 'lobby' && breadcrumbs && breadcrumbs.length > 0 ? (
                <>
                  {breadcrumbs.map((breadcrumb, idx) => {
                    const space = allSpaces.find(s => s.id === breadcrumb.id) || { id: breadcrumb.id, name: breadcrumb.name, thumb: '' } as any;
                    const isCurrentSpace = idx === breadcrumbs.length - 1;
                    return (
                      <motion.div key={space.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} className="flex-shrink-0" style={{ width: `${thumbWidth}px` }}>
                        <div className="flex flex-col items-center cursor-pointer group select-none relative" style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }} onClick={() => handleSpaceClick(space)} onMouseDown={(e) => handleMouseDown(space, e)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onContextMenu={(e) => handleContextMenu(space, e)}>
                          {isCurrentSpace && (
                            <div className="absolute left-1/2 -translate-x-1/2 -top-2">
                              <div className="border-l-transparent border-r-transparent border-b-primary" style={{ width: 0, height: 0, borderLeftWidth: `${getScaled(8)}px`, borderRightWidth: `${getScaled(8)}px`, borderBottomWidth: `${getScaled(8)}px`, borderStyle: 'solid' }}></div>
                            </div>
                          )}
                          <div className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 flex-shrink-0" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                            {(() => {
                              const lobbySpace = allSpaces.find(s => s.id === 'lobby');
                              const dbHomeSpace = allSpaces.find(s => (s as any).is_home || (s as any).isHome);
                              const homeSpace = lobbySpace || dbHomeSpace;
                              const isHomeCrumb = breadcrumb.id === 'lobby' || breadcrumb.name?.toLowerCase() === 'home' || (space as any).is_home || (space as any).isHome;
                              const pickBest = (obj: any) => {
                              const ordered = [obj?.thumb, obj?.thumbnail_url, obj?.cover_url].filter(Boolean) as string[];
                              const imageFirst = ordered.find(u => !isVideoUrl(u));
                              return imageFirst || ordered[0] || '';
                              };
                              const chosen = isHomeCrumb && homeSpace ? pickBest(homeSpace as any) : pickBest(space as any);
                              return isVideoUrl(chosen) ? (
                                <video
                                  src={chosen}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  loop
                                  preload="metadata"
                                  onLoadedMetadata={(e) => {
                                    const video = e.currentTarget;
                                    video.currentTime = 0.1;
                                    video.pause();
                                  }}
                                />
                              ) : (
                                <ImageFallback src={chosen} alt={space.name} className="w-full h-full object-cover" />
                              );
                            })()}
                          </div>
                          <span className={`${fontSize} font-medium text-center overflow-hidden text-ellipsis ${isCurrentSpace ? 'text-primary' : ''}`} style={{ width: `${thumbWidth}px`, height: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{space.name}</span>
                        </div>
                      </motion.div>
                    );
                  })}

                  <div className="w-px bg-white/20 flex-shrink-0 mx-2 self-center" style={{ height: `${thumbHeight}px` }}></div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={spaceItems.map(i => i.id)} strategy={rectSortingStrategy}>
                      {!showPeopleBar && spaceItems.map((item, idx) => {
                        const isSpace = item.is_space;
                        const itemContent = (
                          <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} className="flex-shrink-0" style={{ width: `${thumbWidth}px` }}>
                            <div 
                              className="flex flex-col items-center cursor-pointer group select-none" 
                              style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }} 
                              onClick={() => {
                                if (wasLongPress) return;
                                if (isSpace) {
                                  handleSpaceClick({ id: item.id, name: item.original_name, thumb: thumbUrls[item.id] || '/placeholder.svg' } as any);
                                } else {
                                  // Sign media URL on-demand when clicked (lightweight)
                                  (async () => {
                                    const cached = mediaUrls[item.id];
                                    if (!cached?.fileData) {
                                      toast.error('Media data not loaded');
                                      return;
                                    }
                                    
                                    const fileData = cached.fileData;
                                    const normPath = fileData.storage_path;
                                    
                                    // Check cache with localStorage
                                    const now = Date.now();
                                    const getCached = (bucket: string, path: string): string | undefined => {
                                      try {
                                        const raw = safeLocalStorage.getItem(`signed-url-cache:${bucket}:${path}`);
                                        if (!raw) return undefined;
                                        const parsed = JSON.parse(raw) as { url: string; exp: number };
                                        if (!parsed?.url || !parsed?.exp || parsed.exp < now) {
                                          safeLocalStorage.removeItem(`signed-url-cache:${bucket}:${path}`);
                                          return undefined;
                                        }
                                        return parsed.url;
                                      } catch { return undefined; }
                                    };
                                    const setCached = (bucket: string, path: string, url: string) => {
                                      try {
                                        const ttlMs = 25 * 60 * 1000;
                                        safeLocalStorage.setItem(
                                          `signed-url-cache:${bucket}:${path}`,
                                          JSON.stringify({ url, exp: now + ttlMs })
                                        );
                                      } catch {}
                                    };
                                    
                                    // Sign URL on-demand or use public URL for public spaces
                                    let mediaUrl: string | undefined;
                                      if (fileData.file_type === 'web') {
                                        mediaUrl = fileData.storage_path;
                                      } else if (normPath) {
                                        const cacheKey = getCached('user-files', normPath);
                                        if (cacheKey) {
                                          mediaUrl = cacheKey;
                                        } else {
                                          const { data: signed, error } = await supabase.storage.from('user-files').createSignedUrl(normPath, 3600);
                                          if (error) {
                                            console.warn('Failed to sign URL:', error);
                                            toast.error('Failed to load media');
                                            return;
                                          }
                                          mediaUrl = signed?.signedUrl;
                                          if (mediaUrl) setCached('user-files', normPath, mediaUrl);
                                        }
                                      }
                                    
                                    if (!mediaUrl) {
                                      toast.error('No media URL available');
                                      return;
                                    }
                                    
                                    console.log('SpacesBar onClick: Signed URL on-demand', { id: item.id, file_type: fileData?.file_type, url: mediaUrl });
                                    
                                    onItemClick?.({
                                      ...item,
                                      url: mediaUrl,
                                      thumb: cached.thumbUrl || mediaUrl,
                                      storage_path: normPath,
                                      file_type: fileData?.file_type,
                                      mime_type: fileData?.mime_type,
                                      original_name: fileData?.original_name,
                                      show360: fileData?.show_360,
                                      xAxisOffset: fileData?.x_axis_offset,
                                      yAxisOffset: fileData?.y_axis_offset,
                                      rotationEnabled: fileData?.rotation_enabled,
                                      rotationSpeed: fileData?.rotation_speed,
                                      rotationAxis: fileData?.rotation_axis,
                                    });
                                  })();
                                }
                              }}
                              onMouseDown={(e) => {
                                if (!isSpace) {
                                  setWasLongPress(false);
                                  const timer = setTimeout(() => {
                                    setWasLongPress(true);
                                    setDialPopupItem({ id: item.id, title: item.original_name, thumb: thumbUrls[item.id], type: item.file_type });
                                    setShowDialPopup(true);
                                  }, 500);
                                  setPressTimer(timer);
                                }
                              }}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseLeave}
                              onTouchStart={(e) => {
                                if (!isSpace) {
                                  setWasLongPress(false);
                                  const timer = setTimeout(() => {
                                    setWasLongPress(true);
                                    setDialPopupItem({ id: item.id, title: item.original_name, thumb: thumbUrls[item.id], type: item.file_type });
                                    setShowDialPopup(true);
                                  }, 500);
                                  setPressTimer(timer);
                                }
                              }}
                            >
                              <div className="relative rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                                {(() => {
                                  const url = thumbUrls[item.id];
                                  if (loadingThumbs && !url) {
                                    return (
                                      <div className="w-full h-full bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30 animate-pulse relative overflow-hidden">
                                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                      </div>
                                    );
                                  }
                                  if (url) {
                                    return isVideoUrl(url) ? (
                                      <video
                                        src={url}
                                        className="w-full h-full object-cover animate-fade-in"
                                        autoPlay
                                        muted
                                        playsInline
                                        preload="metadata"
                                        onTimeUpdate={(e) => {
                                          const v = e.currentTarget;
                                          if (!Number.isNaN(v.currentTime) && v.currentTime >= 15) {
                                            v.currentTime = 0;
                                            v.play().catch(() => {});
                                          }
                                        }}
                                      />
                                    ) : (
                                      <ImageFallback src={url} alt={item.original_name} className="w-full h-full object-cover animate-fade-in" />
                                    );
                                  }
                                  return (
                                    <div className="w-full h-full bg-background/60 flex items-center justify-center">
                                      {isSpace ? <Folder className="w-1/2 h-1/2 text-muted-foreground" /> : getFileIcon(item.file_type)}
                                    </div>
                                  );
                                })()}
                              </div>
                              <span className={`${fontSize} text-center overflow-hidden text-ellipsis`} style={{ width: `${thumbWidth}px`, height: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.original_name}</span>
                            </div>
                          </motion.div>
                        );

                        return sortOrder === 'custom' ? (
                          <DraggableItem key={item.id} id={item.id}>
                            {itemContent}
                          </DraggableItem>
                        ) : (
                          <React.Fragment key={item.id}>{itemContent}</React.Fragment>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  
                  {/* People Bar - Show pinned contacts on home, shared users in other spaces */}
                  {showPeopleBar && (
                    <>
                      <div className="h-16 w-px bg-white/20 flex-shrink-0 mx-2"></div>
                      {(isHome ? pinnedContacts : sharedUsers).map((contact, idx) => (
                        <motion.div 
                          key={contact.id} 
                          initial={{ opacity: 0, x: 10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ duration: 0.2, delay: idx * 0.05 }} 
                          className="flex-shrink-0" 
                          style={{ width: `${thumbWidth}px` }}
                        >
                          <div 
                            className="flex flex-col items-center cursor-pointer group select-none" 
                            style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }}
                            onClick={() => onContactClick?.(contact)}
                          >
                            <div className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                              <ImageFallback 
                                src={contact.avatar} 
                                alt={contact.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <span className={`${fontSize} text-center overflow-hidden text-ellipsis`} style={{ width: `${thumbWidth}px`, height: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {contact.name}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {allSpaces.map((space, index) => {
                    const isLobby = space.id === 'lobby';
                    const isCurrentSpace = currentSpaceId === space.id || (currentSpaceId === undefined && isLobby);
                    return (
                      <motion.div key={space.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} className="flex-shrink-0" style={{ width: `${thumbWidth}px` }}>
                        <div className="flex flex-col items-center cursor-pointer group select-none relative" style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }} onClick={(e) => { if (wasLongPress) return; handleSpaceClick(space); }} onMouseDown={(e) => handleMouseDown(space, e)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onContextMenu={(e) => handleContextMenu(space, e)} onTouchStart={(e) => { const touch = e.touches[0]; handleMouseDown(space, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent); }} onTouchEnd={handleMouseUp}>
                          {isCurrentSpace && (
                            <div className="absolute left-1/2 -translate-x-1/2 -top-2">
                              <div className="border-l-transparent border-r-transparent border-b-primary" style={{ width: 0, height: 0, borderLeftWidth: `${getScaled(8)}px`, borderRightWidth: `${getScaled(8)}px`, borderBottomWidth: `${getScaled(8)}px`, borderStyle: 'solid' }}></div>
                            </div>
                          )}
                          <div className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 flex-shrink-0 relative" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                            {(() => {
                              const chosen = (space as any).thumbnail_url || (space as any).cover_url || (space as any).thumb || '';
                              return isVideoUrl(chosen) ? (
                                <video
                                  src={chosen}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  loop
                                  preload="metadata"
                                  onLoadedMetadata={(e) => {
                                    const video = e.currentTarget;
                                    try { video.currentTime = 0.1; video.pause(); } catch {}
                                  }}
                                />
                              ) : (
                                <ImageFallback src={chosen} alt={space.name} className="w-full h-full object-cover" />
                              );
                            })()}
                            {/* Play All Button - Show on current space */}
                            {isCurrentSpace && onMovieModeToggle && !isLobby && (
                              <div 
                                className="absolute bottom-1 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMovieModeToggle();
                                }}
                              >
                                <div className="glass-card hover:glass-card-hover bg-background/60 backdrop-blur-md border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Play className="h-3 w-3" />
                                  <span className="text-xs font-medium">Play All</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className={`${fontSize} font-medium text-center overflow-hidden text-ellipsis ${isCurrentSpace ? 'text-primary' : ''}`} style={{ width: `${thumbWidth}px`, height: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{space.name}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </div>

        {/* Resize Bar */}
        <div className="flex justify-center py-2">
          <div
            onMouseDown={handleResizeMouseDown}
            className={`w-16 h-1 rounded-full bg-border hover:bg-primary/80 transition-colors cursor-ns-resize ${
              isDraggingResize ? 'bg-primary' : ''
            }`}
            title="Drag to resize spaces"
          />
        </div>

        {/* Action Buttons (moved below spaces) - with border */}
        <div className="relative mt-2">
          <div className="absolute inset-0 z-0 pointer-events-none bg-background/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"></div>
          <div className="relative z-10 flex items-center justify-between gap-2 px-3 py-1.5 text-foreground">
            <div className="flex items-center gap-2">
              {/* Video Controls - visible when handlers provided */}
              {onVideoPlayPause && onVideoSeek && onVideoVolumeChange && onVideoMuteToggle && (
                <div className={`flex items-center gap-1 ${videoControlsState?.hasVideo ? '' : 'opacity-50'}`}>
                  <VideoControls
                    isPlaying={videoControlsState?.isPlaying ?? false}
                    currentTime={videoControlsState?.currentTime ?? 0}
                    duration={videoControlsState?.duration ?? 0}
                    volume={videoControlsState?.volume ?? 1}
                    isMuted={videoControlsState?.isMuted ?? true}
                    repeatMode={repeatMode}
                    isAutoplay={isAutoplay}
                    onPlayPause={onVideoPlayPause}
                    onSeek={onVideoSeek}
                    onVolumeChange={onVideoVolumeChange}
                    onMuteToggle={onVideoMuteToggle}
                    onRepeatToggle={() => {
                      // Cycle through: off -> one -> all -> off
                      const nextMode = repeatMode === "off" ? "one" : repeatMode === "one" ? "all" : "off";
                      setRepeatMode(nextMode);
                      
                      // Update video player looping based on repeat mode
                      const shouldLoop = nextMode === "one";
                      if ((videoControlsState?.isLooping ?? false) !== shouldLoop) {
                        onVideoLoopToggle?.();
                      }
                    }}
                    onAutoplayToggle={() => {
                      const newVal = !isAutoplay;
                      setIsAutoplay(newVal);
                      
                      // If enabling autoplay and player is set to loop (repeat one), turn looping off
                      if (newVal && (videoControlsState?.isLooping ?? false)) {
                        onVideoLoopToggle?.();
                      }
                    }}
                    onSkipBackward10={() => onVideoSeek(Math.max(0, (videoControlsState?.currentTime ?? 0) - 10))}
                    onSkipForward10={() => onVideoSeek(Math.min((videoControlsState?.duration ?? 0), (videoControlsState?.currentTime ?? 0) + 10))}
                    onPreviousItem={onPreviousItem}
                    onNextItem={onNextItem}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hideActionButtons && !hideNewButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleAddModal || onCreateSpace}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <PlusCircle size={12} className="mr-1" />
                  Add
                </Button>
              )}
              {!hideActionButtons && (
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onToggleItemsBar?.(); }}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <Package size={12} className="mr-1" />
                  Items
                </Button>
              )}
              {!hideActionButtons && (
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowContactsPanel(true);
                  }}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <Users size={12} className="mr-1" />
                  People
                </Button>
              )}
              {!hideActionButtons && !hideAIButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleAIChat?.()}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <Bot size={12} className="mr-1" />
                  AI
                </Button>
              )}
              {!hideActionButtons && !hideChatButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleChatWindow?.()}
                  className="h-6 px-2 text-xs hover:bg-white/10"
                >
                  <MessageSquare size={12} className="mr-1" />
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>

      {/* Context Menu */}
      {contextMenu && (
          <SpaceContextMenu
            space={spaces.find(s => s.id === contextMenu.space.id) || contextMenu.space}
            isOpen={true}
            onClose={() => setContextMenu(null)}
            onDelete={onDeleteSpace}
            onRename={onRenameSpace}
            onUpdateDescription={onUpdateSpaceDescription}
            onUpdateThumbnail={onUpdateSpaceThumbnail}
            onReorder={onReorderSpace}
            onToggle360={onToggle360}
            on360AxisChange={on360AxisChange}
            on360VolumeChange={on360VolumeChange}
            on360MuteToggle={on360MuteToggle}
            on360RotationToggle={on360RotationToggle}
            on360RotationSpeedChange={on360RotationSpeedChange}
            on360RotationAxisChange={on360RotationAxisChange}
            onFlipHorizontalToggle={onFlipHorizontalToggle}
            onFlipVerticalToggle={onFlipVerticalToggle}
            onToggleDOSPanel={onToggleDOSPanel}
            position={contextMenu.position}
          />
        )}

      {/* Dial Popup */}
      <DialPopup
        isOpen={showDialPopup}
        item={dialPopupItem}
        onClose={() => setShowDialPopup(false)}
        onUseAsFilters={handleUseAsFilters}
        onDelete={handleDeleteItem}
        onRename={handleRenameItem}
      />

      {/* Add Options Modal */}
      <AddOptionsModal
        isOpen={showAddOptionsModal}
        onClose={() => setShowAddOptionsModal(false)}
        onOptionSelect={handleAddOptionSelect}
      />

      {/* AI Chat */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={showChatWindow}
        onClose={() => setShowChatWindow(false)}
      />

      {/* Contacts Panel */}
      <ContactsPanel
        isOpen={showContactsPanel}
        onClose={() => setShowContactsPanel(false)}
        onContactClick={onContactClick}
      />
      </>
  );
}