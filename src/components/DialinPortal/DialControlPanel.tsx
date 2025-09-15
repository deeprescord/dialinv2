import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trash2, Move, Plus, Send, Users, Settings, X, Check } from 'lucide-react';

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

const dialEmojis = [
  { emoji: '🤝', label: 'HANDSHAKE' },
  { emoji: '👍', label: 'THUMBS UP' },
  { emoji: '👎', label: 'THUMBS DOWN' },
  { emoji: '❓', label: 'QUESTION' },
  { emoji: '🔥', label: 'FIRE' },
  { emoji: '❗', label: 'EXCLAMATION' },
  { emoji: '😱', label: 'SHOCKED' },
  { emoji: '😊', label: 'HAPPY' },
  { emoji: '🤔', label: 'THINKING' },
  { emoji: '😭', label: 'CRYING' },
  { emoji: '🙏', label: 'PRAY' },
  { emoji: '🚀', label: 'ROCKET' },
];

const mockPeople = [
  { id: '1', name: 'Alice', avatar: '/placeholder.svg' },
  { id: '2', name: 'Bob', avatar: '/placeholder.svg' },
  { id: '3', name: 'Charlie', avatar: '/placeholder.svg' },
  { id: '4', name: 'Diana', avatar: '/placeholder.svg' },
  { id: '5', name: 'Eve', avatar: '/placeholder.svg' },
  { id: '6', name: 'Frank', avatar: '/placeholder.svg' },
  { id: '7', name: 'Grace', avatar: '/placeholder.svg' },
  { id: '8', name: 'Henry', avatar: '/placeholder.svg' },
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
  const [selectedDials, setSelectedDials] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [newDialKeyword, setNewDialKeyword] = useState('');
  const [newDialIntensity, setNewDialIntensity] = useState([50]);

  if (!item) return null;

  const toggleDial = (emoji: string) => {
    setSelectedDials(prev => 
      prev.includes(emoji) 
        ? prev.filter(d => d !== emoji)
        : [...prev, emoji]
    );
  };

  const togglePerson = (personId: string) => {
    setSelectedPeople(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const handleSelect = () => {
    onSelect(selectedDials, []);
    onClose();
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="relative z-10 w-full max-w-md mx-4 md:max-w-lg bg-black/95 backdrop-blur-md rounded-t-3xl md:rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col text-white"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1 text-white">{item.title}</h2>
                  <p className="text-sm text-gray-400">
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
                    <span className="text-xs text-gray-400">{item.owner.name}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6">
              {/* New Dial Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">NEW DIAL</h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="space-y-4">
                  <Input
                    value={newDialKeyword}
                    onChange={(e) => setNewDialKeyword(e.target.value)}
                    placeholder="KEYWORD"
                    className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 rounded-full px-6 py-3"
                  />
                  
                  <div className="px-2">
                    <Slider
                      value={newDialIntensity}
                      onValueChange={setNewDialIntensity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Dials Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">DIALS</h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {dialEmojis.map((dial, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDial(dial.emoji)}
                      className="flex flex-col items-center space-y-2 group"
                    >
                      <div
                        className={`
                          w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-white/20
                          ${selectedDials.includes(dial.emoji) ? 'ring-4 ring-white' : ''}
                          group-hover:scale-110 transition-all duration-200
                        `}
                      >
                        {dial.emoji}
                      </div>
                      <span className="text-xs text-gray-300 text-center font-medium">
                        {dial.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* People Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">PEOPLE</h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {mockPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className="flex flex-col items-center space-y-1 group"
                    >
                      <Avatar 
                        className={`w-16 h-16 ${selectedPeople.includes(person.id) ? 'ring-4 ring-white' : ''} group-hover:scale-110 transition-all duration-200`}
                      >
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="bg-white/20 text-white">{person.name[0]}</AvatarFallback>
                      </Avatar>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="grid grid-cols-4 gap-2 p-4 bg-black/50 border-t border-white/10">
              <div className="col-span-4 grid grid-cols-7 gap-2">
                <button
                  onClick={onDelete}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">DELETE</span>
                </button>
                
                <button
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Move size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">MOVE</span>
                </button>
                
                <button
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Plus size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">ADD</span>
                </button>
                
                <button
                  onClick={onPost}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Send size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">POST</span>
                </button>
                
                <button
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Users size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">CONNECT</span>
                </button>
                
                <button
                  onClick={onSettings}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">SETTINGS</span>
                </button>
                
                <button
                  onClick={handleSelect}
                  className="flex flex-col items-center space-y-1 p-3 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Check size={20} className="text-white" />
                  <span className="text-xs text-white font-medium">SELECT</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}