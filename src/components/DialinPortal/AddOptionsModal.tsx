import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Users, Globe, UserPlus, Layers, MessageSquare, Zap, Upload } from 'lucide-react';
import { Button } from '../ui/button';

interface AddOption {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface AddOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptionSelect: (optionId: string) => void;
  onUploadClick?: (files: File[]) => void;
}

const addOptions: AddOption[] = [
  { id: 'space', title: 'SPACE', icon: Layers },
  { id: 'upload', title: 'UPLOAD', icon: Upload },
  { id: 'post', title: 'POST', icon: Plus },
  { id: 'group', title: 'GROUP', icon: MessageSquare },
  { id: 'contact', title: 'CONTACT', icon: Users },
  { id: 'web', title: 'WEB', icon: Globe },
];

export function AddOptionsModal({ isOpen, onClose, onOptionSelect, onUploadClick }: AddOptionsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOptionClick = (optionId: string) => {
    if (optionId === 'upload') {
      fileInputRef.current?.click();
    } else {
      onOptionSelect(optionId);
      onClose();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    if (onUploadClick) {
      onUploadClick(fileArray);
    }
    
    onClose();
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-20 left-0 right-0 z-40 flex items-start justify-center pt-4" style={{ bottom: 'calc(12.5vh + 6rem)' }}>
          {/* Add Options Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative z-10 w-[85vw] max-w-4xl max-h-[500px]"
          >
            <div className="w-full h-full glass-card border border-white/10 rounded-xl overflow-hidden flex flex-col backdrop-blur-xl bg-black/40">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div>
                  <h3 className="font-semibold text-white">Add to Space</h3>
                  <p className="text-xs text-white/60">Choose what to add</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Options Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-3">
                  {addOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option.id)}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 group"
                      >
                        <Icon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium tracking-wide text-white">{option.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/10">
                <Button
                  onClick={onClose}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}