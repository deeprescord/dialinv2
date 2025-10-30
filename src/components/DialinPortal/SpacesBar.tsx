import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Package, Users, FileText, Music, Video, Image as ImageIcon } from 'lucide-react';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';
import { ItemsPeopleBar } from './ItemsPeopleBar';
import { VideoControls } from './VideoControls';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { supabase } from '@/integrations/supabase/client';

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
  };
  onVideoPlayPause?: () => void;
  onVideoSeek?: (value: number) => void;
  onVideoVolumeChange?: (value: number) => void;
  onVideoMuteToggle?: () => void;
  onToggleItemsBar?: () => void;
  onTogglePeopleBar?: () => void;
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
  onToggleItemsBar,
  onTogglePeopleBar
}: SpacesBarProps) {
  const navigate = useNavigate();
  const scale = 87; // Fixed scale percentage (reduced by 1/3 from 130)
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
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Fetch items for selected space
  const { items: spaceItems } = useSpaceItems(currentSpaceId && currentSpaceId !== 'lobby' ? currentSpaceId : undefined);

  // Calculate scaled sizes
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const thumbWidth = getScaled(108);
  const thumbHeight = getScaled(68);
  const buttonSize = getScaled(108);
  const iconSize = getScaled(34);
  const actionButtonIconSize = getScaled(17); // Half size for action buttons
  const spacing = getScaled(12); // Increased from 7 to 12
  const padding = getScaled(8);
  const fontSize = 'text-base';

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
        if (item.is_space) {
          if (item.thumbnail_path) {
            urls[item.id] = item.thumbnail_path;
          }
        } else {
          const pathToUse = item.thumbnail_path || item.storage_path;
          if (pathToUse) {
            filesToSign.push({ id: item.id, path: pathToUse });
          }
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
        
        results.forEach((result, idx) => {
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
    if (fileType.startsWith('audio')) return <Music size={iconSize * 0.4} />;
    return <FileText size={iconSize * 0.4} />;
  };

  return (
    <div className="relative">

      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg"></div>
      <div className="relative">
        {/* Top Action Buttons */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
          <div className="flex items-center gap-2">
            {/* Video Controls - Always show (disabled when no video) */}
            {onVideoPlayPause && onVideoSeek && onVideoVolumeChange && onVideoMuteToggle && (
              <div className={`flex items-center gap-1 ${videoControlsState?.hasVideo ? '' : 'opacity-50'}`}>
                <VideoControls
                  isPlaying={videoControlsState?.isPlaying ?? false}
                  currentTime={videoControlsState?.currentTime ?? 0}
                  duration={videoControlsState?.duration ?? 0}
                  volume={videoControlsState?.volume ?? 1}
                  isMuted={videoControlsState?.isMuted ?? true}
                  onPlayPause={onVideoPlayPause}
                  onSeek={onVideoSeek}
                  onVolumeChange={onVideoVolumeChange}
                  onMuteToggle={onVideoMuteToggle}
                />
              </div>
            )}
          </div>
          
          {/* Right Side Buttons */}
          <div className="flex items-center gap-2">
          {!hideActionButtons && !hideNewButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAddModal || onCreateSpace}
              className="h-7 px-2 text-xs hover:bg-white/10"
            >
              <PlusCircle size={14} className="mr-1" />
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
               className="h-7 px-2 text-xs hover:bg-white/10"
            >
              <Package size={14} className="mr-1" />
              Items
            </Button>
          )}
          {!hideActionButtons && (
            <Button
               variant="ghost"
               size="sm"
               onMouseDown={(e) => e.stopPropagation()}
               onTouchStart={(e) => e.stopPropagation()}
               onClick={(e) => { e.stopPropagation(); onTogglePeopleBar?.(); }}
               className="h-7 px-2 text-xs hover:bg-white/10"
            >
              <Users size={14} className="mr-1" />
              People
            </Button>
          )}
          {!hideActionButtons && !hideAIButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleAIChat?.()}
              className="h-7 px-2 text-xs hover:bg-white/10"
            >
              <Bot size={14} className="mr-1" />
              AI
            </Button>
          )}
          {!hideActionButtons && !hideChatButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleChatWindow?.()}
              className="h-7 px-2 text-xs hover:bg-white/10"
            >
              <MessageSquare size={14} className="mr-1" />
              Chat
            </Button>
          )}
          </div>
        </div>

        {/* Spaces Bar */}
        <div className="flex items-center justify-between overflow-x-auto scrollbar-thin" style={{ padding: `${padding}px` }}>
          {/* Show spaces with breadcrumb flow when a space is selected */}
          <div className="flex items-center w-full" style={{ gap: `${spacing}px` }}>
            {currentSpaceId && currentSpaceId !== 'lobby' && breadcrumbs && breadcrumbs.length > 0 ? (
              // Breadcrumb mode: Show full path (Lobby > Space > Subspace) + Separator + Items
              <>
                {/* Show all breadcrumb spaces */}
                {breadcrumbs.map((breadcrumb, idx) => {
                  const space = allSpaces.find(s => s.id === breadcrumb.id) || { 
                    id: breadcrumb.id, 
                    name: breadcrumb.name, 
                    thumb: '/media/lobby-poster.png' 
                  };
                  const isCurrentSpace = idx === breadcrumbs.length - 1;
                  
                  return (
                    <motion.div
                      key={space.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="flex-shrink-0"
                    >
                      <div 
                        className="flex flex-col items-center space-y-2 cursor-pointer group select-none relative"
                        onClick={() => handleSpaceClick(space)}
                        onMouseDown={(e) => handleMouseDown(space, e)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          setWasLongPress(false);
                          const timer = setTimeout(() => {
                            setWasLongPress(true);
                            setContextMenu({
                              space,
                              position: { x: touch.clientX, y: touch.clientY }
                            });
                          }, 500);
                          setPressTimer(timer);
                        }}
                        onTouchEnd={handleMouseUp}
                        onContextMenu={(e) => handleContextMenu(space, e)}
                      >
                        {/* Triangle arrow for current/selected space */}
                        {isCurrentSpace && (
                          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: `-${getScaled(4)}px` }}>
                            <div 
                              className="border-l-transparent border-r-transparent border-b-primary" 
                              style={{ 
                                width: 0, 
                                height: 0, 
                                borderLeftWidth: `${getScaled(8)}px`,
                                borderRightWidth: `${getScaled(8)}px`,
                                borderBottomWidth: `${getScaled(8)}px`,
                                borderStyle: 'solid'
                              }}
                            ></div>
                          </div>
                        )}
                        <div 
                          className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10"
                          style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
                        >
                          <ImageFallback 
                            src={space.thumb} 
                            alt={space.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`${fontSize} font-medium text-center ${isCurrentSpace ? 'text-primary' : ''}`}>
                          {space.name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Separator */}
                <div className="h-16 w-px bg-white/20 flex-shrink-0 mx-2"></div>

                {/* Items inline (including child spaces) */}
                {spaceItems.map((item, idx) => {
                  const isSpace = item.is_space;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      className="flex-shrink-0"
                    >
                      <div 
                        className="flex flex-col items-center space-y-2 cursor-pointer group select-none"
                        onClick={() => {
                          console.log('Item clicked:', item);
                          if (isSpace) {
                            // Navigate to the subspace
                            console.log('Navigating to subspace:', item.id);
                            navigate(`/space/${item.id}`);
                          } else if (onItemClick) {
                            // Handle regular item click
                            console.log('Handling regular item click');
                            onItemClick(item);
                          }
                        }}
                        onMouseDown={(e) => {
                          if (isSpace) {
                            // Show context menu for spaces
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              const space: Space = {
                                id: item.id,
                                name: item.original_name,
                                thumb: thumbUrls[item.id] || '/placeholder.svg'
                              };
                              setContextMenu({
                                space,
                                position: { x: e.clientX, y: e.clientY }
                              });
                            }, 500);
                            setPressTimer(timer);
                          } else {
                            // Show dial popup for items
                            const timer = setTimeout(() => {
                              setDialPopupItem({
                                id: item.id,
                                title: item.original_name,
                                thumb: thumbUrls[item.id],
                                type: item.file_type
                              });
                              setShowDialPopup(true);
                            }, 500);
                            setPressTimer(timer);
                          }
                        }}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={(e) => {
                          if (isSpace) {
                            const touch = e.touches[0];
                            setWasLongPress(false);
                            const timer = setTimeout(() => {
                              setWasLongPress(true);
                              const space: Space = {
                                id: item.id,
                                name: item.original_name,
                                thumb: thumbUrls[item.id] || '/placeholder.svg'
                              };
                              setContextMenu({
                                space,
                                position: { x: touch.clientX, y: touch.clientY }
                              });
                            }, 500);
                            setPressTimer(timer);
                          }
                        }}
                        onTouchEnd={handleMouseUp}
                      >
                        <div 
                          className="rounded-2xl overflow-auto glass-card group-hover:scale-105 transition-transform border border-white/10 relative"
                          style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
                        >
                          {thumbUrls[item.id] ? (
                            <ImageFallback 
                              src={thumbUrls[item.id]} 
                              alt={item.original_name}
                              className="w-full h-auto object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-background/60 flex items-center justify-center">
                              {getFileIcon(item.file_type)}
                            </div>
                          )}
                        </div>
                        <span className={`${fontSize} text-xs text-center max-w-[${thumbWidth}px] break-words line-clamp-3`}>
                          {item.original_name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            ) : (
              // Default mode: Show all spaces
              <>
                {allSpaces.map((space, index) => {
                  const isLobby = space.id === 'lobby';
                  const isCurrentSpace = currentSpaceId === space.id || (currentSpaceId === undefined && isLobby);
                  
                  return (
                    <motion.div
                      key={space.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex-shrink-0"
                    >
                      <div 
                        className="flex flex-col items-center space-y-2 cursor-pointer group select-none relative"
                        onClick={(e) => {
                          if (wasLongPress) return;
                          handleSpaceClick(space);
                        }}
                        onMouseDown={(e) => handleMouseDown(space, e)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onContextMenu={(e) => handleContextMenu(space, e)}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          handleMouseDown(space, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                        }}
                        onTouchEnd={handleMouseUp}
                      >
                        {/* Triangle arrow for selected space */}
                        {isCurrentSpace && (
                          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: `-${getScaled(4)}px` }}>
                            <div 
                              className="border-l-transparent border-r-transparent border-b-primary" 
                              style={{ 
                                width: 0, 
                                height: 0, 
                                borderLeftWidth: `${getScaled(8)}px`,
                                borderRightWidth: `${getScaled(8)}px`,
                                borderBottomWidth: `${getScaled(8)}px`,
                                borderStyle: 'solid'
                              }}
                            ></div>
                          </div>
                        )}
                        <div 
                          className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10"
                          style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
                        >
                          <ImageFallback 
                            src={space.thumb} 
                            alt={space.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`${fontSize} font-medium text-center ${
                          isCurrentSpace ? 'text-primary' : ''
                        }`}>{space.name}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </>
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
    </div>
  );
}