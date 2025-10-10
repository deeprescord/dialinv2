import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot, Close, ChevronRight } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';

interface BreadcrumbNavBarProps {
  navigationPath: string[];
  spaces: Space[];
  currentSpaceItems: any[];
  selectedItemId?: string;
  onNavigate: (spaceId: string) => void;
  onItemSelect: (itemId: string) => void;
  onCreateSpace: (parentId?: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription: (spaceId: string, newDescription: string) => void;
  onUpdateSpaceThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorderSpace: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  showChatWindow?: boolean;
  onToggleChatWindow?: () => void;
  showCreateSpaceModal?: boolean;
  showAIChat?: boolean;
  onToggleAIChat?: () => void;
}

export function BreadcrumbNavBar({
  navigationPath,
  spaces,
  currentSpaceItems,
  selectedItemId,
  onNavigate,
  onItemSelect,
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
  showChatWindow,
  onToggleChatWindow,
  showCreateSpaceModal,
  showAIChat,
  onToggleAIChat
}: BreadcrumbNavBarProps) {
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    if (space.id === 'lobby') return;
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

  const getSpace = (spaceId: string): Space => {
    if (spaceId === 'lobby') {
      return { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
    }
    return spaces.find(s => s.id === spaceId) || { id: spaceId, name: spaceId, thumb: '/placeholder.svg' };
  };

  // Build breadcrumb path
  const breadcrumbSpaces = navigationPath.map(id => getSpace(id));

  const handleSpaceClick = (space: Space) => {
    onNavigate(space.id);
  };

  return (
    <div className="mb-0 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md border border-white/10"></div>
      <div className="relative">
        <div className="flex items-center justify-between px-4 py-3 overflow-x-auto scrollbar-thin">
          {/* Left side: Breadcrumb navigation */}
          <div className="flex items-center space-x-2 flex-1 overflow-x-auto">
            {/* Breadcrumb path (Lobby > Space1 > Space2) */}
            {breadcrumbSpaces.map((space, index) => {
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
                      className="flex flex-col items-center space-y-1 cursor-pointer group select-none relative"
                      onClick={() => handleSpaceClick(space)}
                      onMouseDown={(e) => handleMouseDown(space, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        handleMouseDown(space, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
                      }}
                      onTouchEnd={handleMouseUp}
                    >
                      <div className="w-16 h-10 rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform">
                        <ImageFallback 
                          src={space.thumb} 
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className={`text-xs font-medium text-center ${
                        isLast ? 'text-primary' : 'text-white/70'
                      }`}>{space.name}</span>
                    </div>
                  </motion.div>
                  
                  {/* Chevron separator */}
                  {!isLast && (
                    <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* Separator line before items */}
            {currentSpaceItems.length > 0 && (
              <>
                <div className="h-12 w-px bg-white/30 mx-3 flex-shrink-0" />
                
                {/* Current space items */}
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
                        className="flex flex-col items-center space-y-1 cursor-pointer group select-none relative"
                        onClick={() => {
                          if (!pressTimer) return;
                          if (item.type === 'space' || item.id?.startsWith('space-')) {
                            // For spaces in the items section, navigate to them (will add to breadcrumb)
                            onNavigate(item.id);
                          } else {
                            onItemSelect(item.id);
                          }
                        }}
                        onMouseDown={() => {
                          const timer = setTimeout(() => {
                            setDialPopupItem({
                              id: item.id,
                              title: item.name || item.title,
                              thumb: item.thumb || item.art,
                              type: item.type
                            });
                            setShowDialPopup(true);
                          }, 500);
                          setPressTimer(timer);
                        }}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={() => {
                          const timer = setTimeout(() => {
                            setDialPopupItem({
                              id: item.id,
                              title: item.name || item.title,
                              thumb: item.thumb || item.art,
                              type: item.type
                            });
                            setShowDialPopup(true);
                          }, 500);
                          setPressTimer(timer);
                        }}
                        onTouchEnd={handleMouseUp}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-primary"></div>
                          </div>
                        )}
                        <div className="w-16 h-10 rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform">
                          <ImageFallback 
                            src={item.thumb || item.art || '/placeholder.svg'} 
                            alt={item.name || item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className={`text-xs font-medium text-center ${
                          isSelected ? 'text-primary' : 'text-white/70'
                        }`}>{item.name || item.title}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
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
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
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

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
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

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
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

        {/* Dial Popup */}
        <DialPopup
          isOpen={showDialPopup}
          item={dialPopupItem}
          onClose={() => setShowDialPopup(false)}
          onUseAsFilters={() => {
            setShowDialPopup(false);
            setDialPopupItem(null);
          }}
        />

        {/* Add Options Modal */}
        <AddOptionsModal
          isOpen={showAddOptionsModal}
          onClose={() => setShowAddOptionsModal(false)}
          onOptionSelect={(optionId) => {
            if (optionId === 'space') {
              // Pass the current space ID as the parent
              const currentParentId = navigationPath[navigationPath.length - 1];
              onCreateSpace(currentParentId);
            }
            console.log('Add option selected:', optionId);
          }}
        />
      </div>
    </div>
  );
}
