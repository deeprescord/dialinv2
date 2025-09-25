import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder, FolderOpen, MapPin } from 'lucide-react';
import { Space } from '@/data/catalogs';
import { Checkbox } from '@/components/ui/checkbox';

interface SpaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceSelect: (spaceId: string) => void;
  onCreateNewSpace: (name: string) => void;
  spaces: Space[];
  droppedFiles: File[];
}

export function SpaceSelectionModal({
  isOpen,
  onClose,
  onSpaceSelect,
  onCreateNewSpace,
  spaces,
  droppedFiles
}: SpaceSelectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);

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
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Select Space</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose where to place {droppedFiles.length} file{droppedFiles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* File Preview */}
            <div className="mb-6 p-3 bg-muted/50 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-2">Files to add:</div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {droppedFiles.map((file, index) => (
                  <div key={index} className="text-sm text-foreground truncate">
                    📄 {file.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Spaces List */}
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => onSpaceSelect(space.id)}
                  className="w-full p-3 text-left rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {space.thumb ? (
                        <img
                          src={space.thumb}
                          alt={space.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {space.name}
                      </div>
                      {space.description && (
                        <div className="text-sm text-muted-foreground truncate">
                          {space.description}
                        </div>
                      )}
                    </div>
                    <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            {/* Location Toggle */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="include-location"
                  checked={includeLocation}
                  onCheckedChange={(checked) => setIncludeLocation(checked === true)}
                />
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <label 
                    htmlFor="include-location" 
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Include current location
                  </label>
                </div>
              </div>
              {includeLocation && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Files will be tagged with your current location
                </div>
              )}
            </div>

            {/* Create New Space */}
            <div className="border-t border-border pt-4">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-3 text-left rounded-lg hover:bg-muted transition-colors border border-dashed border-border hover:border-primary group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <div className="font-medium text-foreground">
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
                    placeholder="Enter space name..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCreateSpace}
                      disabled={!newSpaceName.trim()}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create & Add Files
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewSpaceName('');
                      }}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
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