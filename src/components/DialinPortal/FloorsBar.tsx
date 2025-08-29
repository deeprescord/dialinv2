import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Plus } from '../icons';
import { Floor } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { FloorContextMenu } from './FloorContextMenu';

interface FloorsBarProps {
  floors: Floor[];
  onCreateFloor: () => void;
  onDeleteFloor: (floorId: string) => void;
  onRenameFloor: (floorId: string, newName: string) => void;
  onReorderFloor: (floorId: string, direction: 'up' | 'down') => void;
}

export function FloorsBar({ floors, onCreateFloor, onDeleteFloor, onRenameFloor, onReorderFloor }: FloorsBarProps) {
  const [contextMenu, setContextMenu] = useState<{
    floor: Floor;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = (floor: Floor, event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      setContextMenu({
        floor,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500); // 500ms press and hold
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg border border-white/10"></div>
      <div className="relative flex items-center space-x-3 px-4 py-3 overflow-x-auto scrollbar-thin">
        {floors.map((floor, index) => (
          <motion.div
            key={floor.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex-shrink-0"
          >
            <div 
              className="flex flex-col items-center space-y-2 cursor-pointer group select-none"
              onMouseDown={(e) => handleMouseDown(floor, e)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleMouseDown(floor, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent);
              }}
              onTouchEnd={handleMouseUp}
            >
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

      {/* Context Menu */}
      {contextMenu && (
        <FloorContextMenu
          floor={contextMenu.floor}
          isOpen={true}
          onClose={() => setContextMenu(null)}
          onDelete={onDeleteFloor}
          onRename={onRenameFloor}
          onReorder={onReorderFloor}
          position={contextMenu.position}
        />
      )}
    </div>
  );
}