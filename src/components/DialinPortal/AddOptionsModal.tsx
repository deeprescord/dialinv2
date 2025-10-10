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
  { id: 'invite', title: 'INVITE', icon: UserPlus },
  { id: 'contact-wizard', title: 'CONTACT WIZARD', icon: Zap },
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-background/98 to-background/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">Add to Space</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-white/10"
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

            <div className="grid grid-cols-2 gap-3 mb-4">
              {addOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="ghost"
                    className="h-24 flex flex-col items-center justify-center space-y-2 bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 group"
                    onClick={() => handleOptionClick(option.id)}
                  >
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium tracking-wide">{option.title}</span>
                  </Button>
                );
              })}
            </div>

            <Button
              variant="default"
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-medium rounded-xl"
              onClick={onClose}
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}