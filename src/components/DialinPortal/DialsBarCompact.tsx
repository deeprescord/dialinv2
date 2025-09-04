import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { ChevronDown, X, Settings } from 'lucide-react';
import { DialGroup } from '@/data/constants';

interface DialsBarCompactProps {
  dialGroups: DialGroup[];
  selectedDials: Record<string, string[]>;
  onDialToggle: (groupKey: string, option: string) => void;
  onClearAll: () => void;
}

export function DialsBarCompact({ dialGroups, selectedDials, onDialToggle, onClearAll }: DialsBarCompactProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number[]>([50]);
  const [popularityLevel, setPopularityLevel] = useState<number[]>([75]);
  
  const hasSelections = Object.values(selectedDials).some(arr => arr.length > 0);
  const totalSelected = Object.values(selectedDials).reduce((acc, arr) => acc + arr.length, 0);

  const renderDialContent = (group: DialGroup) => {
    // Special handling for energy and popularity dials with sliders
    if (group.key === 'energy' || group.key === 'popularity') {
      const currentLevel = group.key === 'energy' ? energyLevel : popularityLevel;
      const setLevel = group.key === 'energy' ? setEnergyLevel : setPopularityLevel;
      
      return (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">{group.label} Level</label>
            <Slider
              value={currentLevel}
              onValueChange={setLevel}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>Low</span>
              <span>{currentLevel[0]}%</span>
              <span>High</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isSelected = selectedDials[group.key]?.includes(option) || false;
                return (
                  <Button
                    key={option}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs transition-all duration-200 ${
                      isSelected 
                        ? 'bg-dialin-purple text-white shadow-lg shadow-dialin-purple/25' 
                        : 'glass-card border-white/20 hover:bg-white/10 text-white'
                    }`}
                    onClick={() => onDialToggle(group.key, option)}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Regular toggle options
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {group.options.map((option) => {
            const isSelected = selectedDials[group.key]?.includes(option) || false;
            return (
              <Button
                key={option}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={`text-xs transition-all duration-200 justify-start ${
                  isSelected 
                    ? 'bg-dialin-purple text-white shadow-lg shadow-dialin-purple/25' 
                    : 'glass-card border-white/20 hover:bg-white/10 text-white'
                }`}
                onClick={() => onDialToggle(group.key, option)}
              >
                {option}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 mx-4">
      <div className="glass-card backdrop-blur-lg bg-black/40 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-white/60" />
            <h2 className="text-sm font-semibold text-white">Dials</h2>
            {totalSelected > 0 && (
              <Badge variant="secondary" className="bg-dialin-purple/20 text-dialin-purple text-xs">
                {totalSelected}
              </Badge>
            )}
          </div>
          <AnimatePresence>
            {hasSelections && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="text-xs text-white/60 hover:text-white hover:bg-white/10 h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-2">
          {dialGroups.map((group) => (
            <Popover 
              key={group.key}
              open={openDropdown === group.key}
              onOpenChange={(open) => setOpenDropdown(open ? group.key : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`glass-card border-white/20 hover:bg-white/10 text-white text-xs h-8 ${
                    selectedDials[group.key]?.length ? 'border-dialin-purple/50 bg-dialin-purple/10' : ''
                  }`}
                >
                  {group.label}
                  {selectedDials[group.key]?.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-dialin-purple text-white">
                      {selectedDials[group.key].length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 glass-card backdrop-blur-xl bg-black/80 border border-white/20"
                align="start"
              >
                <div className="bg-black/60 backdrop-blur-sm border-b border-white/10 px-4 py-2">
                  <h3 className="font-medium text-white text-sm">{group.label}</h3>
                </div>
                {renderDialContent(group)}
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>
    </div>
  );
}