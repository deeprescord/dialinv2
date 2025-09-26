import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close } from '../icons';
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

  const dials = [
    { label: 'Type', value: item.type },
    { label: 'Vibe', value: item.vibe },
    { label: 'Decade', value: item.decade },
    { label: 'Energy', value: item.energy },
  ].filter(dial => dial.value);

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

                {/* Detected Dials */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Detected Dials:</h4>
                  <div className="space-y-2">
                    {dials.map((dial, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{dial.label}:</span>
                        <span className="font-medium">{dial.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={onUseAsFilters}
                  className="w-full bg-dialin-purple hover:bg-dialin-purple-dark"
                >
                  Use as filters
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}