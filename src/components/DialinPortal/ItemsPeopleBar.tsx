import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageFallback } from '../ui/image-fallback';
import { friends } from '@/data/catalogs';
import { Image, Video, FileText, Link, Music, MapPin } from 'lucide-react';

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

  // Demo items with social media-style content
  const demoItems = [
    { id: '1', type: 'photo', title: 'Beach Sunset', color: 'from-orange-500 to-pink-500', icon: Image },
    { id: '2', type: 'video', title: 'Concert Clips', color: 'from-purple-500 to-blue-500', icon: Video },
    { id: '3', type: 'text', title: 'Life Update', color: 'from-green-500 to-teal-500', icon: FileText },
    { id: '4', type: 'link', title: 'Article Share', color: 'from-blue-500 to-cyan-500', icon: Link },
    { id: '5', type: 'music', title: 'Playlist', color: 'from-pink-500 to-purple-500', icon: Music },
    { id: '6', type: 'location', title: 'Check-in', color: 'from-yellow-500 to-orange-500', icon: MapPin },
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
              demoItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <div className="cursor-pointer group">
                      <div
                        className={`rounded-2xl overflow-hidden group-hover:scale-105 transition-transform border border-white/10 bg-gradient-to-br ${item.color} flex flex-col items-center justify-center gap-3 p-6`}
                        style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
                      >
                        <IconComponent className="text-white" size={64} strokeWidth={1.5} />
                        <span className="text-sm font-medium text-white">{item.title}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
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
                          className="w-32 h-32 rounded-xl object-cover border-2 border-white/20"
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
