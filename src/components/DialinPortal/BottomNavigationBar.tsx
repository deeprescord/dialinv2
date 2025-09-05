import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { SpaceContextMenu } from './SpaceContextMenu';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';

const spaces = [
  { id: 'lobby', name: 'Lobby', thumb: '/lovable-uploads/8600e4d1-299a-4ed6-93a5-5cf4ccef922e.png' },
  { id: 'music-den', name: 'Music Den', thumb: '/lovable-uploads/480b4a89-5167-4b3a-b770-090a5367cd92.png' },
  { id: 'future-studio', name: 'Future Studio', thumb: '/lovable-uploads/58cee9e8-f4f9-40a4-9565-e582aca775f1.png' },
  { id: 'command-center', name: 'Command Center', thumb: '/lovable-uploads/1e022703-aa29-4fc7-82ce-a5e734f8fe91.png' },
  { id: 'grand-theater', name: 'Grand Theater', thumb: '/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png' },
  { id: 'starbuds', name: 'Starbuds', thumb: '/lovable-uploads/ab5a802a-5c5c-4cb0-bea7-ee6349ad6e55.png' },
];

interface BottomNavigationBarProps {
  onSpaceClick?: (spaceId: string) => void;
  onNewClick?: () => void;
  onAIClick?: () => void;
  onChatClick?: () => void;
  activeSpaceId?: string;
  onDeleteSpace?: (spaceId: string) => void;
  onRenameSpace?: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription?: (spaceId: string, newDescription: string) => void;
  onReorderSpace?: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360?: (spaceId: string, enabled: boolean) => void;
}

export function BottomNavigationBar({ 
  onSpaceClick, 
  onNewClick, 
  onAIClick, 
  onChatClick,
  activeSpaceId = 'lobby',
  onDeleteSpace,
  onRenameSpace,
  onUpdateSpaceDescription,
  onReorderSpace,
  onToggle360
}: BottomNavigationBarProps) {
  const selectedSpace = activeSpaceId;
  const [contextMenu, setContextMenu] = useState<{
    space: typeof spaces[0];
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  const handleSpaceClick = (spaceId: string) => {
    onSpaceClick?.(spaceId);
  };

  const handleMouseDown = (space: typeof spaces[0], event: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
    const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
    
    const timer = setTimeout(() => {
      setContextMenu({
        space,
        position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 150 }
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

  const handleNavigateUp = () => {
    const currentIndex = spaces.findIndex(space => space.id === selectedSpace);
    if (currentIndex > 0) {
      const newSpace = spaces[currentIndex - 1];
      handleSpaceClick(newSpace.id);
    }
  };

  const handleNavigateDown = () => {
    const currentIndex = spaces.findIndex(space => space.id === selectedSpace);
    if (currentIndex < spaces.length - 1) {
      const newSpace = spaces[currentIndex + 1];
      handleSpaceClick(newSpace.id);
    }
  };

  const currentIndex = spaces.findIndex(space => space.id === selectedSpace);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-white/10 safe-area-pb"
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1 mr-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            disabled={currentIndex <= 0}
            onClick={handleNavigateUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            disabled={currentIndex >= spaces.length - 1}
            onClick={handleNavigateDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Spaces Section */}
        <div className="flex items-center gap-3 overflow-x-auto flex-1">
          {spaces.map((space) => {
            const isActive = space.id === selectedSpace;
            return (
              <div
                key={space.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                onClick={() => handleSpaceClick(space.id)}
                onMouseDown={(e) => handleMouseDown(space, e)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleMouseDown(space, e);
                }}
                onTouchEnd={handleMouseUp}
              >
                <div className={`
                  relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-primary shadow-lg shadow-primary/30' 
                    : 'border-white/20 hover:border-white/40'
                  }
                `}>
                  <img 
                    src={space.thumb} 
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>
                <span className={`
                  text-xs font-medium transition-colors duration-200
                  ${isActive ? 'text-primary' : 'text-white/70'}
                `}>
                  {space.name}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:text-white rounded-full"
            onClick={onNewClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:text-white rounded-full"
            onClick={() => {
              if (showAIChat) {
                setShowAIChat(false);
                onAIClick?.();
              } else {
                setShowAIChat(true);
                onAIClick?.();
              }
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:text-white rounded-full"
            onClick={() => {
              if (showChatWindow) {
                setShowChatWindow(false);
                onChatClick?.();
              } else {
                setShowChatWindow(true);
                onChatClick?.();
              }
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <SpaceContextMenu
          space={contextMenu.space}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          onDelete={onDeleteSpace || (() => {})}
          onRename={onRenameSpace || (() => {})}
          onUpdateDescription={onUpdateSpaceDescription || (() => {})}
          onReorder={onReorderSpace || (() => {})}
          onToggle360={onToggle360 || (() => {})}
          position={contextMenu.position}
        />
      )}

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
    </motion.div>
  );
}