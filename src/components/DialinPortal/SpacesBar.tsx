import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';
import { Slider } from '../ui/slider';

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
  on360RotationToggle,
  on360RotationSpeedChange,
  on360RotationAxisChange,
  onSpaceClick,
  breadcrumbs,
  hideActionButtons = false,
  hideNewButton = false,
  hideAIButton = false,
  hideChatButton = false
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

  // Calculate scaled sizes
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const thumbWidth = getScaled(108);
  const thumbHeight = getScaled(68);
  const buttonSize = getScaled(108);
  const iconSize = getScaled(34);
  const actionButtonIconSize = getScaled(17); // Half size for action buttons
  const spacing = getScaled(7);
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

  // Create spaces with lobby at the start, filtering out any existing lobby
  const lobbySpace: Space = { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
  const filteredSpaces = spaces.filter(space => space.id !== 'lobby');
  const allSpaces: Space[] = [lobbySpace, ...filteredSpaces];

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
    <div className="relative">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg"></div>
      <div className="relative flex items-center justify-between overflow-x-auto scrollbar-thin" style={{ padding: `${padding}px` }}>
        {/* Breadcrumb Navigation or Spaces */}
        <div className="flex items-center" style={{ gap: `${spacing}px` }}>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            // Show breadcrumb navigation
            <div className="flex items-center gap-4">
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
                  onClick={(e) => {
                    if (wasLongPress) return;
                    handleSpaceClick(space);
                  }}
                  onMouseDown={(e) => handleMouseDown(space, e)}
                  onMouseUp={(e) => {
                    handleMouseUp();
                  }}
                  onMouseLeave={handleMouseLeave}
                  onContextMenu={(e) => handleContextMenu(space, e)}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    handleMouseDown(space, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                  }}
                  onTouchEnd={(e) => {
                    handleMouseUp();
                  }}
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
                    {space.thumb && /\.(mp4|webm|ogg|mov)$/i.test((space.thumb as string).split('?')[0].split('#')[0]) ? (
                      <video
                        src={space.thumb}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <ImageFallback 
                        src={space.thumb} 
                        alt={space.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <span className={`${fontSize} font-medium text-center ${
                    isCurrentSpace ? 'text-primary' : ''
                  }`}>{space.name}</span>
                </div>
              </motion.div>
            )})}
            </>
          )}
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