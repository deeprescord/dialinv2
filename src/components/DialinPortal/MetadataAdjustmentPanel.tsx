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
import { MultiSelectDial } from './MultiSelectDial';
import { CustomDialInput } from './CustomDialInput';
import { getDialTaxonomy } from '@/data/dialTaxonomies';

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
  availableSpaces: Array<{ id: string; name: string; parent_id?: string | null; cover_url?: string | null; updated_at?: string | null }>;
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
  const [customDials, setCustomDials] = useState<Array<{ id: string; name: string }>>([]);
  
  // Get content type for custom dials
  const contentType = fileType === 'audio' ? 'music' : fileType;

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

  const handleCustomDialsChange = (dials: Array<{ id: string; name: string }>) => {
    setCustomDials(dials);
  };

  const handleSave = () => {
    if (!selectedSpaceId) {
      toast.error('Please select a space');
      setCurrentStep(3);
      return;
    }
    
    // Build final dial values including custom dials
    const finalDialValues = {
      ...dialValues,
      custom: customDials.map(d => d.name)
    };
    
    onSave({
      hashtags,
      dialValues: finalDialValues,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10 backdrop-blur-sm"
    >
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col bg-gradient-to-br from-background via-background/95 to-primary/5 border-2 border-primary/30 shadow-2xl shadow-primary/20">
        <div className="flex-none p-6 pb-4 border-b border-primary/20">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Organize & Place Item
                </h2>
                {isAiGenerated && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm bg-primary/20 text-primary border-primary/40">
                    <Sparkles className="w-4 h-4" />
                    AI Analyzed
                  </Badge>
                )}
              </div>
              <p className="text-base text-muted-foreground font-medium">{fileName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

          {/* 3-Step Progress Indicator */}
          <div className="flex-none px-6 py-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div 
                    className={`flex items-center gap-3 cursor-pointer transition-all ${
                      currentStep === step ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-80'
                    }`}
                    onClick={() => setCurrentStep(step as 1 | 2 | 3)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-all shadow-lg ${
                      currentStep === step 
                        ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-primary/50 ring-4 ring-primary/30' 
                        : currentStep > step
                        ? 'bg-gradient-to-br from-primary/60 to-accent/60 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {currentStep > step ? <Check className="w-5 h-5" /> : step}
                    </div>
                    <span className="text-base font-semibold hidden sm:block">
                      {step === 1 ? 'Add Tags' : step === 2 ? 'Adjust Dials' : 'Pick Space'}
                    </span>
                  </div>
                  {step < 3 && <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6">
            {/* Step 1: Hashtags & Location */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Add Hashtags
                    </Label>
                    <Badge variant="outline" className="text-base px-3 py-1 bg-primary/10 border-primary/30">
                      {hashtags.length} tags
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 min-h-[80px] p-4 rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
                    {hashtags.length === 0 ? (
                      <p className="text-base text-muted-foreground italic">Add hashtags to help find this later...</p>
                    ) : (
                      hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-2 pl-3 pr-2 text-base py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:scale-105 transition-transform">
                          #{tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 p-0 hover:bg-destructive/30 rounded-full"
                            onClick={() => handleRemoveHashtag(tag)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Type a hashtag (e.g., vacation, food, music)..."
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                      className="flex-1 h-12 text-base border-2 border-primary/30 focus-visible:ring-primary/50"
                    />
                    <Button onClick={handleAddHashtag} size="lg" className="h-12 px-6 text-base" disabled={!newHashtag.trim()}>
                      <Plus className="w-5 h-5 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Location Capture */}
                <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-primary" />
                    <Label className="text-xl font-bold">Location (Optional)</Label>
                  </div>
                  {loadingLocation ? (
                    <p className="text-base text-muted-foreground">📍 Capturing location...</p>
                  ) : location ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-background/50 border-2 border-primary/20">
                        <p className="text-base font-mono font-semibold">
                          📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </p>
                        {location.address && (
                          <p className="text-sm text-muted-foreground mt-2">{location.address}</p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="w-full h-11 text-base"
                        onClick={() => setLocation(null)}
                      >
                        Clear Location
                      </Button>
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground">📍 Location not available</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Action Bar - Fixed */}
          <div className="flex-none p-6 pt-4 border-t border-primary/20 bg-gradient-to-t from-background/50 to-transparent">
            {currentStep === 1 && (
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!canProceedToStep2}
                size="lg"
                className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              >
                Next: Adjust Dials
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                {/* Active Dials - Grouped by Category */}
                <div className="space-y-5 flex-1">
                  {Object.entries(dialsByCategory).map(([category, dials]) => (
                    <div key={category} className="space-y-4">
                      <Label className="text-xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {category}
                        <Badge variant="outline" className="text-sm px-2.5 py-1 bg-primary/10 border-primary/30">{dials.length}</Badge>
                      </Label>
                      <div className="space-y-4">
                        {dials.map((dial) => (
                          <motion.div
                            key={dial.key}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 hover:shadow-lg hover:shadow-primary/20 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Label className="text-lg font-bold">{dial.label}</Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/30 rounded-full"
                                onClick={() => handleCloseDial(dial.key)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {dial.type === 'slider' ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground font-medium">Adjust Level</span>
                                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    {dialValues[dial.key] || dial.value}/10
                                  </span>
                                </div>
                                <Slider
                                  value={[dialValues[dial.key] || dial.value]}
                                  onValueChange={([value]) => handleDialChange(dial.key, value)}
                                  max={10}
                                  step={1}
                                  className="py-3"
                                />
                              </div>
                            ) : dial.options ? (
                              (() => {
                                const dialDef = getDialTaxonomy(fileType, '').find(d => d.key === dial.key);
                                return dialDef?.multiSelect ? (
                                  <MultiSelectDial
                                    label={dial.label}
                                    options={dial.options}
                                    value={Array.isArray(dialValues[dial.key]) ? dialValues[dial.key] : (dialValues[dial.key] ? [dialValues[dial.key]] : [])}
                                    onChange={(values) => handleDialChange(dial.key, values)}
                                    placeholder={`Select ${dial.label.toLowerCase()}...`}
                                  />
                                ) : (
                                  <Select
                                    value={dialValues[dial.key] || dial.value}
                                    onValueChange={(value) => handleDialChange(dial.key, value)}
                                  >
                                    <SelectTrigger className="bg-background h-12 text-base border-2 border-primary/30">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dial.options.map((option) => (
                                        <SelectItem key={option} value={option} className="text-base">
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              })()
                            ) : null}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Dials */}
                {availableDials.length > 0 && (
                  <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-dashed border-primary/40">
                    <Label className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI Suggested Dials
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {availableDials.map((dial) => (
                        <Badge
                          key={dial.key}
                          variant="outline"
                          className="cursor-pointer hover:scale-110 hover:bg-gradient-to-r hover:from-primary hover:to-accent hover:text-primary-foreground transition-all gap-2 px-4 py-2 text-base border-2 border-primary/30"
                          onClick={() => handleAddDial(dial)}
                        >
                          <Plus className="w-4 h-4" />
                          {dial.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Dials Section */}
                <div className="space-y-4 p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                  <Label className="text-xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    <Plus className="w-5 h-5 text-primary" />
                    Custom Dials
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add your own tags in any language to describe this content
                  </p>
                  <CustomDialInput
                    contentType={contentType}
                    fileId=""
                    selectedDials={customDials}
                    onDialsChange={handleCustomDialsChange}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
                size="lg"
                className="w-full h-14 text-lg font-bold mb-3"
              >
                Back to Tags
              </Button>
            )}

            {currentStep === 2 && (
              <Button 
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                size="lg"
                className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              >
                Next: Pick Space
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="space-y-5 flex-1">
                  <div className="flex items-center gap-3">
                    <FolderTree className="w-6 h-6 text-primary" />
                    <Label className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Pick a Space
                    </Label>
                  </div>
                
                  {/* Breadcrumb Navigation */}
                  {currentParentId !== null && buildBreadcrumbs(currentParentId).length > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-base">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCurrentParentId(null)}
                        className="h-11 px-4 border-2 border-primary/30"
                      >
                        Lobby
                      </Button>
                      {buildBreadcrumbs(currentParentId).map((crumb, index) => (
                        <React.Fragment key={crumb.id}>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setCurrentParentId(crumb.id)}
                            className="h-11 px-4 border-2 border-primary/30"
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
                      thumb: s.cover_url ? `${s.cover_url}${s.cover_url.includes('?') ? '&' : '?'}cb=${s.updated_at ? new Date(s.updated_at).getTime() : Date.now()}` : '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
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
                    <div className="p-5 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/40">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Your item will be placed in:</p>
                      <div className="flex items-center gap-3 text-lg font-bold">
                        <FolderTree className="w-6 h-6 text-primary" />
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {availableSpaces.find(s => s.id === selectedSpaceId)?.name || 'Lobby'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(2)}
                size="lg"
                className="w-full h-14 text-lg font-bold mb-3"
              >
                Back to Dials
              </Button>
            )}

            {currentStep === 3 && (
              <Button 
                onClick={handleSave} 
                disabled={!selectedSpaceId}
                size="lg"
                className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform shadow-lg shadow-primary/30"
              >
                <Check className="w-6 h-6" />
                Save & Place Item
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }