import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';

const floors = [
  { id: 1, label: 'Ground Floor', active: false },
  { id: 2, label: 'Mezzanine', active: true },
  { id: 3, label: 'Upper Level', active: false },
  { id: 4, label: 'Rooftop', active: false },
];

export function FloorsTab() {
  const [selectedFloor, setSelectedFloor] = React.useState(2);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-md border-t border-white/10 safe-area-pb"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-white">Floors</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              disabled={selectedFloor >= floors.length}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
              disabled={selectedFloor <= 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {floors.map((floor) => (
            <Button
              key={floor.id}
              variant={selectedFloor === floor.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFloor(floor.id)}
              className={`
                flex-shrink-0 h-8 px-3 text-xs font-medium transition-all duration-200
                ${selectedFloor === floor.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {floor.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}