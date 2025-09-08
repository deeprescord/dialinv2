import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trash2, Share2, Send, Settings, X, Check } from 'lucide-react';

interface DialControlPanelProps {
  isOpen: boolean;
  item: {
    id: string;
    title: string;
    thumb: string;
    owner?: {
      name: string;
      avatar: string;
    };
    dateCreated?: string;
  } | null;
  onClose: () => void;
  onSelect: (selectedDials: string[], selectedSets: string[]) => void;
  onOwnerClick?: (ownerId: string) => void;
  onDelete?: () => void;
  onShare?: () => void;
  onPost?: () => void;
  onSettings?: () => void;
}

const dialSets = [
  { id: 'food', name: 'Food', icon: '🍕', color: 'from-orange-500 to-red-500' },
  { id: 'posts', name: 'Posts', icon: 'MY\nPOST', color: 'from-gray-100 to-white', textColor: 'text-black' },
  { id: 'town-square', name: 'Town Square', icon: '🏛️', color: 'from-gray-600 to-gray-800' },
  { id: 'news', name: 'News', icon: '📰', color: 'from-blue-500 to-blue-700' },
  { id: 'video', name: 'Video', icon: '🎬', color: 'from-purple-500 to-pink-500' },
];

const dialEmojis = [
  '🤝', '👍', '👎', '❓', '🔥', '❗',
  '😱', '😊', '🤔', '😭', '🙏', '🚀',
];

export function DialControlPanel({
  isOpen,
  item,
  onClose,
  onSelect,
  onOwnerClick,
  onDelete,
  onShare,
  onPost,
  onSettings
}: DialControlPanelProps) {
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedDials, setSelectedDials] = useState<string[]>([]);

  if (!item) return null;

  const toggleSet = (setId: string) => {
    setSelectedSets(prev => 
      prev.includes(setId) 
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const toggleDial = (dial: string) => {
    setSelectedDials(prev => 
      prev.includes(dial) 
        ? prev.filter(d => d !== dial)
        : [...prev, dial]
    );
  };

  const handleSelect = () => {
    onSelect(selectedDials, selectedSets);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="relative z-10 w-full max-w-md mx-4 md:max-w-lg bg-background/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl border border-border/50 overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {item.dateCreated || 'August 30th, 2025'}
                  </p>
                </div>
                
                {item.owner && (
                  <button
                    onClick={() => onOwnerClick?.(item.owner!.name)}
                    className="flex flex-col items-center space-y-1 hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                      <AvatarFallback>{item.owner.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{item.owner.name}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6">
              {/* Sets Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-center">sets</h3>
                <div className="flex justify-center space-x-4 flex-wrap gap-y-4">
                  {dialSets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => toggleSet(set.id)}
                      className="flex flex-col items-center space-y-2 group"
                    >
                      <div
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xs
                          bg-gradient-to-br ${set.color} ${set.textColor || 'text-white'}
                          ${selectedSets.includes(set.id) ? 'ring-4 ring-primary' : ''}
                          group-hover:scale-110 transition-all duration-200
                        `}
                      >
                        {set.icon.includes('\n') ? (
                          <div className="text-center leading-tight">
                            {set.icon.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-2xl">{set.icon}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{set.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dials Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-center">dials</h3>
                <div className="grid grid-cols-6 gap-4 justify-items-center">
                  {dialEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDial(emoji)}
                      className={`
                        w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-xl
                        ${selectedDials.includes(emoji) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                        transition-all duration-200 hover:scale-110
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-around py-6 border-t border-border/50">
                <button
                  onClick={onDelete}
                  className="flex flex-col items-center space-y-1 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Trash2 size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">delete</span>
                </button>
                
                <button
                  onClick={onShare}
                  className="flex flex-col items-center space-y-1 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Share2 size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">share</span>
                </button>
                
                <button
                  onClick={onPost}
                  className="flex flex-col items-center space-y-1 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Send size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">post</span>
                </button>
                
                <button
                  onClick={onSettings}
                  className="flex flex-col items-center space-y-1 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Settings size={24} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">settings</span>
                </button>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex p-4 space-x-4 bg-muted/20 border-t border-border/50">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
              >
                <X className="mr-2" size={16} />
                CANCEL
              </Button>
              
              <Button
                onClick={handleSelect}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2" size={16} />
                SELECT
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}