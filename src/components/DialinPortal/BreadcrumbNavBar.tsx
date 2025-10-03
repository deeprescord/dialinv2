import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot, ChevronRight } from '../icons';
import { Close } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';

interface BreadcrumbNavBarProps {
  // Navigation breadcrumb path (e.g., ['lobby', 'space-1', 'space-2'])
  navigationPath: string[];
  // All available spaces
  spaces: Space[];
  // Items/spaces within the current space
  currentSpaceItems?: Space[];
  // Currently selected item or space
  selectedItemId?: string;
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
  onNavigate: (spaceId: string) => void;
  onItemSelect?: (itemId: string) => void;
  className?: string;
  showChatWindow?: boolean;
  onToggleChatWindow?: () => void;
  showCreateSpaceModal?: boolean;
  showAIChat?: boolean;
  onToggleAIChat?: () => void;
}

export function BreadcrumbNavBar({
  navigationPath,
  spaces,
  currentSpaceItems = [],
  selectedItemId,
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
  onNavigate,
  onItemSelect,
  className = "",
  showChatWindow,
  onToggleChatWindow,
  showCreateSpaceModal,
  showAIChat,
  onToggleAIChat
}: BreadcrumbNavBarProps) {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      setContextMenu({
        space,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500);
    setPressTimer(timer);
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

  // Get space by ID
  const getSpace = (spaceId: string): Space | undefined => {
    if (spaceId === 'lobby') {
      return { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
    }
    return spaces.find(s => s.id === spaceId);
  };

  // Build breadcrumb spaces
  const breadcrumbSpaces = navigationPath.map(spaceId => getSpace(spaceId)).filter(Boolean) as Space[];

  const handleSpaceClick = (spaceId: string) => {
    if (spaceId === 'lobby') {
      navigate('/');
    } else {
      navigate(`/space/${spaceId}`);
    }
    onNavigate(spaceId);
  };

  return (
    <div className="mb-0 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md border border-white/10"></div>
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 overflow-x-auto scrollbar-thin">
          {/* Left section: Breadcrumb + Separator + Current space items */}
          <div className="flex items-center space-x-3">
            {/* Breadcrumb navigation */}
            {breadcrumbSpaces.map((space, index) => {
              const isLobby = space.id === 'lobby';
              const isLast = index === breadcrumbSpaces.length - 1;
              
              return (
                <React.Fragment key={space.id}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <div 
                      className="flex flex-col items-center space-y-2 cursor-pointer group select-none relative"
                      onClick={() => handleSpaceClick(space.id)}
                      onMouseDown={(e) => !isLobby && handleMouseDown(space, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) => {
                        if (!isLobby) {
                          const touch = e.touches[0];
                          handleMouseDown(space, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                        }
                      }}
                      onTouchEnd={handleMouseUp}
                    >
                      {/* Triangle arrow for selected space */}
                      {isLast && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-primary"></div>
                        </div>
                      )}
                      <div className="w-16 h-10 rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform">
                        <ImageFallback 
                          src={space.thumb} 
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className={`text-xs font-medium text-center ${
                        isLast ? 'text-primary' : ''
                      }`}>{space.name}</span>
                    </div>
                  </motion.div>
                  
                  {/* Chevron separator between breadcrumb items */}
                  {!isLast && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}

            {/* Vertical separator line */}
            {currentSpaceItems.length > 0 && (
              <div className="h-12 w-px bg-border mx-2 flex-shrink-0" />
            )}

            {/* Items/Spaces within current space */}
            {currentSpaceItems.map((item, index) => {
              const isSelected = selectedItemId === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (breadcrumbSpaces.length + index) * 0.05 }}
                  className="flex-shrink-0"
                >
                  <div 
                    className="flex flex-col items-center space-y-2 cursor-pointer group select-none relative"
                    onClick={() => {
                      if (item.id.startsWith('space-')) {
                        handleSpaceClick(item.id);
                      } else {
                        onItemSelect?.(item.id);
                      }
                    }}
                    onMouseDown={(e) => handleMouseDown(item, e)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      handleMouseDown(item, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                    }}
                    onTouchEnd={handleMouseUp}
                  >
                    {/* Triangle arrow for selected item */}
                    {isSelected && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-accent"></div>
                      </div>
                    )}
                    <div className="w-16 h-10 rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform">
                      <ImageFallback 
                        src={item.thumb} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-medium text-center ${
                      isSelected ? 'text-accent' : ''
                    }`}>{item.name}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Show close button when any panel is open, otherwise show normal buttons */}
            {(showChatWindow || showCreateSpaceModal || showAIChat) ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-red-500/50"
                  onClick={() => {
                    if (showChatWindow) onToggleChatWindow?.();
                    if (showCreateSpaceModal) onCreateSpace();
                    if (showAIChat) onToggleAIChat?.();
                  }}
                >
                  <Close size={20} className="text-red-400" />
                  <span className="text-xs">Close</span>
                </Button>
              </motion.div>
            ) : (
              <>
                {/* New Space Button */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={onCreateSpace}
                  >
                    <PlusCircle size={20} className="text-green-400" />
                    <span className="text-xs">Add</span>
                  </Button>
                </motion.div>

                {/* AI Bot Button */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={onToggleAIChat}
                  >
                    <Bot size={20} className="text-blue-400" />
                    <span className="text-xs">AI</span>
                  </Button>
                </motion.div>

                {/* Chat Button */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={onToggleChatWindow}
                  >
                    <MessageSquare size={20} className="text-purple-400" />
                    <span className="text-xs">Chat</span>
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <SpaceContextMenu
            space={contextMenu.space}
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
            position={contextMenu.position}
          />
        )}
      </div>
    </div>
  );
}
