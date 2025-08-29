import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell } from '../icons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserDropdown } from './UserDropdown';
import { formatDialCount } from '@/lib/filters';

interface TopNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedChipsCount: number;
  dialCount: number;
}

const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'videos', label: 'Videos', icon: 'video' },
  { id: 'music', label: 'Music', icon: 'music' },
  { id: 'locations', label: 'Locations', icon: 'mapPin' },
];

const filterTabs = ['videos', 'music', 'locations'];

export function TopNav({ currentTab, onTabChange, selectedChipsCount, dialCount }: TopNavProps) {
  return (
    <motion.nav 
      className="fixed top-4 left-4 right-4 z-50 glass-nav px-3 sm:px-6 py-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-8">
          <img 
            src="/brand/dialin-logo-white.png" 
            alt="Dialin" 
            className="h-6 sm:h-8 w-auto"
          />
          
          {/* Desktop Tabs */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={currentTab === tab.id ? 'default' : 'ghost'}
                className={`relative px-3 xl:px-4 py-2 rounded-full transition-all duration-200 text-sm ${
                  currentTab === tab.id 
                    ? 'bg-dialin-purple text-white shadow-lg shadow-dialin-purple/25' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
                {filterTabs.includes(tab.id) && selectedChipsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-dialin-gold text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {selectedChipsCount}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Search - Hidden on small screens */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search..." 
              className="pl-10 bg-white/5 border-white/10 rounded-full w-48 xl:w-64 focus:bg-white/10"
            />
          </div>

          {/* Selected Chips Count (Desktop) */}
          {filterTabs.includes(currentTab) && selectedChipsCount > 0 && (
            <div className="hidden lg:flex items-center px-3 py-1 bg-dialin-gold/20 text-dialin-gold rounded-full text-sm">
              {selectedChipsCount} filters
            </div>
          )}

          {/* $DIAL Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-2 sm:px-3 py-1 bg-dialin-gold/20 text-dialin-gold rounded-full text-xs sm:text-sm">
            <span className="font-bold">{formatDialCount(dialCount)} $DIAL</span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2 rounded-full">
            <Bell size={18} className="sm:w-5 sm:h-5" />
          </Button>

          {/* Profile Dropdown */}
          <UserDropdown />
        </div>
      </div>
    </motion.nav>
  );
}
