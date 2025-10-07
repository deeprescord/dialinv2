import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

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
  onCreateSpace
}: MetadataAdjustmentPanelProps) {
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);
  const [newHashtag, setNewHashtag] = useState('');
  const [dialValues, setDialValues] = useState<Record<string, any>>(initialDialValues);
  const [activeDials, setActiveDials] = useState<DialSuggestion[]>([]);
  const [availableDials, setAvailableDials] = useState<DialSuggestion[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    suggestedSpaces[0] || availableSpaces[0]?.id || 'lobby'
  );
  const [currentParentSpace, setCurrentParentSpace] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

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
    onSave({
      hashtags,
      dialValues,
      selectedSpaceId,
      location: location || undefined
    });
  };

  const getDialOptions = (dial: DialSuggestion) => {
    if (dial.key === 'mood') return moodOptions;
    if (dial.key === 'vibe') return vibeOptions;
    return dial.options || [];
  };

  // Get main spaces (no parent) and child spaces based on selection
  const mainSpaces = availableSpaces.filter(s => !s.parent_id);
  const childSpaces = currentParentSpace 
    ? availableSpaces.filter(s => s.parent_id === currentParentSpace)
    : [];

  const handleSelectMainSpace = (spaceId: string) => {
    setCurrentParentSpace(spaceId);
    setSelectedSpaceId(spaceId);
  };

  const handleSelectChildSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
  };

  const handleCreateChildSpace = async () => {
    if (!newSpaceName.trim() || !onCreateSpace) return;
    
    const parentId = currentParentSpace || 'lobby';
    await onCreateSpace(newSpaceName.trim(), parentId);
    setNewSpaceName('');
    toast.success('Space created');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 border-primary/20">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">AI Analysis Results</h2>
                {isAiGenerated && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{fileName}</p>
              {confidence > 0 && (
                <p className="text-xs text-muted-foreground">
                  Confidence: {(confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Hashtags Section */}
          <div className="space-y-3">
            <Label>Hashtags</Label>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 pl-2 pr-1">
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
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add hashtag..."
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
              />
              <Button onClick={handleAddHashtag} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
          )}

          {/* Active Dials */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Active Dials</Label>
              <span className="text-xs text-muted-foreground">{activeDials.length} active</span>
            </div>
            
            <AnimatePresence mode="popLayout">
              {activeDials.map((dial) => (
                <motion.div
                  key={dial.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2 p-3 rounded-lg border border-primary/20 bg-background/50"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{dial.label}</Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCloseDial(dial.key)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {dial.type === 'slider' ? (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Value</span>
                        <span className="font-mono">{dialValues[dial.key] || dial.value}/10</span>
                      </div>
                      <Slider
                        value={[dialValues[dial.key] || dial.value]}
                        onValueChange={([value]) => handleDialChange(dial.key, value)}
                        max={10}
                        step={1}
                      />
                    </>
                  ) : (
                    <Select
                      value={dialValues[dial.key] || dial.value}
                      onValueChange={(value) => handleDialChange(dial.key, value)}
                    >
                      <SelectTrigger>
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
            </AnimatePresence>
          </div>

          {/* Suggested Dials */}
          {availableDials.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Suggested Dials</Label>
              <div className="flex flex-wrap gap-2">
                {availableDials.slice(0, 3).map((dial) => (
                  <div key={dial.key} className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors gap-1"
                      onClick={() => handleAddDial(dial)}
                    >
                      <Plus className="w-3 h-3" />
                      {dial.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveSuggestedDial(dial.key)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Space Selection */}
          <div className="space-y-3">
            <Label>Place in Space</Label>
            {suggestedSpaces.length > 0 && (
              <p className="text-xs text-muted-foreground">
                AI suggests: {suggestedSpaces.join(', ')}
              </p>
            )}
            
            {/* Main Spaces */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Main Spaces:</p>
              <div className="space-y-2">
                {mainSpaces.map((space) => (
                  <div
                    key={space.id}
                    onClick={() => handleSelectMainSpace(space.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentParentSpace === space.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="text-sm font-medium">{space.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Child Spaces - shown when a main space is selected */}
            {currentParentSpace && childSpaces.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Spaces within {mainSpaces.find(s => s.id === currentParentSpace)?.name}:
                </p>
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  {childSpaces.map((space) => (
                    <div
                      key={space.id}
                      onClick={() => handleSelectChildSpace(space.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedSpaceId === space.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="text-sm">{space.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create new space */}
            {onCreateSpace && (
              <div className="flex gap-2">
                <Input
                  placeholder={currentParentSpace ? "New sub-space name..." : "New main space name..."}
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChildSpace()}
                />
                <Button onClick={handleCreateChildSpace} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Check className="w-4 h-4" />
              Save & Place
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}