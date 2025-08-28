import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Plus } from '../icons';
import { Floor } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';

interface FloorsBarProps {
  floors: Floor[];
  onCreateFloor: () => void;
}

export function FloorsBar({ floors, onCreateFloor }: FloorsBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-3 px-4 overflow-x-auto scrollbar-thin pb-2">
        {floors.map((floor, index) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            <div className="flex flex-col items-center space-y-2 cursor-pointer group">
              <div className="w-16 h-10 rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform">
                <ImageFallback 
                  src={floor.thumb} 
                  alt={floor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-medium text-center">{floor.name}</span>
            </div>
          </motion.div>
        ))}
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: floors.length * 0.05 }}
          className="flex-shrink-0"
        >
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center space-y-1 w-16 h-16 glass-card border-dashed border-white/30 hover:bg-white/10"
            onClick={onCreateFloor}
          >
            <Plus size={16} />
            <span className="text-xs">New</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}