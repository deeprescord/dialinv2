import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, X, TrendingUp } from 'lucide-react';
import { useCustomDials } from '@/hooks/useCustomDials';

interface CustomDialInputProps {
  contentType: string;
  fileId: string;
  selectedDials: Array<{ id: string; name: string }>;
  onDialsChange: (dials: Array<{ id: string; name: string }>) => void;
}

export function CustomDialInput({ contentType, fileId, selectedDials, onDialsChange }: CustomDialInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showTrending, setShowTrending] = useState(false);
  const { customDials, createCustomDial, getTrendingDials } = useCustomDials(contentType);
  const [trendingDials, setTrendingDials] = useState<any[]>([]);

  const handleLoadTrending = async () => {
    const trending = await getTrendingDials(7, 10);
    setTrendingDials(trending);
    setShowTrending(!showTrending);
  };

  const handleAddCustomDial = async () => {
    if (!inputValue.trim()) return;

    const newDial = await createCustomDial(inputValue.trim());
    if (newDial) {
      onDialsChange([...selectedDials, { id: newDial.id, name: newDial.dial_name }]);
      setInputValue('');
    }
  };

  const handleRemoveDial = (dialId: string) => {
    onDialsChange(selectedDials.filter(d => d.id !== dialId));
  };

  const handleSelectTrending = async (dialName: string) => {
    const dial = await createCustomDial(dialName);
    if (dial && !selectedDials.find(d => d.id === dial.id)) {
      onDialsChange([...selectedDials, { id: dial.id, name: dial.dial_name }]);
    }
  };

  const suggestedDials = customDials
    .filter(d => 
      d.dial_name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedDials.find(s => s.id === d.id)
    )
    .slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground whitespace-nowrap">
          Custom Dials
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLoadTrending}
          className="h-7 text-xs"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Trending
        </Button>
      </div>

      {/* Selected custom dials */}
      {selectedDials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDials.map(dial => (
            <Badge
              key={dial.id}
              variant="secondary"
              className="bg-dialin-purple/10 text-dialin-purple border border-dialin-purple/30"
            >
              {dial.name}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveDial(dial.id)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Trending dials */}
      {showTrending && trendingDials.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Trending Dials</div>
          <div className="flex flex-wrap gap-2">
            {trendingDials.map(dial => (
              <Badge
                key={dial.dial_id}
                variant="outline"
                className="cursor-pointer hover:bg-dialin-purple/20 transition-colors"
                onClick={() => handleSelectTrending(dial.dial_name)}
              >
                {dial.dial_name}
                <TrendingUp className="ml-1 h-3 w-3 text-dialin-purple" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input for new custom dial */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDial()}
            placeholder="Add custom dial (e.g., 'lo-fi', 'cozy', 'epic')"
            className="pr-10"
          />
          
          {/* Suggestions dropdown */}
          {inputValue && suggestedDials.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10 max-h-32 overflow-auto">
              {suggestedDials.map(dial => (
                <div
                  key={dial.id}
                  className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex justify-between items-center"
                  onClick={() => {
                    onDialsChange([...selectedDials, { id: dial.id, name: dial.dial_name }]);
                    setInputValue('');
                  }}
                >
                  <span>{dial.dial_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {dial.usage_count} uses
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleAddCustomDial}
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Create custom dials in any language to categorize your content uniquely
      </p>
    </div>
  );
}
