import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageFallback } from '../ui/image-fallback';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { friends } from '@/data/catalogs';

interface ItemsPeopleBarProps {
  scale?: number; // Inherit scale from SpacesBar if needed
}

export function ItemsPeopleBar({ scale = 40 }: ItemsPeopleBarProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'people'>('items');

  // Scale-responsive sizing
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const cardWidth = getScaled(200);
  const cardHeight = getScaled(240);
  const spacing = getScaled(16);
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

        {/* Scrollable Items/People List */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-center" style={{ gap: `${spacing}px` }}>
            {activeTab === 'items' ? (
              demoItems.map((item, index) => (
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
                      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                    >
                      {/* Placeholder for now - will be replaced with actual content */}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              friends.map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-shrink-0"
                >
                  <div className="cursor-pointer group">
                    <div
                      className="rounded-2xl overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 bg-muted/50 flex flex-col items-center justify-center gap-3 p-4 relative"
                      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                    >
                      <div className="relative">
                        <img 
                          src={person.avatar} 
                          alt={person.name}
                          className="w-32 h-32 rounded-xl object-cover"
                        />
                        {/* Status indicator */}
                        <div 
                          className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-background ${
                            person.status === 'online' ? 'bg-green-500' : 
                            person.status === 'away' ? 'bg-yellow-500' : 
                            'bg-gray-500'
                          }`}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate max-w-full">
                        {person.name}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
