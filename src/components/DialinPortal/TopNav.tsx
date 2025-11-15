import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Search, Bell, Users, Video, Music, MapPin, Home as HomeIcon, Settings } from '../icons';
import { ArrowUpDown, Film, ScanEye, Network } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { UserDropdown } from './UserDropdown';
import { SortDropdown } from './SortDropdown';
import { ShareSpaceButton } from './ShareSpaceButton';
import { formatDialCount } from '@/lib/filters';
import logoFallback from '@/assets/logo-fallback.jpg';
import type { SortOrder } from '@/types/organization';

interface TopNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedChipsCount: number;
  dialCount: number;
  show360?: boolean;
  onOpen360Settings?: () => void;
  userPoints?: number;
  onOpenAddPanel?: () => void;
  sortOrder?: SortOrder;
  onSortChange?: (sort: SortOrder) => void;
  movieMode?: boolean;
  onMovieModeToggle?: () => void;
  spaceId?: string;
  isPublic?: boolean;
  shareSlug?: string | null;
  onToggleDOSPanel?: () => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: 'home', Icon: HomeIcon },
  { id: 'friends', label: 'Friends', icon: 'users', Icon: Users },
  { id: 'videos', label: 'Videos', icon: 'video', Icon: Video },
  { id: 'music', label: 'Music', icon: 'music', Icon: Music },
  { id: 'locations', label: 'Locations', icon: 'mapPin', Icon: MapPin },
];

const filterTabs = ['videos', 'music', 'locations'];

export function TopNav({ currentTab, onTabChange, selectedChipsCount, dialCount, show360, onOpen360Settings, userPoints = 0, onOpenAddPanel, sortOrder = 'custom', onSortChange, movieMode = false, onMovieModeToggle, spaceId, isPublic, shareSlug, onToggleDOSPanel }: TopNavProps) {
  const navigate = useNavigate();
  const [showMobileTabs, setShowMobileTabs] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Only animate once on mount
  useEffect(() => {
    setHasAnimated(true);
  }, []);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsSignedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSignedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      initial={hasAnimated ? false : { y: -100, opacity: 0 }}
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
          <div 
            className="flex items-center space-x-2 sm:space-x-8 bg-black/60 rounded-lg px-3 py-2 cursor-pointer hover:bg-black/70 transition-colors"
            onClick={() => navigate(isSignedIn ? '/' : '/default')}
          >
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
          <div className="flex items-center space-x-2 sm:space-x-4 bg-black/60 rounded-lg px-2 py-1">
            {/* Sort Dropdown */}
            {onSortChange && (
              <SortDropdown currentSort={sortOrder} onSortChange={onSortChange} />
            )}
            
            {/* Movie Mode Toggle */}
            {onMovieModeToggle && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onMovieModeToggle}
              >
                <Film size={18} className={movieMode ? "text-primary" : "text-white"} />
              </Button>
            )}
            
            {/* DOS Panel Toggle */}
            {onToggleDOSPanel && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onToggleDOSPanel}
                title="DOS Panel"
              >
                <Network size={18} className="text-orange-400" />
              </Button>
            )}
            
            {/* 360 Settings */}
            {show360 && onOpen360Settings && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={onOpen360Settings}
              >
                <ScanEye size={18} className="text-white" />
              </Button>
            )}
            
            {/* Share Button */}
            {spaceId && spaceId !== 'lobby' && (
              <ShareSpaceButton 
                spaceId={spaceId} 
                isPublic={isPublic} 
                shareSlug={shareSlug}
              />
            )}
            
            {/* Profile Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </nav>

    </motion.div>
  );
}
