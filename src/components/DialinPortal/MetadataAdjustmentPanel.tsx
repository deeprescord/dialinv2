import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Sparkles, MapPin, ChevronRight, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { SpacesBar } from './SpacesBar';

interface DialSuggestion {
  key: string;
  label: string;
  type: 'slider' | 'select';
  value: any;
  options?: string[];
}

interface MetadataAdjustmentPanelProps {
  fileName: string;
  fileType: string;
  initialHashtags?: string[];
  initialDialValues?: Record<string, any>;
  suggestedDials?: DialSuggestion[];
  suggestedSpaces?: string[];
  availableSpaces: Array<{ id: string; name: string; parent_id?: string | null }>;
  confidence?: number;
  isAiGenerated?: boolean;
  onSave: (metadata: {
    hashtags: string[];
    dialValues: Record<string, any>;
    selectedSpaceId: string;
    location?: { lat: number; lng: number; address?: string };
  }) => void;
  onCancel: () => void;
  onCreateSpace?: (name: string, parentId: string) => Promise<void>;
  onDeleteSpace?: (id: string) => void;
  onRenameSpace?: (id: string, newName: string) => void;
  onReorderSpaces?: (spaceIds: string[]) => void;
  onToggle360?: (spaceId: string) => void;
}

export function MetadataAdjustmentPanel({
  fileName,
  fileType,
  initialHashtags = [],
  initialDialValues = {},
  suggestedDials = [],
  suggestedSpaces = [],
  availableSpaces,
  confidence = 0,
  isAiGenerated = true,
  onSave,
  onCancel,
  onCreateSpace,
  onDeleteSpace,
  onRenameSpace,
  onReorderSpaces,
  onToggle360
}: MetadataAdjustmentPanelProps) {
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);
  const [newHashtag, setNewHashtag] = useState('');
  const [dialValues, setDialValues] = useState<Record<string, any>>(initialDialValues);
  const [activeDials, setActiveDials] = useState<DialSuggestion[]>([]);
  const [availableDials, setAvailableDials] = useState<DialSuggestion[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    suggestedSpaces[0] || availableSpaces[0]?.id || 'lobby'
  );
  const [currentParentId, setCurrentParentId] = useState<string | null>(null); // Track current hierarchy level
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const moodOptions = ['happy', 'sad', 'calm', 'excited', 'angry', 'peaceful', 'neutral'];
  const vibeOptions = ['chill', 'energetic', 'dark', 'uplifting', 'contemplative', 'futuristic', 'neutral'];

  // Initialize dials from suggestions
  useEffect(() => {
    if (suggestedDials.length > 0) {
      const top3 = suggestedDials.slice(0, 3);
      const remaining = suggestedDials.slice(3);
      setActiveDials(top3);
      setAvailableDials(remaining);
      
      // Initialize dial values
      const initialValues: Record<string, any> = {};
      top3.forEach(dial => {
        initialValues[dial.key] = dial.value;
      });
      setDialValues(prev => ({ ...prev, ...initialValues }));
    }
  }, [suggestedDials]);

  // Auto-capture location
  useEffect(() => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          setLoadingLocation(false);
          toast.success('Location captured');
        },
        (error) => {
          console.error('Location error:', error);
          setLoadingLocation(false);
        }
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  const handleAddHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      setHashtags([...hashtags, newHashtag.trim()]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleDialChange = (key: string, value: any) => {
    setDialValues(prev => ({ ...prev, [key]: value }));
  };

  const handleAddDial = (dial: DialSuggestion) => {
    setActiveDials(prev => [...prev, dial]);
    setDialValues(prev => ({ ...prev, [dial.key]: dial.value }));
    setAvailableDials(prev => prev.filter(d => d.key !== dial.key));
  };

  const handleRemoveSuggestedDial = (dialKey: string) => {
    setAvailableDials(prev => prev.filter(d => d.key !== dialKey));
  };

  const handleCloseDial = (dialKey: string) => {
    setActiveDials(prev => prev.filter(d => d.key !== dialKey));
    const { [dialKey]: _, ...rest } = dialValues;
    setDialValues(rest);
  };

  const handleSave = () => {
    if (!selectedSpaceId) {
      toast.error('Please select a space');
      setCurrentStep(3);
      return;
    }
    onSave({
      hashtags,
      dialValues,
      selectedSpaceId,
      location: location || undefined
    });
  };

  const canProceedToStep2 = hashtags.length > 0;
  const canProceedToStep3 = activeDials.length > 0;

  const getDialOptions = (dial: DialSuggestion) => {
    if (dial.key === 'mood') return moodOptions;
    if (dial.key === 'vibe') return vibeOptions;
    return dial.options || [];
  };

  const handleSpaceClick = (space: any) => {
    // Check if this space has children
    const hasChildren = availableSpaces.some(s => s.parent_id === space.id);
    
    if (hasChildren) {
      // Drill down into this space
      setCurrentParentId(space.id);
    } else {
      // Select this space as destination
      setSelectedSpaceId(space.id);
    }
  };

  // Build breadcrumb path
  const buildBreadcrumbs = (parentId: string | null): Array<{ id: string; name: string }> => {
    const breadcrumbs: Array<{ id: string; name: string }> = [];
    
    if (parentId === null) {
      return breadcrumbs;
    }
    
    let current = availableSpaces.find(s => s.id === parentId);
    while (current) {
      breadcrumbs.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? availableSpaces.find(s => s.id === current!.parent_id) : undefined;
    }
    
    return breadcrumbs;
  };

  // Get spaces at current level
  const getCurrentLevelSpaces = () => {
    return availableSpaces.filter(s => 
      (currentParentId === null && !s.parent_id) || s.parent_id === currentParentId
    );
  };

  // Group dials by category for better organization
  const dialsByCategory = activeDials.reduce((acc, dial) => {
    const category = dial.key.includes('mood') || dial.key.includes('vibe') || dial.key.includes('energy') 
      ? 'Mood & Energy' 
      : dial.key.includes('tempo') || dial.key.includes('genre') || dial.key.includes('acousticness')
      ? 'Music Properties'
      : dial.key.includes('spiciness') || dial.key.includes('richness') || dial.key.includes('presentation')
      ? 'Food & Taste'
      : dial.key.includes('atmosphere') || dial.key.includes('noise') || dial.key.includes('crowd')
      ? 'Location Context'
      : 'General';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(dial);
    return acc;
  }, {} as Record<string, DialSuggestion[]>);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background/95 border-primary/20">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Organize & Place Item</h2>
                {isAiGenerated && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Analyzed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{fileName}</p>
              {confidence > 0 && (
                <div className="flex items-center gap-2">
                  <Progress value={confidence * 100} className="w-24 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {(confidence * 100).toFixed(0)}% confident
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 3-Step Progress Indicator */}
          <div className="flex items-center justify-between px-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div 
                  className={`flex items-center gap-2 cursor-pointer ${
                    currentStep === step ? 'opacity-100' : 'opacity-50'
                  }`}
                  onClick={() => setCurrentStep(step as 1 | 2 | 3)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep === step 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step
                      ? 'bg-primary/50 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step ? <Check className="w-4 h-4" /> : step}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">
                    {step === 1 ? 'Tags' : step === 2 ? 'Dials' : 'Space'}
                  </span>
                </div>
                {step < 3 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Hashtags & Location */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Hashtags</Label>
                  <Badge variant="outline">{hashtags.length} tags</Badge>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg border border-dashed border-primary/30 bg-muted/20">
                  {hashtags.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Add hashtags to categorize this item...</p>
                  ) : (
                    hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1 text-sm">
                        #{tag}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-destructive/20"
                          onClick={() => handleRemoveHashtag(tag)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add hashtag (e.g., vacation, food, music)..."
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddHashtag} size="icon" disabled={!newHashtag.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Location Capture */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-primary/20">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Location</Label>
                </div>
                {loadingLocation ? (
                  <p className="text-sm text-muted-foreground">Capturing location...</p>
                ) : location ? (
                  <div className="space-y-2">
                    <div className="p-3 rounded bg-background/50 border border-primary/10">
                      <p className="text-sm font-mono">
                        📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                      {location.address && (
                        <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setLocation(null)}
                    >
                      Clear Location
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Location not available</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => setCurrentStep(2)} 
                  disabled={!canProceedToStep2}
                  className="gap-2"
                >
                  Next: Adjust Dials
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Dials */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Active Dials - Grouped by Category */}
              {Object.entries(dialsByCategory).map(([category, dials]) => (
                <div key={category} className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    {category}
                    <Badge variant="outline" className="text-xs">{dials.length}</Badge>
                  </Label>
                  <div className="space-y-3">
                    {dials.map((dial) => (
                      <motion.div
                        key={dial.key}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-background/50 to-muted/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">{dial.label}</Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-destructive/20"
                            onClick={() => handleCloseDial(dial.key)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {dial.type === 'slider' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Intensity</span>
                              <span className="text-lg font-bold text-primary">
                                {dialValues[dial.key] || dial.value}/10
                              </span>
                            </div>
                            <Slider
                              value={[dialValues[dial.key] || dial.value]}
                              onValueChange={([value]) => handleDialChange(dial.key, value)}
                              max={10}
                              step={1}
                              className="py-2"
                            />
                          </div>
                        ) : (
                          <Select
                            value={dialValues[dial.key] || dial.value}
                            onValueChange={(value) => handleDialChange(dial.key, value)}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getDialOptions(dial).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Suggested Dials */}
              {availableDials.length > 0 && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-dashed border-primary/30">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Suggested Dials
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {availableDials.map((dial) => (
                      <Badge
                        key={dial.key}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all gap-1 px-3 py-1"
                        onClick={() => handleAddDial(dial)}
                      >
                        <Plus className="w-3 h-3" />
                        {dial.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setCurrentStep(3)}
                  disabled={!canProceedToStep3}
                  className="gap-2"
                >
                  Next: Select Space
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Space Selection */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" />
                  <Label className="text-lg font-semibold">Select Destination Space</Label>
                </div>
                
                {/* Breadcrumb Navigation */}
                {currentParentId !== null && buildBreadcrumbs(currentParentId).length > 0 && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentParentId(null)}
                      className="h-8 px-2"
                    >
                      Lobby
                    </Button>
                    {buildBreadcrumbs(currentParentId).map((crumb, index) => (
                      <React.Fragment key={crumb.id}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentParentId(crumb.id)}
                          className="h-8 px-2"
                        >
                          {crumb.name}
                        </Button>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* SpacesBar Integration with glow on selected */}
                <div className="relative">
                  <style>{`
                    .space-selected-glow {
                      box-shadow: 0 0 20px 4px hsl(var(--primary) / 0.6),
                                  0 0 40px 8px hsl(var(--primary) / 0.3),
                                  inset 0 0 15px hsl(var(--primary) / 0.2);
                      border: 2px solid hsl(var(--primary));
                    }
                  `}</style>
                  <SpacesBar
                    spaces={getCurrentLevelSpaces().map(s => ({
                      id: s.id,
                      name: s.name,
                      thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
                      parentId: s.parent_id || undefined
                    }))}
                    currentSpaceId={selectedSpaceId}
                    onSpaceClick={handleSpaceClick}
                    onCreateSpace={onCreateSpace ? async () => {
                      const spaceName = prompt('Enter space name:');
                      if (spaceName && onCreateSpace) {
                        await onCreateSpace(spaceName, currentParentId || 'lobby');
                      }
                    } : () => {}}
                    onDeleteSpace={onDeleteSpace || (() => {})}
                    onRenameSpace={onRenameSpace || (() => {})}
                    onUpdateSpaceDescription={() => {}}
                    onReorderSpace={() => {}}
                    onToggle360={onToggle360 || (() => {})}
                    breadcrumbs={currentParentId ? buildBreadcrumbs(currentParentId) : undefined}
                    hideNewButton={false}
                    hideAIButton={true}
                    hideChatButton={true}
                  />
                </div>

                {/* Selected Space Indicator */}
                {selectedSpaceId && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-xs text-muted-foreground mb-1">Item will be placed in:</p>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <FolderTree className="w-4 h-4 text-primary" />
                      <span className="text-primary">
                        {availableSpaces.find(s => s.id === selectedSpaceId)?.name || 'Lobby'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="gap-2"
                  disabled={!selectedSpaceId}
                >
                  <Check className="w-4 h-4" />
                  Save & Place Item
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}