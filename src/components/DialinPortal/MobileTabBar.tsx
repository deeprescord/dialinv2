
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
  // This component is now integrated into TopNav for mobile, so we hide it
  return null;
}
