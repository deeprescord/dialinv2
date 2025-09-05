import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { AIChat } from './AIChat';

interface CombinedBottomBarProps {
  spaces: Space[];
  currentSpaceId?: string;
  onCreateSpace: () => void;
  onDeleteSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription: (spaceId: string, newDescription: string) => void;
  onReorderSpace: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  onSpaceClick?: (space: Space) => void;
  className?: string;
  showChatWindow?: boolean;
  onToggleChatWindow?: () => void;
}

export function CombinedBottomBar({ 
  spaces, 
  currentSpaceId, 
  onCreateSpace, 
  onDeleteSpace, 
  onRenameSpace,
  onUpdateSpaceDescription, 
  onReorderSpace, 
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  onSpaceClick,
  className = "",
  showChatWindow,
  onToggleChatWindow
}: CombinedBottomBarProps) {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);

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

  // Create spaces with lobby at the start, filtering out any existing lobby
  const lobbySpace: Space = { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
  const filteredSpaces = spaces.filter(space => space.id !== 'lobby');
  const allSpaces = [lobbySpace, ...filteredSpaces];

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
    <div className="mb-0 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md border border-white/10"></div>
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 overflow-x-auto scrollbar-thin">
          {/* Spaces on the left */}
          <div className="flex items-center space-x-3">
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
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* New Space Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: allSpaces.length * 0.05 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                onClick={onCreateSpace}
              >
                <PlusCircle size={20} className="text-green-400" />
                <span className="text-xs">New</span>
              </Button>
            </motion.div>

            {/* AI Bot Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: (allSpaces.length + 1) * 0.05 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                onClick={() => setShowAIChat(!showAIChat)}
              >
                <Bot size={20} className="text-blue-400" />
                <span className="text-xs">AI</span>
              </Button>
            </motion.div>

            {/* Chat Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: (allSpaces.length + 2) * 0.05 }}
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
            onReorder={onReorderSpace}
            onToggle360={onToggle360}
            on360AxisChange={on360AxisChange}
            on360VolumeChange={on360VolumeChange}
            on360MuteToggle={on360MuteToggle}
            position={contextMenu.position}
          />
        )}

        {/* AI Chat */}
        <AIChat
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
        />
      </div>
    </div>
  );
}