import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Users, Video, Music, MapPin, Home as HomeIcon } from '../icons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserDropdown } from './UserDropdown';
import { formatDialCount } from '@/lib/filters';
import logoFallback from '@/assets/logo-fallback.jpg';

interface TopNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedChipsCount: number;
  dialCount: number;
}

const tabs = [
  { id: 'home', label: 'Home', icon: 'home', Icon: HomeIcon },
  { id: 'friends', label: 'Friends', icon: 'users', Icon: Users },
  { id: 'videos', label: 'Videos', icon: 'video', Icon: Video },
  { id: 'music', label: 'Music', icon: 'music', Icon: Music },
  { id: 'locations', label: 'Locations', icon: 'mapPin', Icon: MapPin },
];

const filterTabs = ['videos', 'music', 'locations'];

export function TopNav({ currentTab, onTabChange, selectedChipsCount, dialCount }: TopNavProps) {
  const [showMobileTabs, setShowMobileTabs] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only handle scroll behavior on mobile
      if (window.innerWidth >= 1024) {
        setShowMobileTabs(true);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide mobile tabs
        setShowMobileTabs(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        // Scrolling up or at top - show mobile tabs
        setShowMobileTabs(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.div 
      className="fixed top-4 left-4 right-4 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Navigation */}
      <nav className="glass-nav px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-8">
            <img 
              src="/brand/dialin-logo-white.png" 
              alt="Dialin" 
              className="h-6 sm:h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = logoFallback;
              }}
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
      </nav>

      {/* Mobile Tabs - Attached underneath the main nav */}
      <motion.div 
        className="lg:hidden glass-nav p-2 mt-1"
        initial={{ y: -50, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: showMobileTabs ? 1 : 0,
          height: showMobileTabs ? 'auto' : 0,
          paddingTop: showMobileTabs ? 8 : 0,
          paddingBottom: showMobileTabs ? 8 : 0
        }}
        transition={{ duration: 0.3, delay: showMobileTabs ? 0.1 : 0 }}
      >
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const { Icon } = tab;
            return (
              <button
                key={tab.id}
                className={`relative flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                  currentTab === tab.id 
                    ? 'bg-dialin-purple text-white' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon size={18} />
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
    </motion.div>
  );
}
