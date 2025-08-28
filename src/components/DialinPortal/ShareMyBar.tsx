import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Check } from '../icons';
import { SHARE_TOGGLES } from '@/data/constants';
import * as Icons from '../icons';

interface ShareMyBarProps {
  activeToggles: string[];
  onToggleChange: (toggleKey: string) => void;
}

export function ShareMyBar({ activeToggles, onToggleChange }: ShareMyBarProps) {
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 glass-nav p-4 border-t border-white/10"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Share My</h3>
        <p className="text-xs text-muted-foreground">Toggle what you share with this contact</p>
      </div>
      
      <div className="flex space-x-3 overflow-x-auto scrollbar-thin pb-2">
        {SHARE_TOGGLES.map((toggle) => {
          const isActive = activeToggles.includes(toggle.key);
          const IconComponent = Icons[toggle.icon as keyof typeof Icons] as React.ComponentType<any>;
          
          return (
            <motion.div
              key={toggle.key}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <Button
                variant="outline"
                className={`relative w-16 h-16 p-0 border-none ${toggle.color} transition-all duration-200 hover:scale-105`}
                onClick={() => onToggleChange(toggle.key)}
              >
                <div className="flex flex-col items-center justify-center text-white">
                  <IconComponent size={20} />
                </div>
                {isActive && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </Button>
              <p className="text-xs text-center mt-1 max-w-16 line-clamp-2">{toggle.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}