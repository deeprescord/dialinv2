import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Close, Pin, MessageSquare, Bot, PlusCircle } from '../icons';
import { Friend } from '@/data/catalogs';
import { SHARE_TOGGLES } from '@/data/constants';
import { MediaRow } from './MediaRow';
import { ShareMyBar } from './ShareMyBar';
import * as Icons from '../icons';

interface ContactPaneProps {
  isOpen: boolean;
  contact: Friend | null;
  isPinned: boolean;
  sharedToggles: string[];
  onClose: () => void;
  onPin: () => void;
  onUnpin: () => void;
  onChatClick?: (contact: Friend) => void;
  onAIClick?: () => void;
}

export function ContactPane({ 
  isOpen, 
  contact, 
  isPinned,
  sharedToggles,
  onClose, 
  onPin, 
  onUnpin,
  onChatClick,
  onAIClick
}: ContactPaneProps) {
  const [activeShareToggles, setActiveShareToggles] = useState<string[]>(['workPhone', 'workEmail']);
  const [currentSection, setCurrentSection] = useState('posts');
  
  if (!contact) return null;

  const handleToggleChange = (toggleKey: string) => {
    setActiveShareToggles(prev => 
      prev.includes(toggleKey) 
        ? prev.filter(key => key !== toggleKey)
        : [...prev, toggleKey]
    );
  };

  // Mock data for contact's content
  const contactPosts = [
    { id: '1', title: `${contact.name}'s recent share`, thumb: 'https://images.unsplash.com/photo-1440180984861-071070bfaa22?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar },
    { id: '4', title: `${contact.name}'s adventure`, thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar }
  ];

  const sharedToMe = [
    { id: '2', title: 'Shared with you', thumb: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar },
    { id: '5', title: 'Another share', thumb: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar }
  ];

  const sentByMe = [
    { id: '3', title: 'You shared this', thumb: 'https://images.unsplash.com/photo-1594909122845-11bfd2b9b0f5?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: 'You', sharedByAvatar: 'https://i.pravatar.cc/150?img=1' },
    { id: '6', title: 'Your recent post', thumb: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: 'You', sharedByAvatar: 'https://i.pravatar.cc/150?img=1' }
  ];

  const chatThreads = [
    { id: '7', title: 'Weekend Plans', thumb: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar },
    { id: '8', title: 'Project Discussion', thumb: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?q=80&w=400&h=225&fit=crop&auto=format', sharedBy: contact.name, sharedByAvatar: contact.avatar }
  ];

  const sections = [
    { id: 'posts', label: 'Posts', data: contactPosts },
    { id: 'shared', label: 'Shared', data: sharedToMe },
    { id: 'sent', label: 'Sent', data: sentByMe },
    { id: 'chat', label: 'Chat', data: chatThreads }
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
          <div 
            className="relative h-[60vh] lg:h-[70vh] bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/lovable-uploads/cropped-header-bg.png')`
            }}
          >
            <Button
              variant="ghost"
              className="absolute top-4 right-4 z-10 glass-card"
              onClick={onClose}
            >
              <Close size={20} />
            </Button>
          </div>

          {/* Contact Navigation Bar */}
          <div className="mb-4 relative -mt-8 mx-4 z-20">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-lg border border-white/10"></div>
            <div className="relative flex items-center justify-between px-4 py-3">
              {/* Contact Info and Share My - Left Side */}
              <div className="flex items-center space-x-4">
                {/* Contact Avatar and Info */}
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center space-y-1">
                    <h2 className="text-sm font-semibold text-white">{contact.name}</h2>
                    <Avatar className="h-12 w-12 ring-2 ring-white/30">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback className="text-sm">{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Contact Info Icons */}
                  <div className="flex space-x-2">
                    {SHARE_TOGGLES.map((toggle) => {
                      if (!sharedToggles.includes(toggle.key)) return null;
                      const IconComponent = Icons[toggle.icon as keyof typeof Icons] as React.ComponentType<any>;
                      
                      return (
                        <div
                          key={toggle.key}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/30"
                        >
                          <IconComponent size={14} className="text-white" />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pin Button */}
                  <Button
                    variant={isPinned ? 'default' : 'outline'}
                    size="sm"
                    className="glass-card border-white/20 text-xs bg-white/10 hover:bg-white/20 h-8"
                    onClick={isPinned ? onUnpin : onPin}
                  >
                    <Pin size={12} className="mr-1" />
                    {isPinned ? 'Unpin' : 'Pin'}
                  </Button>
                </div>

                {/* Section Navigation */}
                <div className="flex items-center space-x-2 ml-6">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(section.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        currentSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons - Right Side */}
              <div className="flex items-center space-x-3">
                {/* Add Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 h-8 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                >
                  <PlusCircle size={14} className="text-green-400" />
                  <span className="text-xs">Add</span>
                </Button>

                {/* AI Bot Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 h-8 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                  onClick={onAIClick}
                >
                  <Bot size={14} className="text-blue-400" />
                  <span className="text-xs">AI</span>
                </Button>

                {/* Chat Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 h-8 glass-card border-white/30 hover:bg-white/10 hover:border-primary/50"
                  onClick={() => contact && onChatClick?.(contact)}
                >
                  <MessageSquare size={14} className="text-purple-400" />
                  <span className="text-xs">Chat</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="pb-40">
            {sections.map((section) => (
              currentSection === section.id && (
                <MediaRow
                  key={section.id}
                  title={section.label.toUpperCase()}
                  items={section.data}
                  onItemClick={() => {}}
                />
              )
            ))}
          </div>

          {/* Share My Bar Footer */}
          <ShareMyBar
            activeToggles={activeShareToggles}
            onToggleChange={handleToggleChange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}