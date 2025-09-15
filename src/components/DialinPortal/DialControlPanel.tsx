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
  { emoji: '💯', label: 'HUNDRED' },
  { emoji: '⚡', label: 'LIGHTNING' },
  { emoji: '🎯', label: 'TARGET' },
  { emoji: '🎉', label: 'PARTY' },
];

const mockPeople = [
  { id: 'all', name: 'All', avatar: '/public/lovable-uploads/1e022703-aa29-4fc7-82ce-a5e734f8fe91.png' },
  { id: '1', name: 'Alice', avatar: '/public/lovable-uploads/480b4a89-5167-4b3a-b770-090a5367cd92.png' },
  { id: '2', name: 'Bob', avatar: '/public/lovable-uploads/4a081491-5093-440d-993f-14bf495c4380.png' },
  { id: '3', name: 'Charlie', avatar: '/public/lovable-uploads/58cee9e8-f4f9-40a4-9565-e582aca775f1.png' },
  { id: '4', name: 'Diana', avatar: '/public/lovable-uploads/8600e4d1-299a-4ed6-93a5-5cf4ccef922e.png' },
  { id: '5', name: 'Eve', avatar: '/public/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png' },
  { id: '6', name: 'Frank', avatar: '/public/lovable-uploads/8b2617c9-35d8-4b43-aaea-0787f47b6053.png' },
  { id: '7', name: 'Grace', avatar: '/public/lovable-uploads/a84b7237-eb79-414b-bf89-4ea53044a7ea.png' },
  { id: '8', name: 'Henry', avatar: '/public/lovable-uploads/ab5a802a-5c5c-4cb0-bea7-ee6349ad6e55.png' },
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
  const [selectedPeople, setSelectedPeople] = useState<string[]>(['all']);
  const [newDialKeyword, setNewDialKeyword] = useState('');
  const [newDialIntensity, setNewDialIntensity] = useState([50]);
  const [customDials, setCustomDials] = useState<Array<{emoji: string, label: string, votes: number, intensity: number}>>([]);
  const [editingDialIndex, setEditingDialIndex] = useState<number | null>(null);
  const [selectedEmojiForIntensity, setSelectedEmojiForIntensity] = useState<{emoji: string, label: string} | null>(null);
  const [emojiIntensity, setEmojiIntensity] = useState([50]);
  const [votingResults, setVotingResults] = useState<Array<{dial: string, votes: number, percentage: number, avgIntensity: number, userVotes: Array<{userId: string, intensity: number}>}>>([
    { dial: '🤝', votes: 12, percentage: 35, avgIntensity: 75, userVotes: [
      {userId: '1', intensity: 80}, {userId: '2', intensity: 70}, {userId: '3', intensity: 75}
    ]},
    { dial: '👍', votes: 8, percentage: 24, avgIntensity: 65, userVotes: [
      {userId: '1', intensity: 60}, {userId: '4', intensity: 70}
    ]},
    { dial: '🔥', votes: 6, percentage: 18, avgIntensity: 90, userVotes: [
      {userId: '2', intensity: 95}, {userId: '5', intensity: 85}
    ]},
    { dial: '😊', votes: 4, percentage: 12, avgIntensity: 55, userVotes: [
      {userId: '3', intensity: 55}
    ]},
    { dial: '🚀', votes: 4, percentage: 11, avgIntensity: 85, userVotes: [
      {userId: '4', intensity: 85}
    ]},
  ]);

  if (!item) return null;

  const toggleDial = (emoji: string, label: string) => {
    setSelectedEmojiForIntensity({emoji, label});
    setEmojiIntensity([50]);
  };

  const togglePerson = (personId: string) => {
    if (personId === 'all') {
      setSelectedPeople(['all']);
    } else {
      setSelectedPeople(prev => {
        const withoutAll = prev.filter(id => id !== 'all');
        return prev.includes(personId) 
          ? withoutAll.filter(id => id !== personId)
          : [...withoutAll, personId];
      });
    }
  };

  const handleSelect = () => {
    onSelect(selectedDials, []);
    onClose();
  };

  const saveNewDial = () => {
    if (newDialKeyword.trim()) {
      const dialData = {
        emoji: '🎭',
        label: newDialKeyword.toUpperCase(),
        votes: 1,
        intensity: newDialIntensity[0]
      };
      
      if (editingDialIndex !== null) {
        setCustomDials(prev => prev.map((dial, index) => 
          index === editingDialIndex ? dialData : dial
        ));
        setEditingDialIndex(null);
      } else {
        setCustomDials(prev => [...prev, dialData]);
        // Add to voting results
        setVotingResults(prev => [...prev, {
          dial: dialData.emoji,
          votes: 1,
          percentage: Math.round(100 / (prev.length + 1)),
          avgIntensity: dialData.intensity,
          userVotes: [{userId: '1', intensity: dialData.intensity}]
        }]);
      }
      
      setNewDialKeyword('');
      setNewDialIntensity([50]);
    }
  };

  const saveEmojiIntensity = () => {
    if (selectedEmojiForIntensity) {
      const dialData = {
        emoji: selectedEmojiForIntensity.emoji,
        label: selectedEmojiForIntensity.label,
        votes: 1,
        intensity: emojiIntensity[0]
      };
      
      setCustomDials(prev => [...prev, dialData]);
      
      // Update voting results
      setVotingResults(prev => {
        const existing = prev.find(r => r.dial === dialData.emoji);
        if (existing) {
          return prev.map(r => r.dial === dialData.emoji ? {
            ...r,
            votes: r.votes + 1,
            avgIntensity: Math.round((r.avgIntensity * r.votes + dialData.intensity) / (r.votes + 1)),
            userVotes: [...r.userVotes, {userId: '1', intensity: dialData.intensity}]
          } : r);
        } else {
          return [...prev, {
            dial: dialData.emoji,
            votes: 1,
            percentage: Math.round(100 / (prev.length + 1)),
            avgIntensity: dialData.intensity,
            userVotes: [{userId: '1', intensity: dialData.intensity}]
          }];
        }
      });
      
      setSelectedEmojiForIntensity(null);
      setEmojiIntensity([50]);
    }
  };

  const editCustomDial = (index: number) => {
    const dial = customDials[index];
    setNewDialKeyword(dial.label);
    setNewDialIntensity([dial.intensity]);
    setEditingDialIndex(index);
  };

  const getFilteredVotingResults = () => {
    if (selectedPeople.includes('all')) {
      return votingResults.map(result => ({
        ...result,
        displayIntensity: result.avgIntensity
      }));
    } else {
      return votingResults.map(result => {
        const userVotesForSelected = result.userVotes.filter(vote => 
          selectedPeople.includes(vote.userId)
        );
        
        if (userVotesForSelected.length === 0) return null;
        
        const avgIntensity = Math.round(
          userVotesForSelected.reduce((sum, vote) => sum + vote.intensity, 0) / userVotesForSelected.length
        );
        
        return {
          ...result,
          votes: userVotesForSelected.length,
          displayIntensity: avgIntensity,
          percentage: Math.round((userVotesForSelected.length / selectedPeople.length) * 100)
        };
      }).filter(Boolean);
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="relative z-10 w-full max-w-2xl mx-4 md:max-w-5xl bg-white/[0.08] backdrop-blur-3xl rounded-t-3xl md:rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/20 overflow-hidden max-h-[90vh] flex flex-col text-white"
            style={{
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
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
                  <h3 className="text-lg font-bold text-white">
                    {editingDialIndex !== null ? 'EDIT DIAL' : 'NEW DIAL'}
                  </h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={newDialKeyword}
                      onChange={(e) => setNewDialKeyword(e.target.value)}
                      placeholder="KEYWORD"
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 rounded-full px-6 py-3 flex-1"
                    />
                    <Button
                      onClick={saveNewDial}
                      disabled={!newDialKeyword.trim()}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6"
                    >
                      {editingDialIndex !== null ? 'UPDATE' : 'SAVE'}
                    </Button>
                  </div>
                  
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

              {/* Selected Emoji Intensity Section */}
              {selectedEmojiForIntensity && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                      {selectedEmojiForIntensity.emoji} {selectedEmojiForIntensity.label}
                    </h3>
                    <Button
                      onClick={saveEmojiIntensity}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6"
                    >
                      ADD
                    </Button>
                  </div>
                  
                  <div className="px-2">
                    <Slider
                      value={emojiIntensity}
                      onValueChange={setEmojiIntensity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center mt-2 text-white text-sm">
                      Intensity: {emojiIntensity[0]}%
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Dials Section (now called "Dials") */}
              {customDials.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">DIALS</h3>
                  </div>
                  
                   <div className="grid grid-cols-8 gap-3">
                     {customDials.map((dial, index) => (
                       <button
                         key={index}
                         onClick={() => editCustomDial(index)}
                         className="flex flex-col items-center space-y-1 group"
                       >
                         <div
                           className={`
                             w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-white/20
                             ${editingDialIndex === index ? 'ring-4 ring-blue-400' : ''}
                             group-hover:scale-110 transition-all duration-200
                           `}
                         >
                           {dial.emoji}
                         </div>
                         <span className="text-xs text-gray-300 text-center font-medium">
                           {dial.label}
                         </span>
                         <span className="text-xs text-gray-400 text-center">
                           {dial.intensity}%
                         </span>
                       </button>
                     ))}
                   </div>
                </div>
              )}

              {/* Express Yourself Section (previously "Dials") */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">EXPRESS YOURSELF</h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="grid grid-cols-8 gap-3">
                  {dialEmojis.map((dial, index) => (
                    <button
                      key={index}
                      onClick={() => toggleDial(dial.emoji, dial.label)}
                      className="flex flex-col items-center space-y-1 group"
                    >
                      <div
                        className={`
                          w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-white/20
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

              {/* Voting Results Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">VOTING RESULTS</h3>
                </div>
                
                <div className="space-y-3">
                  {getFilteredVotingResults().map((result, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
                          {result.dial}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{result.votes} votes</span>
                          <span className="text-xs text-gray-400">Avg: {result.displayIntensity}%</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-8">{result.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* People Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">PEOPLE</h3>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                
                <div className="grid grid-cols-8 gap-3">
                  {mockPeople.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className="flex flex-col items-center space-y-1 group"
                    >
                      <Avatar 
                        className={`w-12 h-12 ${selectedPeople.includes(person.id) ? 'ring-4 ring-white' : ''} group-hover:scale-110 transition-all duration-200`}
                      >
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="bg-white/20 text-white">{person.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-300 text-center font-medium">
                        {person.name}
                      </span>
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