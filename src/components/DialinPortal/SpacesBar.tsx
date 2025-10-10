import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';

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
  onSpaceClick?: (space: Space) => void;
  breadcrumbs?: Array<{ id: string; name: string }>;
  hideActionButtons?: boolean; // Hide New, AI, Chat buttons (deprecated - use individual hide props)
  hideNewButton?: boolean; // Hide New button
  hideAIButton?: boolean; // Hide AI button
  hideChatButton?: boolean; // Hide Chat button
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
  onSpaceClick,
  breadcrumbs,
  hideActionButtons = false,
  hideNewButton = false,
  hideAIButton = false,
  hideChatButton = false
}: SpacesBarProps) {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      // Show DialPopup on long press
      setDialPopupItem({
        id: space.id,
        title: space.name,
        thumb: space.thumb,
        type: 'space'
      });
      setShowDialPopup(true);
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

  // Create spaces with lobby at the start, filtering out any existing lobby
  const lobbySpace: Space = { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
  const filteredSpaces = spaces.filter(space => space.id !== 'lobby');
  
  // If a specific space is selected (not lobby), only show lobby + that space
  let allSpaces: Space[];
  if (currentSpaceId && currentSpaceId !== 'lobby') {
    const currentSpace = filteredSpaces.find(s => s.id === currentSpaceId);
    allSpaces = currentSpace ? [lobbySpace, currentSpace] : [lobbySpace, ...filteredSpaces];
  } else {
    allSpaces = [lobbySpace, ...filteredSpaces];
  }

  const handleSpaceClick = (space: Space) => {
    if (onSpaceClick) {
      onSpaceClick(space);
    } else {
      if (space.id === 'lobby') {
        navigate('/');
      } else {
        navigate(`/space/${space.id}`);
      }
    }
  };

  return (
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg border border-white/10"></div>
      <div className="relative flex items-center justify-between px-4 py-3 overflow-x-auto scrollbar-thin">
        {/* Breadcrumb Navigation or Spaces */}
        <div className="flex items-center space-x-3">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            // Show breadcrumb navigation
            <div className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={index === breadcrumbs.length - 1 ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        const space = allSpaces.find(s => s.id === crumb.id);
                        if (space) handleSpaceClick(space);
                      }}
                      className={index === breadcrumbs.length - 1 ? "pointer-events-none" : ""}
                    >
                      {crumb.name}
                    </Button>
                  </motion.div>
                  {index < breadcrumbs.length - 1 && (
                    <span className="text-muted-foreground">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            // Show space thumbnails
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
                  onClick={() => handleSpaceClick(space)}
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
                    isCurrentSpace ? 'text-primary' : ''
                  }`}>{space.name}</span>
                </div>
              </motion.div>
            )})}
            </>
          )}
        </div>

        {/* Action buttons on the right */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Action Buttons - Only show if not hidden */}
          {!hideActionButtons && (
            <>
              {/* New Space Button */}
              {!hideNewButton && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: allSpaces.length * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={() => setShowAddOptionsModal(true)}
                  >
                    <PlusCircle size={20} className="text-green-400" />
                    <span className="text-xs">Add</span>
                  </Button>
                </motion.div>
              )}

              {/* AI Bot Button */}
              {!hideAIButton && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (allSpaces.length + 1) * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={() => setShowAIChat(true)}
                  >
                    <Bot size={20} className="text-blue-400" />
                    <span className="text-xs">AI</span>
                  </Button>
                </motion.div>
              )}

              {/* Chat Button */}
              {!hideChatButton && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (allSpaces.length + 2) * 0.05 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                    onClick={() => setShowChatWindow(true)}
                  >
                    <MessageSquare size={20} className="text-purple-400" />
                    <span className="text-xs">Chat</span>
                  </Button>
                </motion.div>
              )}
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