
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ImageFallback } from '../ui/image-fallback';
import { Settings, HardDrive, Database, Wallet, ChevronDown } from '../icons';
import { LogIn, LogOut } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { AuthModal } from './AuthModal';
import { UserSettings } from './UserSettings';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      navigate('/');
    }
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
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
          onClick={() => setShowSettings(true)}
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
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setShowAuthModal(true)}
          >
            <LogIn size={16} />
            <span>Login</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    <UserSettings 
      isOpen={showSettings}
      onClose={() => setShowSettings(false)}
    />
    </>
  );
}
