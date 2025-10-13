import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Close, Users, Home, Pin, Bell } from '../icons';
import { Friend } from '@/data/catalogs';

interface AddContactPanelProps {
  isOpen: boolean;
  contact: Friend | null;
  onClose: () => void;
  spaces?: Array<{
    id: string;
    name: string;
    thumb: string;
  }>;
  onAddToSpace?: (spaceId: string) => void;
}

export function AddContactPanel({ 
  isOpen, 
  contact, 
  onClose,
  spaces = [],
  onAddToSpace
}: AddContactPanelProps) {
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  if (!contact) return null;

  const handleActionToggle = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  const handleAddToSpace = (spaceId: string) => {
    onAddToSpace?.(spaceId);
    // You could show a toast notification here
  };

  const addActions = [
    {
      id: 'favorites',
      label: 'Add to Favorites',
      icon: Pin,
      description: 'Quick access to this contact',
      color: 'text-red-400'
    },
    {
      id: 'upcoming',
      label: 'Get Notifications',
      icon: Bell,
      description: 'Stay updated with their activity',
      color: 'text-blue-400'
    },
    {
      id: 'group',
      label: 'Create Group',
      icon: Users,
      description: 'Start a new group with this contact',
      color: 'text-purple-400'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-start justify-center pt-8" style={{ height: '70vh' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Add Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative z-10 w-[85vw] max-w-4xl h-[calc(70vh-4rem)] overflow-y-auto"
          >
            <div className="w-full glass-card border border-white/10 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Add {contact.name}</h3>
                    <p className="text-sm text-white/60">Choose how to connect</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-white/10 text-white"
                >
                  <Close size={16} />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="p-6 border-b border-white/10">
                <h4 className="text-sm font-medium text-white/80 mb-4 uppercase tracking-wide">Quick Actions</h4>
                <div className="grid grid-cols-1 gap-3">
                  {addActions.map((action) => {
                    const IconComponent = action.icon;
                    const isSelected = selectedActions.includes(action.id);
                    
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleActionToggle(action.id)}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200 ${
                          isSelected 
                            ? 'border-primary/50 bg-primary/10' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-full bg-black/20 ${action.color}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 text-left">
                          <h5 className="font-medium text-white">{action.label}</h5>
                          <p className="text-sm text-white/60">{action.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary' 
                            : 'border-white/30'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add to Spaces */}
              {spaces.length > 0 && (
                <div className="p-6">
                  <h4 className="text-sm font-medium text-white/80 mb-4 uppercase tracking-wide">Add to Spaces</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {spaces.map((space) => (
                      <button
                        key={space.id}
                        onClick={() => handleAddToSpace(space.id)}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                          {space.thumb ? (
                            <img 
                              src={space.thumb} 
                              alt={space.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Home size={16} className="text-white/60" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h5 className="font-medium text-white text-sm">{space.name}</h5>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 p-6 border-t border-white/10 bg-black/10">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle the selected actions
                    console.log('Selected actions:', selectedActions);
                    onClose();
                  }}
                  disabled={selectedActions.length === 0}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  Add Selected
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}