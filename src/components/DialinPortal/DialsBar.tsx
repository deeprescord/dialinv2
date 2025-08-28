import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { DialGroup } from '@/data/constants';

interface DialsBarProps {
  dialGroups: DialGroup[];
  selectedDials: Record<string, string[]>;
  onDialToggle: (groupKey: string, option: string) => void;
  onClearAll: () => void;
}

export function DialsBar({ dialGroups, selectedDials, onDialToggle, onClearAll }: DialsBarProps) {
  const hasSelections = Object.values(selectedDials).some(arr => arr.length > 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4 px-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <AnimatePresence>
          {hasSelections && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearAll}
                className="text-xs glass-card border-white/20 hover:bg-white/10"
              >
                Clear All
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        {dialGroups.map((group) => (
          <div key={group.key} className="px-4">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">{group.label}</h3>
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
                        : 'glass-card border-white/20 hover:bg-white/10'
                    }`}
                    onClick={() => onDialToggle(group.key, option)}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}