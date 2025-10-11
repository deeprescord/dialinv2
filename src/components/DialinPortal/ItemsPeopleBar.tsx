import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageFallback } from '../ui/image-fallback';

interface ItemsPeopleBarProps {
  scale?: number; // Inherit scale from SpacesBar if needed
}

export function ItemsPeopleBar({ scale = 100 }: ItemsPeopleBarProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'people'>('items');

  // Scale-responsive sizing
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const thumbWidth = getScaled(180);
  const thumbHeight = getScaled(100);
  const spacing = getScaled(12);
  const padding = getScaled(16);

  // Demo items
  const demoItems = [
    { id: '1', name: 'Item 1', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
    { id: '2', name: 'Item 2', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
    { id: '3', name: 'Item 3', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
    { id: '4', name: 'Item 4', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
    { id: '5', name: 'Item 5', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
    { id: '6', name: 'Item 6', thumb: '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png' },
  ];

  return (
    <div className="mb-4 relative">
      <div className="absolute inset-0 bg-background/30 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg"></div>
      <div className="relative" style={{ padding: `${padding}px` }}>
        {/* Tab Headers */}
        <div className="flex items-center gap-2 mb-4 ml-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`text-lg font-semibold transition-colors ${
              activeTab === 'items' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            Items
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={() => setActiveTab('people')}
            className={`text-lg font-semibold transition-colors ${
              activeTab === 'people' ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            People
          </button>
        </div>

        {/* Scrollable Items List */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-center" style={{ gap: `${spacing}px` }}>
            {demoItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-shrink-0"
              >
                <div className="cursor-pointer group">
                  <div
                    className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 bg-muted/50"
                    style={{ width: `${thumbWidth}px`, height: `${thumbHeight}px` }}
                  >
                    {/* Placeholder for now - will be replaced with actual content */}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
