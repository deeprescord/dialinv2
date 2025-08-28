import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Close, Pin } from '../icons';
import { Friend } from '@/data/catalogs';
import { SHARE_TOGGLES } from '@/data/constants';
import { MediaRow } from './MediaRow';
import * as Icons from '../icons';

interface ContactPaneProps {
  isOpen: boolean;
  contact: Friend | null;
  isPinned: boolean;
  sharedToggles: string[];
  onClose: () => void;
  onPin: () => void;
  onUnpin: () => void;
}

export function ContactPane({ 
  isOpen, 
  contact, 
  isPinned,
  sharedToggles,
  onClose, 
  onPin, 
  onUnpin 
}: ContactPaneProps) {
  if (!contact) return null;

  // Mock data for contact's content
  const contactPosts = [
    { id: '1', title: `${contact.name}'s recent share`, thumb: 'https://images.unsplash.com/photo-1440180984861-071070bfaa22?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar }
  ];

  const sharedToMe = [
    { id: '2', title: 'Shared with you', thumb: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar }
  ];

  const sentByMe = [
    { id: '3', title: 'You shared this', thumb: 'https://images.unsplash.com/photo-1594909122845-11bfd2b9b0f5?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: 'You', sharedByAvatar: 'https://i.pravatar.cc/150?img=1' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-40 bg-background overflow-y-auto"
        >
          {/* Hero Header */}
          <div className="relative h-64 bg-gradient-to-br from-dialin-purple to-dialin-purple-dark">
            <Button
              variant="ghost"
              className="absolute top-4 right-4 z-10 glass-card"
              onClick={onClose}
            >
              <Close size={20} />
            </Button>
            
            {/* Contact Info Overlay */}
            <div className="absolute bottom-4 right-4">
              <div className="flex items-end space-x-4">
                {/* Share Info Icons */}
                <div className="flex space-x-2">
                  {SHARE_TOGGLES.map((toggle) => {
                    if (!sharedToggles.includes(toggle.key)) return null;
                    const IconComponent = Icons[toggle.icon as keyof typeof Icons] as React.ComponentType<any>;
                    
                    return (
                      <div
                        key={toggle.key}
                        className={`w-8 h-8 rounded flex items-center justify-center ${toggle.color}`}
                      >
                        <IconComponent size={16} className="text-white" />
                      </div>
                    );
                  })}
                </div>

                {/* Avatar and Pin */}
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-16 w-16 ring-4 ring-white/20">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant={isPinned ? 'default' : 'outline'}
                    size="sm"
                    className="glass-card border-white/20 text-xs"
                    onClick={isPinned ? onUnpin : onPin}
                  >
                    <Pin size={14} className="mr-1" />
                    {isPinned ? 'Unpin' : 'Pin'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content Rows */}
          <div className="pb-20">
            <MediaRow
              title="POSTS"
              items={contactPosts}
              onItemClick={() => {}}
            />

            <MediaRow
              title="SHARED (to me)"
              items={sharedToMe}
              onItemClick={() => {}}
            />

            <MediaRow
              title="SENT (by me)"
              items={sentByMe}
              onItemClick={() => {}}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}