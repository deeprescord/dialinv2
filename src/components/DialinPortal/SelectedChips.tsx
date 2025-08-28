import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close } from '../icons';

interface SelectedChipsProps {
  selectedDials: Record<string, string[]>;
  onRemoveChip: (groupKey: string, option: string) => void;
}

export function SelectedChips({ selectedDials, onRemoveChip }: SelectedChipsProps) {
  const chips = Object.entries(selectedDials).flatMap(([groupKey, options]) =>
    options.map(option => ({ groupKey, option }))
  );

  if (chips.length === 0) return null;

  return (
    <motion.div 
      className="flex flex-wrap gap-2 px-4 mb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <AnimatePresence mode="popLayout">
        {chips.map(({ groupKey, option }) => (
          <motion.div
            key={`${groupKey}-${option}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            layout
          >
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-3 text-xs bg-dialin-purple/20 text-dialin-purple border border-dialin-purple/30 hover:bg-dialin-purple/30"
              onClick={() => onRemoveChip(groupKey, option)}
            >
              {option}
              <Close size={12} className="ml-2" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}