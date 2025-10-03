import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trash2, Move, Plus, Send, Users, Settings, X, Check, Upload, Image, Sparkles } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface DialControlPanelProps {
  isOpen: boolean;
  item: {
    id: string;
    title: string;
    thumb: string;
    type?: string;
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
  onDialSaved?: () => void;
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
  onSettings,
  onDialSaved 
}: DialControlPanelProps) {
  const { toast } = useToast();
  const [selectedDials, setSelectedDials] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(['all']);
  const [newDialKeyword, setNewDialKeyword] = useState('');
  const [newDialIntensity, setNewDialIntensity] = useState([50]);
  const [customDials, setCustomDials] = useState<Array<{emoji: string, label: string, votes: number, intensity: number}>>([]);
  const [editingDialIndex, setEditingDialIndex] = useState<number | null>(null);
  const [selectedEmojiForIntensity, setSelectedEmojiForIntensity] = useState<{emoji: string, label: string} | null>(null);
  const [emojiIntensity, setEmojiIntensity] = useState([50]);
  const [showDialSettings, setShowDialSettings] = useState(false);
  const [dialSettings, setDialSettings] = useState({
    name: 'New Dial',
    keywords: ['min', 'max'],
    presentation: 'horizontal' as 'horizontal' | 'vertical' | 'buttons' | 'circular' | 'xy-pad',
    icon: null as string | null,
    keywordImages: {} as Record<string, string>
  });
  const [aiDescription, setAiDescription] = useState('');
  const [suggestedDials, setSuggestedDials] = useState<Array<{
    name: string;
    minLabel: string;
    maxLabel: string;
    defaultValue: number;
  }>>([]);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
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
      
      // Trigger celebration animation
      onDialSaved?.();
      
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
      
      // Trigger celebration for saving emoji intensity
      onDialSaved?.();
      
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

  const generateAIDescription = async () => {
    if (!item) return;
    
    setIsGeneratingDescription(true);
    try {
      const result = await aiService.describeItemWithDials(
        item.title,
        item.type
      );
      
      setAiDescription(result.description);
      setSuggestedDials(result.dials);
      
      toast({
        title: "Description & Dials generated!",
        description: `AI created a description and ${result.dials.length} contextual dials.`,
      });
    } catch (error) {
      console.error('Error generating description:', error);
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDescription(false);
    }
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
              {/* AI Description Section */}
              <div className="mb-6">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-semibold text-white">AI Description</h3>
                    </div>
                    <Button
                      onClick={generateAIDescription}
                      disabled={isGeneratingDescription}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 rounded-full px-4 py-1 text-xs"
                    >
                      {isGeneratingDescription ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  {aiDescription && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300 leading-relaxed">{aiDescription}</p>
                      
                      {suggestedDials.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                          <p className="text-xs text-purple-300 mb-2 font-medium">Suggested Dials:</p>
                          <div className="space-y-2">
                            {suggestedDials.map((dial, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-white">{dial.name}</p>
                                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>{dial.minLabel}</span>
                                    <span>{dial.maxLabel}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-purple-300 font-medium">
                                  {dial.defaultValue}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!aiDescription && !isGeneratingDescription && (
                    <p className="text-xs text-gray-500 italic">Click Generate to create an AI-powered description and contextual dials for this item</p>
                  )}
                </div>
              </div>

              {/* New Dial Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {editingDialIndex !== null ? 'EDIT DIAL' : 'NEW DIAL'}
                  </h3>
                  <button
                    onClick={() => setShowDialSettings(true)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Settings className="w-6 h-6 text-white" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Single line layout: keyword input, slider, and save button */}
                  <div className="flex items-center gap-3">
                    <Input
                      value={newDialKeyword}
                      onChange={(e) => setNewDialKeyword(e.target.value)}
                      placeholder="KEYWORD"
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 rounded-full px-6 py-3 w-32"
                    />
                    
                    {/* Horizontal slider with labels */}
                    <div className="flex-1 px-2">
                      {dialSettings.presentation === 'horizontal' && (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>{dialSettings.keywords[0] || 'min'}</span>
                            <span>{dialSettings.keywords[dialSettings.keywords.length - 1] || 'max'}</span>
                          </div>
                          <Slider
                            value={newDialIntensity}
                            onValueChange={setNewDialIntensity}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </>
                      )}
                      
                      {dialSettings.presentation !== 'horizontal' && (
                        <div className="text-center text-white text-sm py-2">
                          Intensity: {newDialIntensity[0]}%
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={saveNewDial}
                      disabled={!newDialKeyword.trim()}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6"
                    >
                      {editingDialIndex !== null ? 'UPDATE' : 'SAVE'}
                    </Button>
                  </div>
                  
                   <div className="px-2">
                     {/* Dynamic Dial Rendering for non-horizontal presentations */}
                     {dialSettings.presentation !== 'horizontal' && (
                       <div>
                      
                        {dialSettings.presentation === 'vertical' && (
                       <div className="flex items-center gap-4">
                         <div className="flex flex-col items-center">
                           <span className="text-xs text-gray-400 mb-2">{dialSettings.keywords[dialSettings.keywords.length - 1] || 'max'}</span>
                           <div className="h-32 w-2 bg-white/20 rounded-full relative">
                             <div 
                               className="absolute bottom-0 w-full bg-white rounded-full transition-all"
                               style={{ height: `${newDialIntensity[0]}%` }}
                             />
                           </div>
                           <span className="text-xs text-gray-400 mt-2">{dialSettings.keywords[0] || 'min'}</span>
                         </div>
                         <div className="text-white text-sm">
                           {newDialIntensity[0]}%
                         </div>
                       </div>
                     )}
                     
                     {dialSettings.presentation === 'buttons' && (
                       <div className="flex gap-2 flex-wrap">
                         {dialSettings.keywords.map((keyword, index) => (
                           <button
                             key={index}
                             onClick={() => setNewDialIntensity([Math.round((index / (dialSettings.keywords.length - 1)) * 100)])}
                             className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                               Math.abs(newDialIntensity[0] - (index / (dialSettings.keywords.length - 1)) * 100) < 10
                                 ? 'bg-white text-black'
                                 : 'bg-white/20 text-white hover:bg-white/30'
                             }`}
                           >
                             {keyword}
                           </button>
                         ))}
                       </div>
                     )}
                     
                        {dialSettings.presentation === 'circular' && (
                          <div className="flex flex-col items-center">
                            <div 
                              className="relative w-48 h-48 mb-4 cursor-pointer"
                             onMouseDown={(e) => {
                               const rect = e.currentTarget.getBoundingClientRect();
                               const centerX = rect.left + rect.width / 2;
                               const centerY = rect.top + rect.height / 2;
                               
                               const handleMouseMove = (e: MouseEvent) => {
                                 const deltaX = e.clientX - centerX;
                                 const deltaY = e.clientY - centerY;
                                 let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                                 
                                 // Convert to our coordinate system (-90 to 90 degrees)
                                 angle = angle + 90;
                                 if (angle > 90) angle = 90;
                                 if (angle < -90) angle = -90;
                                 
                                 // Convert angle to percentage (0-100)
                                 const percentage = ((angle + 90) / 180) * 100;
                                 setNewDialIntensity([Math.round(percentage)]);
                               };
                               
                               const handleMouseUp = () => {
                                 document.removeEventListener('mousemove', handleMouseMove);
                                 document.removeEventListener('mouseup', handleMouseUp);
                               };
                               
                               document.addEventListener('mousemove', handleMouseMove);
                               document.addEventListener('mouseup', handleMouseUp);
                               
                               // Handle initial click
                               handleMouseMove(e as any);
                             }}
                           >
                              {/* Circle border */}
                              <div className="absolute inset-8 border-4 border-white/20 rounded-full" />
                             
                              {/* Keywords distributed around the circle */}
                              {dialSettings.keywords.map((keyword, index) => {
                                const totalKeywords = dialSettings.keywords.length;
                                // Distribute evenly around circle, starting from 12 o'clock (top)
                                const angle = (index / (totalKeywords - 1)) * 180 - 90; // -90 to 90 degrees
                                const radius = 90; // Distance from center - moved outside the circle
                                const x = Math.cos((angle * Math.PI) / 180) * radius;
                                const y = Math.sin((angle * Math.PI) / 180) * radius;
                                
                                return (
                                  <div
                                    key={index}
                                    className="absolute text-xs text-white font-medium transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none"
                                    style={{
                                      left: `calc(50% + ${x}px)`,
                                      top: `calc(50% + ${y}px)`
                                    }}
                                  >
                                    {keyword}
                                  </div>
                                );
                              })}
                             
                              {/* Dial pointer */}
                              <div 
                                className="absolute top-8 left-1/2 w-1 h-16 bg-white rounded-full origin-bottom transform transition-transform pointer-events-none"
                                style={{ 
                                  transformOrigin: 'bottom center',
                                  transform: `translateX(-50%) rotate(${((newDialIntensity[0] / 100) * 180) - 90}deg)`
                                }}
                              />
                             
                              {/* Center dot */}
                              <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                           </div>
                          <div className="text-white text-sm">
                            {Math.round(((newDialIntensity[0] / 100) * (dialSettings.keywords.length - 1)))} - {dialSettings.keywords[Math.round(((newDialIntensity[0] / 100) * (dialSettings.keywords.length - 1)))] || 'N/A'}
                          </div>
                        </div>
                      )}
                     
                     {dialSettings.presentation === 'xy-pad' && (
                       <div className="flex flex-col items-center">
                         <div className="relative w-32 h-32 bg-white/20 rounded-lg mb-4">
                           <div 
                             className="absolute w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
                             style={{ 
                               left: `${newDialIntensity[0]}%`,
                               top: '50%'
                             }}
                           />
                         </div>
                         <div className="flex justify-between w-32 text-xs text-gray-400">
                           <span>{dialSettings.keywords[0] || 'min'}</span>
                           <span>{dialSettings.keywords[dialSettings.keywords.length - 1] || 'max'}</span>
                         </div>
                       </div>
                      )}
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              {/* Selected Emoji Intensity Section */}
              {selectedEmojiForIntensity && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {selectedEmojiForIntensity.emoji} {selectedEmojiForIntensity.label}
                  </h3>
                  
                  {/* Single line layout: emoji display, slider, and add button */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-white/20">
                      {selectedEmojiForIntensity.emoji}
                    </div>
                    
                    {/* Horizontal slider with labels */}
                    <div className="flex-1 px-2">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>min</span>
                        <span>max</span>
                      </div>
                      <Slider
                        value={emojiIntensity}
                        onValueChange={setEmojiIntensity}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-center mt-1 text-white text-sm">
                        {emojiIntensity[0]}%
                      </div>
                    </div>
                    
                    <Button
                      onClick={saveEmojiIntensity}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-6"
                    >
                      ADD
                    </Button>
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

      {/* Dial Settings Modal */}
      {showDialSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDialSettings(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-lg bg-white/[0.08] backdrop-blur-3xl rounded-3xl border border-white/[0.12] shadow-2xl p-6 text-white max-h-[80vh] overflow-y-auto"
            style={{
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">DIAL SETTINGS</h3>
              <button
                onClick={() => setShowDialSettings(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Dial Name Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">DIAL NAME</h4>
              <Input
                value={dialSettings.name}
                onChange={(e) => setDialSettings(prev => ({ ...prev, name: e.target.value }))}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                onMouseUp={(e) => e.preventDefault()}
                placeholder="Enter dial name"
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 rounded-lg px-4 py-2 w-full"
              />
            </div>

            {/* Keywords Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">KEYWORD SPECTRUM</h4>
              <div className="space-y-2">
                {dialSettings.keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={keyword}
                      onChange={(e) => setDialSettings(prev => ({
                        ...prev,
                        keywords: prev.keywords.map((k, i) => i === index ? e.target.value : k)
                      }))}
                      onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                      onMouseUp={(e) => e.preventDefault()}
                      placeholder={`Keyword ${index + 1}`}
                      className="bg-white/20 border-white/30 text-white placeholder:text-gray-400 rounded-lg px-4 py-2 flex-1"
                    />
                    <button
                      onClick={() => setDialSettings(prev => ({
                        ...prev,
                        keywordImages: { ...prev.keywordImages, [keyword]: '/placeholder-image.jpg' }
                      }))}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30"
                    >
                      <Image className="w-4 h-4 text-white" />
                    </button>
                    {dialSettings.keywords.length > 2 && (
                      <button
                        onClick={() => setDialSettings(prev => ({
                          ...prev,
                          keywords: prev.keywords.filter((_, i) => i !== index)
                        }))}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setDialSettings(prev => ({
                    ...prev,
                    keywords: [...prev.keywords, `Level ${prev.keywords.length + 1}`]
                  }))}
                  className="w-full p-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Keyword
                </button>
              </div>
            </div>

            {/* Presentation Type */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">DIAL TYPE</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'vertical', label: 'Vertical' },
                  { value: 'buttons', label: 'Buttons' },
                  { value: 'circular', label: 'Circular' },
                  { value: 'xy-pad', label: 'XY Pad' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDialSettings(prev => ({ ...prev, presentation: option.value as any }))}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      dialSettings.presentation === option.value
                        ? 'bg-white/30 border-white/50 text-white'
                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* Preview right below dial type */}
              <div className="mt-4">
                <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Preview</h5>
                <div className="p-4 bg-white/10 rounded-lg">
                  {dialSettings.presentation === 'horizontal' && (
                    <>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>{dialSettings.keywords[0] || 'min'}</span>
                        <span>{dialSettings.keywords[dialSettings.keywords.length - 1] || 'max'}</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full">
                        <div className="w-1/2 h-full bg-white rounded-full" />
                      </div>
                    </>
                  )}
                  {dialSettings.presentation === 'vertical' && (
                    <div className="flex justify-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 mb-1">{dialSettings.keywords[dialSettings.keywords.length - 1] || 'max'}</span>
                        <div className="h-20 w-2 bg-white/20 rounded-full relative">
                          <div className="absolute bottom-0 w-full bg-white rounded-full h-1/2" />
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{dialSettings.keywords[0] || 'min'}</span>
                      </div>
                    </div>
                  )}
                  {dialSettings.presentation === 'buttons' && (
                    <div className="flex gap-2 justify-center">
                      {dialSettings.keywords.map((keyword, index) => (
                        <button
                          key={index}
                          className={`px-3 py-1 text-xs rounded-full ${
                            index === 1 ? 'bg-white text-black' : 'bg-white/20 text-white'
                          }`}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  )}
                  {dialSettings.presentation === 'circular' && (
                    <div className="flex justify-center">
                      <div className="relative w-20 h-20">
                        <div className="w-full h-full border-4 border-white/20 rounded-full" />
                        
                        {/* Keywords distributed around the circle */}
                        {dialSettings.keywords.map((keyword, index) => {
                          const totalKeywords = dialSettings.keywords.length;
                          // Distribute evenly around circle, starting from 12 o'clock (top)
                          const angle = (index / (totalKeywords - 1)) * 180 - 90; // -90 to 90 degrees
                          const radius = 35; // Distance from center
                          const x = Math.cos((angle * Math.PI) / 180) * radius;
                          const y = Math.sin((angle * Math.PI) / 180) * radius;
                          
                          return (
                            <div
                              key={index}
                              className="absolute text-xs text-white font-medium transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                              style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`
                              }}
                            >
                              {keyword.substring(0, 3)}
                            </div>
                          );
                        })}
                        
                        {/* Dial pointer */}
                        <div className="absolute top-0 left-1/2 w-1 h-8 bg-white rounded-full transform -translate-x-1/2 rotate-45 origin-bottom" />
                        
                        {/* Center dot */}
                        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                  {dialSettings.presentation === 'xy-pad' && (
                    <div className="flex justify-center">
                      <div className="relative w-20 h-20 bg-white/20 rounded-lg">
                        <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dial Icon */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3">DIAL ICON</h4>
              <button
                onClick={() => {
                  // File upload simulation
                  setDialSettings(prev => ({ ...prev, icon: '/placeholder-icon.png' }));
                }}
                className="w-full p-4 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                {dialSettings.icon ? 'Change Icon' : 'Upload Icon'}
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDialSettings(false)}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowDialSettings(false);
                  // Apply settings logic here
                }}
                className="flex-1 bg-white/30 hover:bg-white/40 text-white border border-white/40 rounded-full"
              >
                Apply Settings
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}