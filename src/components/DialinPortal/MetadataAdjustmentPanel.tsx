import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface MetadataAdjustmentPanelProps {
  fileName: string;
  fileType: string;
  initialHashtags?: string[];
  initialDialValues?: Record<string, any>;
  suggestedSpaces?: string[];
  availableSpaces: Array<{ id: string; name: string }>;
  confidence?: number;
  isAiGenerated?: boolean;
  onSave: (metadata: {
    hashtags: string[];
    dialValues: Record<string, any>;
    selectedSpaceId: string;
  }) => void;
  onCancel: () => void;
}

export function MetadataAdjustmentPanel({
  fileName,
  fileType,
  initialHashtags = [],
  initialDialValues = {},
  suggestedSpaces = [],
  availableSpaces,
  confidence = 0,
  isAiGenerated = true,
  onSave,
  onCancel
}: MetadataAdjustmentPanelProps) {
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);
  const [newHashtag, setNewHashtag] = useState('');
  const [dialValues, setDialValues] = useState<Record<string, any>>(initialDialValues);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    suggestedSpaces[0] || availableSpaces[0]?.id || 'lobby'
  );

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

  const handleSave = () => {
    onSave({
      hashtags,
      dialValues,
      selectedSpaceId
    });
  };

  const moodOptions = ['happy', 'sad', 'calm', 'excited', 'angry', 'peaceful', 'neutral'];
  const vibeOptions = ['chill', 'energetic', 'dark', 'uplifting', 'contemplative', 'futuristic', 'neutral'];

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

          {/* Dial Values Section */}
          <div className="space-y-4">
            <Label>Dial Values</Label>
            
            {/* Energy */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Energy</span>
                <span className="text-sm font-mono">{dialValues.energy || 5}/10</span>
              </div>
              <Slider
                value={[dialValues.energy || 5]}
                onValueChange={([value]) => handleDialChange('energy', value)}
                max={10}
                step={1}
              />
            </div>

            {/* Mood */}
            <div className="space-y-2">
              <Label className="text-sm">Mood</Label>
              <Select
                value={dialValues.mood || 'neutral'}
                onValueChange={(value) => handleDialChange('mood', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((mood) => (
                    <SelectItem key={mood} value={mood}>
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vibe */}
            <div className="space-y-2">
              <Label className="text-sm">Vibe</Label>
              <Select
                value={dialValues.vibe || 'neutral'}
                onValueChange={(value) => handleDialChange('vibe', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vibeOptions.map((vibe) => (
                    <SelectItem key={vibe} value={vibe}>
                      {vibe}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Complexity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Complexity</span>
                <span className="text-sm font-mono">{dialValues.complexity || 5}/10</span>
              </div>
              <Slider
                value={[dialValues.complexity || 5]}
                onValueChange={([value]) => handleDialChange('complexity', value)}
                max={10}
                step={1}
              />
            </div>

            {/* Professionalism */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Professionalism</span>
                <span className="text-sm font-mono">{dialValues.professionalism || 5}/10</span>
              </div>
              <Slider
                value={[dialValues.professionalism || 5]}
                onValueChange={([value]) => handleDialChange('professionalism', value)}
                max={10}
                step={1}
              />
            </div>
          </div>

          {/* Space Selection */}
          <div className="space-y-2">
            <Label>Place in Space</Label>
            {suggestedSpaces.length > 0 && (
              <p className="text-xs text-muted-foreground">
                AI suggests: {suggestedSpaces.join(', ')}
              </p>
            )}
            <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSpaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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