
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { MessageCircle, Close, Plus, Users } from '../icons';

interface ChatThread {
  id: string;
  name: string;
  lastMessage: string;
  date: string;
  avatar?: string;
  isGroup?: boolean;
}

const chatThreads: ChatThread[] = [
  {
    id: '1',
    name: 'Toral B',
    lastMessage: 'I added a slider dial to my last message.. it\'s on the top right. You can tap on that...',
    date: '08/08/2025',
    avatar: 'https://i.pravatar.cc/150?img=10'
  },
  {
    id: '2',
    name: 'Irfan',
    lastMessage: 'Congratulations, as of August 6, 2025 you and Irfan are now dialed in!',
    date: '08/06/2025',
    avatar: 'https://i.pravatar.cc/150?img=8'
  },
  {
    id: '3',
    name: 'Dialin',
    lastMessage: 'Sup',
    date: '08/03/2025',
    avatar: '/brand/dialin-logo-white.png'
  },
  {
    id: '4',
    name: 'Robyn Morgan',
    lastMessage: 'Congratulations, as of July 31, 2025 you and Robyn Morgan are now dialed in!',
    date: '07/30/2025',
    avatar: 'https://i.pravatar.cc/150?img=12'
  }
];

const pinnedGroups = [
  { id: 'g1', name: 'Guardians of the Galaxy', avatar: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?q=80&w=150&h=150&fit=crop' },
  { id: 'g2', name: 'The Enterprise', avatar: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=150&h=150&fit=crop' }
];

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);

  return (
    <>
      {/* Chat Icon */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full bg-dialin-purple hover:bg-dialin-purple-dark shadow-lg shadow-dialin-purple/25"
        >
          <MessageCircle size={24} />
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 h-96 glass-card border border-white/10 rounded-lg overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Input 
                placeholder="search for contacts"
                className="flex-1 bg-white/5 border-white/10 rounded-full text-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="ml-2"
              >
                <Close size={16} />
              </Button>
            </div>

            {/* Chat Threads */}
            <div className="flex-1 overflow-y-auto">
              {chatThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="flex items-center p-3 hover:bg-white/5 cursor-pointer border-b border-white/5"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={thread.avatar} />
                    <AvatarFallback>{thread.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{thread.name}</span>
                      <span className="text-xs text-muted-foreground">{thread.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pinned Groups Section */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">your pinned contacts</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroupCreator(true)}
                  className="text-xs"
                >
                  <Users size={14} className="mr-1" />
                  group
                </Button>
              </div>
              
              <div className="flex space-x-2">
                {pinnedGroups.map((group) => (
                  <div key={group.id} className="flex flex-col items-center">
                    <Avatar className="h-12 w-12 mb-1">
                      <AvatarImage src={group.avatar} />
                      <AvatarFallback>{group.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-center">{group.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-3">
                <Button variant="ghost" size="sm" className="text-xs">
                  find new contacts
                </Button>
                <Button variant="ghost" size="sm" className="text-xs">
                  invite to dialin
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Creator Modal */}
      <AnimatePresence>
        {showGroupCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowGroupCreator(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 rounded-lg w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-4">Create New Group</h3>
              <Input placeholder="Group name" className="mb-4" />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowGroupCreator(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowGroupCreator(false)}>
                  Create
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
