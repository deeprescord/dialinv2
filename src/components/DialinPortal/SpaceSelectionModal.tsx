import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder } from 'lucide-react';
import { ImageFallback } from '@/components/ui/image-fallback';

interface SpaceOption {
  id: string;
  name: string;
  fileCount?: number;
  thumb?: string;
}

interface SpaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceSelect: (spaceId: string, autoDetectedDials?: any[]) => void;
  onCreateNewSpace: (name: string, autoDetectedDials?: any[]) => void;
  spaces: SpaceOption[];
  footerSpaces?: SpaceOption[];
  floors?: SpaceOption[];
  droppedFiles: File[];
  loading?: boolean;
}

export function SpaceSelectionModal({
  isOpen,
  onClose,
  onSpaceSelect,
  onCreateNewSpace,
  spaces,
  footerSpaces = [],
  floors = [],
  droppedFiles
}: SpaceSelectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // ESC key handling
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      onCreateNewSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowCreateForm(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpace();
    }
  };

  const handleSpaceClick = (spaceId: string) => {
    onSpaceSelect(spaceId);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Add to Space</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {droppedFiles.length} file{droppedFiles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Spaces Grid */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="grid grid-cols-2 gap-3">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceClick(space.id)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-transparent hover:border-primary transition-all hover:scale-105 active:scale-95"
                  >
                    {space.thumb ? (
                      <ImageFallback 
                        src={space.thumb} 
                        alt={space.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Folder className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <div className="text-left w-full">
                        <div className="font-semibold text-white text-sm truncate">
                          {space.name}
                        </div>
                        {space.fileCount !== undefined && (
                          <div className="text-xs text-white/80">
                            {space.fileCount} items
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Create New Space */}
            <div className="border-t border-border pt-4">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-4 text-center rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-dashed border-primary/50 hover:border-primary transition-all group"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Plus className="w-6 h-6 text-primary" />
                    <div className="font-semibold text-foreground">
                      Create New Space
                    </div>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Space name..."
                    className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateSpace}
                      disabled={!newSpaceName.trim()}
                      className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewSpaceName('');
                      }}
                      className="px-4 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}