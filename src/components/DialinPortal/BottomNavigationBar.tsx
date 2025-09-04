import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { SpaceContextMenu } from './SpaceContextMenu';
import { Space } from '@/data/catalogs';

const spaces = [
  { id: 'lobby', name: 'Lobby', image: '/lovable-uploads/8600e4d1-299a-4ed6-93a5-5cf4ccef922e.png', active: false },
  { id: '2', name: 'Music Den', image: '/lovable-uploads/ab5a802a-5c5c-4cb0-bea7-ee6349ad6e55.png', active: false },
  { id: '3', name: 'Future Studio', image: '/lovable-uploads/58cee9e8-f4f9-40a4-9565-e582aca775f1.png', active: false },
  { id: '4', name: 'Command Center', image: '/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png', active: false },
  { id: '6', name: 'Grand Theater', image: '/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png', active: false },
  { id: '7', name: 'Starbuds', image: '/media/starbuds-thumb.jpg', active: false },
];

interface BottomNavigationBarProps {
  onSpaceClick?: (spaceId: string) => void;
  onNewClick?: () => void;
  onAIClick?: () => void;
  onChatClick?: () => void;
  activeSpaceId?: string;
  isNewActive?: boolean;
  isAIActive?: boolean;
  isChatActive?: boolean;
  spaces?: Space[];
  onDeleteSpace?: (spaceId: string) => void;
  onRenameSpace?: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription?: (spaceId: string, newDescription: string) => void;
  onReorderSpace?: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360?: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
}

export function BottomNavigationBar({ 
  onSpaceClick, 
  onNewClick, 
  onAIClick, 
  onChatClick,
  activeSpaceId = 'lobby',
  isNewActive = false,
  isAIActive = false,
  isChatActive = false,
  spaces: passedSpaces,
  onDeleteSpace,
  onRenameSpace,
  onUpdateSpaceDescription,
  onReorderSpace,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle
}: BottomNavigationBarProps) {
  const selectedSpace = activeSpaceId;
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Use passed spaces or fallback to default
  const allSpaces = passedSpaces || spaces;

  const handleSpaceClick = (spaceId: string) => {
    onSpaceClick?.(spaceId);
  };

  const handleMouseDown = (e: React.MouseEvent, space: Space) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const timer = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setContextMenu({
        space,
        position: { 
          x: rect.left + rect.width / 2, 
          y: rect.top - 10 
        }
      });
    }, 500); // 500ms press and hold
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

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-white/10 safe-area-pb"
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Navigation Arrows - REMOVED */}

        {/* Spaces Section */}
        <div className="flex items-center gap-3 overflow-x-auto flex-1">
          {allSpaces.map((space) => {
            const isActive = space.id === selectedSpace;
            return (
              <div
                key={space.id}
                className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
                onClick={() => handleSpaceClick(space.id)}
                onMouseDown={(e) => handleMouseDown(e, space)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget as HTMLElement;
                  const timer = setTimeout(() => {
                    const rect = target.getBoundingClientRect();
                    setContextMenu({
                      space,
                      position: { 
                        x: rect.left + rect.width / 2, 
                        y: rect.top - 10 
                      }
                    });
                  }, 500);
                  setPressTimer(timer);
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
                    src={space.image || space.thumb} 
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
            className={`h-10 px-4 border rounded-full transition-all duration-200 ${
              isNewActive 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white'
            }`}
            onClick={onNewClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 px-4 border rounded-full transition-all duration-200 ${
              isAIActive 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white'
            }`}
            onClick={onAIClick}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`h-10 px-4 border rounded-full transition-all duration-200 ${
              isChatActive 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30' 
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white'
            }`}
            onClick={onChatClick}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && onDeleteSpace && onRenameSpace && onUpdateSpaceDescription && onReorderSpace && onToggle360 && (
        <SpaceContextMenu
          space={contextMenu.space}
          isOpen={!!contextMenu}
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
    </motion.div>
  );
}