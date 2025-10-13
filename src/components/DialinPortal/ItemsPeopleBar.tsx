import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { friends } from '@/data/catalogs';
import beachSunset from '@/assets/social-beach-sunset.jpg';
import concert from '@/assets/social-concert.jpg';
import cafe from '@/assets/social-cafe.jpg';
import hiking from '@/assets/social-hiking.jpg';
import music from '@/assets/social-music.jpg';
import city from '@/assets/social-city.jpg';

interface ItemsPeopleBarProps {
  scale?: number; // Inherit scale from SpacesBar if needed
  view: 'items' | 'people'; // Controlled by parent
}

export function ItemsPeopleBar({ scale = 30, view }: ItemsPeopleBarProps) {

  // Scale-responsive sizing (reduced by 25%)
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const cardWidth = getScaled(150);
  const cardHeight = getScaled(180);
  const spacing = getScaled(12);
  const padding = getScaled(16);

  // Demo items with social media-style content
  const demoItems = [
    { id: '1', title: 'Beach Sunset', image: beachSunset },
    { id: '2', title: 'Concert Clips', image: concert },
    { id: '3', title: 'Life Update', image: cafe },
    { id: '4', title: 'Article Share', image: hiking },
    { id: '5', title: 'Playlist', image: music },
    { id: '6', title: 'Check-in', image: city },
  ];

  return (
    <div className="mb-4 relative">
      <div className="relative" style={{ padding: `${padding}px` }}>
        {/* Scrollable Items/People List */}
        <div className="overflow-x-auto scrollbar-thin">
          <div className="flex items-center" style={{ gap: `${spacing}px` }}>
            {view === 'items' ? (
              demoItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-shrink-0"
                >
                  <div className="cursor-pointer group flex flex-col items-center gap-2">
                    <div
                      className="rounded-lg overflow-hidden group-hover:scale-105 transition-transform border border-white/10 relative"
                      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                    >
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground/80 max-w-full truncate px-2">
                      {item.title}
                    </span>
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
                  <div className="cursor-pointer group flex flex-col items-center gap-2">
                    <div
                      className="rounded-lg overflow-hidden glass-card group-hover:scale-105 transition-transform border border-white/10 bg-muted/50 flex items-center justify-center relative"
                      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                    >
                      <img 
                        src={person.avatar} 
                        alt={person.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                      {/* Status indicator - bottom right corner */}
                      <div 
                        className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white ${
                          person.status === 'online' ? 'bg-green-500' : 
                          person.status === 'away' ? 'bg-yellow-500' : 
                          'bg-gray-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs font-medium text-foreground/80 max-w-full truncate px-2">
                      {person.name}
                    </span>
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
