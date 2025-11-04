import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Users, Video, Music, MapPin, Home as HomeIcon, Settings } from '../icons';
import { ArrowUpDown, Film } from 'lucide-react';
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
  show360?: boolean;
  onOpen360Settings?: () => void;
  userPoints?: number;
  onOpenAddPanel?: () => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: 'home', Icon: HomeIcon },
  { id: 'friends', label: 'Friends', icon: 'users', Icon: Users },
  { id: 'videos', label: 'Videos', icon: 'video', Icon: Video },
  { id: 'music', label: 'Music', icon: 'music', Icon: Music },
  { id: 'locations', label: 'Locations', icon: 'mapPin', Icon: MapPin },
];

const filterTabs = ['videos', 'music', 'locations'];

export function TopNav({ currentTab, onTabChange, selectedChipsCount, dialCount, show360, onOpen360Settings, userPoints = 0, onOpenAddPanel }: TopNavProps) {
  const [showMobileTabs, setShowMobileTabs] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

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

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onOpenAddPanel?.();
    }, 800);
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
    <motion.div 
      className="fixed top-4 left-4 right-4 z-50"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Navigation */}
      <nav 
        className="px-3 sm:px-6 py-3 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-8 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <img 
              src="/brand/dialin-logo-white.png" 
              alt="Dialin" 
              className="h-6 sm:h-8 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = logoFallback;
              }}
            />
            
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
            {/* Custom Order Icon */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowUpDown size={18} className="text-white" />
            </Button>
            
            {/* Movie Mode Icon */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Film size={18} className="text-white" />
            </Button>
            
            {/* Profile Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </nav>

    </motion.div>
  );
}
