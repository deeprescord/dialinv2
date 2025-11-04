import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Package, Users, FileText, Music, Video, Image as ImageIcon, Folder } from 'lucide-react';
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
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Friend } from '@/data/catalogs';

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
  onToggleItemsBar?: () => void;
  onTogglePeopleBar?: () => void;
  pinnedContacts?: Friend[];
  onContactClick?: (contact: Friend) => void;
  showPeopleBar?: boolean;
  isHome?: boolean;
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
  videoControlsState,
  onVideoPlayPause,
  onVideoSeek,
  onVideoVolumeChange,
  onVideoMuteToggle,
  onVideoLoopToggle,
  onToggleItemsBar,
  onTogglePeopleBar,
  pinnedContacts = [],
  onContactClick,
  showPeopleBar = false,
  isHome = false
}: SpacesBarProps) {
  const navigate = useNavigate();
  const [scale, setScale] = useState<number>(() => {
    const saved = localStorage.getItem('spaces-bar-scale');
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

  // Persist scale to localStorage
  useEffect(() => {
    localStorage.setItem('spaces-bar-scale', scale.toString());
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
  const { items: spaceItems, refetch: refetchItems } = useSpaceItems(currentSpaceId && currentSpaceId !== 'lobby' ? currentSpaceId : undefined);
  
  // Fetch shared users for the current space
  const [sharedUsers, setSharedUsers] = React.useState<Friend[]>([]);
  
  React.useEffect(() => {
    const fetchSharedUsers = async () => {
      if (!currentSpaceId || currentSpaceId === 'lobby' || isHome) {
        setSharedUsers([]);
        return;
      }
      
      try {
        const { data: shares, error } = await supabase
          .from('file_shares')
          .select(`
            shared_with,
            profiles:shared_with (
              full_name,
              profile_media_url,
              user_id
            )
          `)
          .eq('file_id', currentSpaceId);
          
        if (error) throw error;
        
        const users: Friend[] = (shares || [])
          .filter(s => s.profiles)
          .map(s => ({
            id: s.shared_with,
            name: (s.profiles as any).full_name || 'Unknown',
            avatar: (s.profiles as any).profile_media_url || '/placeholder.svg',
            status: 'offline' as const
          }));
          
        setSharedUsers(users);
      } catch (error) {
        console.error('Error fetching shared users:', error);
        setSharedUsers([]);
      }
    };
    
    if (showPeopleBar) {
      fetchSharedUsers();
    }
  }, [currentSpaceId, isHome, showPeopleBar]);

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

  // Optimized: Batch signed URL generation and use memo
  React.useEffect(() => {
    const generateUrls = async () => {
      const urls: Record<string, string> = {};
      const filesToSign: Array<{ id: string; path: string }> = [];
      
      // First pass: collect items needing signed URLs
      for (const item of spaceItems) {
        const pathToUse = item.thumbnail_path || item.storage_path;
        if (!pathToUse) continue;
        // If it's already a public URL (e.g., from space-covers), use directly
        if (typeof pathToUse === 'string' && /^https?:\/\//i.test(pathToUse)) {
          urls[item.id] = pathToUse;
        } else {
          filesToSign.push({ id: item.id, path: pathToUse });
        }
      }
      
      // Batch sign URLs (Supabase supports this efficiently)
      if (filesToSign.length > 0) {
        const results = await Promise.allSettled(
          filesToSign.map(file =>
            supabase.storage
              .from('user-files')
              .createSignedUrl(file.path, 3600)
              .then(({ data }) => ({ id: file.id, url: data?.signedUrl }))
          )
        );
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.url) {
            urls[result.value.id] = result.value.url;
          }
        });
      }
      
      setThumbUrls(urls);
    };

    if (spaceItems.length > 0) {
      generateUrls();
    } else {
      setThumbUrls({});
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

                  {!showPeopleBar && spaceItems.map((item, idx) => {
                    const isSpace = item.is_space;
                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }} className="flex-shrink-0" style={{ width: `${thumbWidth}px` }}>
                        <div 
                          className="flex flex-col items-center cursor-pointer group select-none" 
                          style={{ gap: `${spacing}px`, width: `${thumbWidth}px` }} 
                          onClick={() => {
                            if (wasLongPress) return;
                            if (isSpace) {
                              handleSpaceClick({ id: item.id, name: item.original_name, thumb: thumbUrls[item.id] || '/placeholder.svg' } as any);
                            } else {
                              onItemClick?.(item);
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
                          onTouchEnd={handleMouseUp}
                        >
                          <div className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                            {(() => {
                              const url = thumbUrls[item.id];
                              if (url) {
                                return isVideoUrl(url) ? (
                                  <video
                                    src={url}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    playsInline
                                    loop
                                    preload="auto"
                                  />
                                ) : (
                                  <ImageFallback src={url} alt={item.original_name} className="w-full h-full object-cover" />
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
                  })}
                  
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
                          <div className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 flex-shrink-0" style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}>
                            <ImageFallback src={(space as any).thumbnail_url || (space as any).cover_url || (space as any).thumb || ''} alt={space.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`${fontSize} font-medium text-center overflow-hidden text-ellipsis ${isCurrentSpace ? 'text-primary' : ''}`} style={{ width: `${thumbWidth}px`, height: '2.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{space.name}</span>
                        </div>
                      </motion.div>
                    );
                  })}
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
                    isLooping={videoControlsState?.isLooping ?? true}
                    onPlayPause={onVideoPlayPause}
                    onSeek={onVideoSeek}
                    onVolumeChange={onVideoVolumeChange}
                    onMuteToggle={onVideoMuteToggle}
                    onLoopToggle={onVideoLoopToggle}
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