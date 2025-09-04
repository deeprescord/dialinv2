import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';

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
}

export function BottomNavigationBar({ 
  onSpaceClick, 
  onNewClick, 
  onAIClick, 
  onChatClick,
  activeSpaceId = 'lobby',
  isNewActive = false,
  isAIActive = false,
  isChatActive = false
}: BottomNavigationBarProps) {
  // Don't use local state, use activeSpaceId directly
  const selectedSpace = activeSpaceId;

  const handleSpaceClick = (spaceId: string) => {
    onSpaceClick?.(spaceId);
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
              >
                <div className={`
                  relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-primary shadow-lg shadow-primary/30' 
                    : 'border-white/20 hover:border-white/40'
                  }
                `}>
                  <img 
                    src={space.image} 
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
    </motion.div>
  );
}