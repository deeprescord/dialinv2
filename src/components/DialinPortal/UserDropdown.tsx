
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ImageFallback } from '../ui/image-fallback';
import { Settings, HardDrive, Database, Wallet, ChevronDown } from '../icons';
import { useProfile } from '@/hooks/useProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

export function UserDropdown() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 p-2">
          <Avatar className="h-8 w-8">
            {profile?.profile_media_url ? (
              profile.profile_media_type === 'video' ? (
                <video
                  src={profile.profile_media_url}
                  className="w-full h-full object-cover rounded-full"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <AvatarImage src={profile.profile_media_url} alt="User avatar" />
              )
            ) : (
              <ImageFallback src="https://i.pravatar.cc/150?img=1" alt="User avatar" />
            )}
            <AvatarFallback>{profile?.full_name?.[0] || 'ME'}</AvatarFallback>
          </Avatar>
          <ChevronDown size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background border-white/10">
        <DropdownMenuItem 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
          <HardDrive width={16} height={16} />
          <span>Storage</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
          <Database width={16} height={16} />
          <span>Data</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
          <Wallet width={16} height={16} />
          <span>Wallet</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
