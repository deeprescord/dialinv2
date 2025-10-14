import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X } from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, coverUrl: string, parentId?: string) => void;
  parentId?: string;
}

const defaultCover = '';

export function CreateSpaceModal({ isOpen, onClose, onCreate, parentId }: CreateSpaceModalProps) {
  const [spaceName, setSpaceName] = useState('');

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

  const handleCreate = () => {
    if (spaceName.trim()) {
      onCreate(spaceName.trim(), defaultCover, parentId);
      setSpaceName('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && spaceName.trim()) {
      handleCreate();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-md bg-background/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Create New Space</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-foreground/80">
                  Space Name
                </label>
                <Input
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter space name..."
                  className="bg-background/50 border-white/20 focus:border-primary h-12 text-base"
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-12 border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!spaceName.trim()}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Create Space
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}