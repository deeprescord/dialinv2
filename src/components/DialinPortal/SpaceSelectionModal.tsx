import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Folder, FolderOpen, MapPin, Building2, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageFallback } from '@/components/ui/image-fallback';
import { aiService } from '@/lib/ai-service';
import { toast } from 'sonner';

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
  const [includeLocation, setIncludeLocation] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [autoDetectedDials, setAutoDetectedDials] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

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
      onCreateNewSpace(newSpaceName.trim(), autoDetectedDials.length > 0 ? autoDetectedDials : undefined);
      setNewSpaceName('');
      setShowCreateForm(false);
      setSelectedSpaceId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSpace();
    }
  };

  const handleSave = () => {
    if (selectedSpaceId) {
      onSpaceSelect(selectedSpaceId, autoDetectedDials.length > 0 ? autoDetectedDials : undefined);
    }
  };

  const handleCancel = () => {
    setSelectedSpaceId(null);
    setAutoDetectedDials([]);
    onClose();
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    try {
      // Get the first file (for simplicity, we'll analyze the first one)
      const firstFile = droppedFiles[0];
      if (!firstFile) {
        toast.error('No files to analyze');
        return;
      }

      // Determine file type for better context
      let fileType = 'item';
      if (firstFile.type.startsWith('image/')) fileType = 'image';
      else if (firstFile.type.startsWith('video/')) fileType = 'video';
      else if (firstFile.type.startsWith('audio/')) fileType = 'audio';

      const result = await aiService.describeItemWithDials(firstFile.name, fileType);
      
      if (result.dials && result.dials.length > 0) {
        setAutoDetectedDials(result.dials);
        toast.success(`Auto-detected ${result.dials.length} relevant dials!`);
      } else {
        toast.info('No specific dials detected for this item');
      }
    } catch (error) {
      console.error('Auto-detect error:', error);
      toast.error('Failed to auto-detect dials');
    } finally {
      setAutoDetecting(false);
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
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[85vh] flex flex-col"
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

            {/* Auto Detect Button */}
            <div className="mb-6">
              <button
                onClick={handleAutoDetect}
                disabled={autoDetecting || droppedFiles.length === 0}
                className="w-full p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-3">
                  <Sparkles className={`w-5 h-5 text-purple-400 ${autoDetecting ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-medium text-foreground">
                    {autoDetecting ? 'Analyzing...' : 'Auto Detect Dials'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will detect location, objects, or features and add relevant dials
                </p>
              </button>

              {/* Show Auto-Detected Dials */}
              {autoDetectedDials.length > 0 && (
                <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-xs font-medium text-purple-300 mb-2">
                    ✨ {autoDetectedDials.length} Dials Detected:
                  </div>
                  <div className="space-y-2">
                    {autoDetectedDials.map((dial, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 hover:border-purple-400/30 transition-colors group">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-white">{dial.name}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>{dial.minLabel}</span>
                            <span>{dial.maxLabel}</span>
                          </div>
                        </div>
                        <div className="text-xs text-purple-300 font-medium mr-2">
                          {dial.defaultValue}%
                        </div>
                        <button
                          onClick={() => {
                            toast.success(`${dial.name} will be added to this space!`);
                          }}
                          className="bg-purple-500/30 hover:bg-purple-500/50 text-white border border-purple-400/40 rounded-full px-3 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-3 h-3 mr-1 inline" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {/* Spaces List */}
              <div className="space-y-2">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className={`w-full p-3 text-left rounded-lg transition-colors border group ${
                      selectedSpaceId === space.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'border-transparent hover:border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {space.name}
                        </div>
                        {space.fileCount !== undefined && (
                          <div className="text-sm text-muted-foreground truncate">
                            {space.fileCount} files
                          </div>
                        )}
                      </div>
                      <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Location Toggle */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
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

              {/* Footer Spaces - Horizontal Scroll */}
              {footerSpaces.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Main Spaces</div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {footerSpaces.map((space) => (
                      <button
                        key={space.id}
                        onClick={() => setSelectedSpaceId(space.id)}
                        className={`flex-shrink-0 flex flex-col items-center space-y-2 group ${
                          selectedSpaceId === space.id ? 'opacity-100' : ''
                        }`}
                      >
                        <div className={`w-16 h-10 rounded-lg overflow-hidden bg-muted border transition-all group-hover:scale-105 ${
                          selectedSpaceId === space.id ? 'border-primary ring-2 ring-primary' : 'border-border group-hover:border-primary'
                        }`}>
                          {space.thumb ? (
                            <ImageFallback 
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
                        <span className="text-xs font-medium text-center text-foreground group-hover:text-primary transition-colors max-w-[64px] truncate">
                          {space.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Floors */}
              {floors.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Floors</div>
                  <div className="space-y-2">
                    {floors.map((floor) => (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedSpaceId(floor.id)}
                        className={`w-full p-3 text-left rounded-lg transition-colors border group ${
                          selectedSpaceId === floor.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'border-transparent hover:border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {floor.name}
                            </div>
                            {floor.fileCount !== undefined && (
                              <div className="text-sm text-muted-foreground truncate">
                                {floor.fileCount} files
                              </div>
                            )}
                          </div>
                          <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
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

            {/* Save and Cancel Buttons */}
            <div className="border-t border-border pt-4 flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedSpaceId}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Save to Space
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}