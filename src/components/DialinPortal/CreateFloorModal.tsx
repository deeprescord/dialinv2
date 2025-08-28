import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Close } from '../icons';
import { Card } from '../ui/card';

interface CreateFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, coverUrl: string) => void;
}

const coverOptions = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1629909613654-28e6c8816c9b?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1583847268964-a6f45e725dc3?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=200&h=120&fit=crop&auto=format',
];

export function CreateFloorModal({ isOpen, onClose, onCreate }: CreateFloorModalProps) {
  const [floorName, setFloorName] = useState('');
  const [selectedCover, setSelectedCover] = useState(coverOptions[0]);

  const handleCreate = () => {
    if (floorName.trim()) {
      onCreate(floorName.trim(), selectedCover);
      setFloorName('');
      setSelectedCover(coverOptions[0]);
      onClose();
    }
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-96"
          >
            <Card className="glass-card border-white/20">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">Create New Floor</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <Close size={20} />
                </Button>
              </div>

              <div className="p-4">
                {/* Floor Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Floor Name</label>
                  <Input
                    value={floorName}
                    onChange={(e) => setFloorName(e.target.value)}
                    placeholder="Enter floor name..."
                    className="glass-card bg-white/5 border-white/10"
                  />
                </div>

                {/* Cover Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Choose Cover</label>
                  <div className="grid grid-cols-2 gap-2">
                    {coverOptions.map((cover, index) => (
                      <button
                        key={index}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          selectedCover === cover
                            ? 'border-dialin-purple shadow-lg shadow-dialin-purple/25'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => setSelectedCover(cover)}
                      >
                        <img
                          src={cover}
                          alt={`Cover ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={!floorName.trim()}
                    className="flex-1 bg-dialin-purple hover:bg-dialin-purple-dark"
                  >
                    Create Floor
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}