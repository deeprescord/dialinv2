import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close, Share, Users, Smile, Plus } from '../icons';
import { Card } from '../ui/card';

interface DialPopupProps {
  isOpen: boolean;
  item: {
    id: string;
    title: string;
    thumb: string;
    type?: string;
    vibe?: string;
    decade?: string;
    energy?: string;
  } | null;
  onClose: () => void;
  onUseAsFilters: () => void;
}

interface ActionOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function DialPopup({ isOpen, item, onClose, onUseAsFilters }: DialPopupProps) {
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

  if (!item) return null;

  const actionOptions: ActionOption[] = [
    { id: 'share', label: 'Share', icon: Share },
    { id: 'connect', label: 'Connect', icon: Users },
    { id: 'emojis', label: 'Emojis', icon: Smile },
    { id: 'create-dial', label: 'Create new dial', icon: Plus },
  ];

  const handleActionClick = (actionId: string) => {
    console.log('Action clicked:', actionId, 'for item:', item.id);
    // TODO: Implement action handlers
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-80"
          >
            <Card className="glass-card border-white/20 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 p-1 h-6 w-6"
                onClick={onClose}
              >
                <Close size={12} />
              </Button>

              {/* Item Preview */}
              <div className="relative">
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold mb-4">{item.title}</h3>

                {/* Action Options */}
                <div className="space-y-2">
                  {actionOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => handleActionClick(option.id)}
                    >
                      <option.icon size={18} />
                      <span>{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}