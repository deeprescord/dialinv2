import React from 'react';
import { motion } from 'framer-motion';
import { Users, Video, Music, MapPin, Home as HomeIcon } from '../icons';

interface MobileTabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedChipsCount: number;
}

const tabs = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'friends', label: 'Friends', Icon: Users },
  { id: 'videos', label: 'Videos', Icon: Video },
  { id: 'music', label: 'Music', Icon: Music },
  { id: 'locations', label: 'Locations', Icon: MapPin },
];

const filterTabs = ['videos', 'music', 'locations'];

export function MobileTabBar({ currentTab, onTabChange, selectedChipsCount }: MobileTabBarProps) {
  return (
    <motion.div 
      className="lg:hidden fixed top-20 left-4 right-4 z-40 glass-nav p-2"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const { Icon } = tab;
          return (
            <button
              key={tab.id}
              className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                currentTab === tab.id 
                  ? 'bg-dialin-purple text-white' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              
              {filterTabs.includes(tab.id) && selectedChipsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-dialin-gold text-black text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {selectedChipsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}