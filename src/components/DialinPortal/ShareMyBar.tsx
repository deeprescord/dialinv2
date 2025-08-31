import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Check, Smartphone, Building, Phone, Mail, Home } from 'lucide-react';
import { SHARE_TOGGLES } from '@/data/constants';

interface ShareMyBarProps {
  activeToggles: string[];
  onToggleChange: (toggleKey: string) => void;
}

export function ShareMyBar({ activeToggles, onToggleChange }: ShareMyBarProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return Smartphone;
      case 'Building': return Building;
      case 'Phone': return Phone;
      case 'Mail': return Mail;
      case 'Home': return Home;
      default: return Smartphone;
    }
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 glass-nav px-4 py-3 border-t border-white/10"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-2">
        <h3 className="text-xs font-semibold text-white/90">SHARE MY</h3>
        <p className="text-xs text-white/60">Toggle what you share with this contact</p>
      </div>
      
      <div className="flex justify-between gap-2 overflow-x-auto scrollbar-thin">
        {SHARE_TOGGLES.map((toggle) => {
          const isActive = activeToggles.includes(toggle.key);
          const IconComponent = getIcon(toggle.icon);
          
          return (
            <motion.div
              key={toggle.key}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 flex flex-col items-center"
            >
              <Button
                variant="ghost"
                className={`relative w-12 h-12 p-0 rounded-xl border transition-all duration-200 hover:scale-105 ${
                  isActive 
                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
                onClick={() => onToggleChange(toggle.key)}
              >
                <IconComponent size={18} />
                {isActive && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </Button>
              <p className="text-xs text-center mt-1 text-white/60 max-w-16 line-clamp-2 leading-tight">
                {toggle.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}