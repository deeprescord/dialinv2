
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { MessageCircle, Close, Plus, Users, ArrowLeft, Send } from '../icons';

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
    name: 'Maya Chen',
    lastMessage: 'Check out this new synthwave track I found 🎵',
    date: '08/05/2025',
    avatar: 'https://i.pravatar.cc/150?img=3'
  },
  {
    id: '4',
    name: 'Alex Rivera',
    lastMessage: 'Meeting in the Music Den at 8pm?',
    date: '08/04/2025',
    avatar: 'https://i.pravatar.cc/150?img=15'
  },
  {
    id: '5',
    name: 'Dialin',
    lastMessage: 'Sup',
    date: '08/03/2025',
    avatar: '/brand/dialin-logo-white.png'
  },
  {
    id: '6',
    name: 'Jordan Kim',
    lastMessage: 'That cyberpunk documentary was amazing! Thanks for sharing',
    date: '08/02/2025',
    avatar: 'https://i.pravatar.cc/150?img=20'
  },
  {
    id: '7',
    name: 'Sam Digital',
    lastMessage: 'Just uploaded some new beats to the den',
    date: '08/01/2025',
    avatar: 'https://i.pravatar.cc/150?img=25'
  },
  {
    id: '8',
    name: 'Riley Moon',
    lastMessage: 'Anyone up for a virtual hangout tonight?',
    date: '07/31/2025',
    avatar: 'https://i.pravatar.cc/150?img=30'
  },
  {
    id: '9',
    name: 'Robyn Morgan',
    lastMessage: 'Congratulations, as of July 31, 2025 you and Robyn Morgan are now dialed in!',
    date: '07/30/2025',
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: '10',
    name: 'Casey Neo',
    lastMessage: 'Love the new floor designs! 🔥',
    date: '07/29/2025',
    avatar: 'https://i.pravatar.cc/150?img=35'
  },
  {
    id: '11',
    name: 'Phoenix Labs',
    lastMessage: 'Beta testing the new AR features tomorrow',
    date: '07/28/2025',
    avatar: 'https://i.pravatar.cc/150?img=40'
  },
  {
    id: '12',
    name: 'Sage Digital',
    lastMessage: 'That music visualization was incredible!',
    date: '07/27/2025',
    avatar: 'https://i.pravatar.cc/150?img=45'
  },
  {
    id: '13',
    name: 'Echo Studio',
    lastMessage: 'New collaboration space is live 🎨',
    date: '07/26/2025',
    avatar: 'https://i.pravatar.cc/150?img=50'
  },
  {
    id: '14',
    name: 'Nova Tech',
    lastMessage: 'Check out the latest immersive experience',
    date: '07/25/2025',
    avatar: 'https://i.pravatar.cc/150?img=55'
  }
];

const pinnedGroups = [
  { id: 'g1', name: 'Guardians of the Galaxy', avatar: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?q=80&w=150&h=150&fit=crop' },
  { id: 'g2', name: 'The Enterprise', avatar: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=150&h=150&fit=crop' }
];

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = useMemo(() => {
    if (!searchQuery) return chatThreads;
    return chatThreads.filter(thread => 
      thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
          <MessageCircle width={24} height={24} />
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-6 w-80 h-96 glass-card border border-white/10 rounded-lg overflow-hidden z-40 flex flex-col"
          >
            {selectedThread ? (
              // Individual Thread View
              <>
                {/* Thread Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedThread(null)}
                      className="mr-2 p-1"
                    >
                      <ArrowLeft size={16} />
                    </Button>
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={selectedThread.avatar} />
                      <AvatarFallback>{selectedThread.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-white">{selectedThread.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <Close size={16} />
                  </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="mb-4">
                    <div className="flex justify-end mb-2">
                      <div className="bg-dialin-purple rounded-lg p-3 max-w-xs">
                        <p className="text-white text-sm">Hey! How's it going?</p>
                        <span className="text-xs text-white/60 mt-1 block">2:30 PM</span>
                      </div>
                    </div>
                    <div className="flex justify-start mb-2">
                      <div className="bg-white/10 rounded-lg p-3 max-w-xs">
                        <p className="text-white text-sm">{selectedThread.lastMessage}</p>
                        <span className="text-xs text-white/60 mt-1 block">{selectedThread.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Type a message..."
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                    <Button size="sm" className="bg-dialin-purple hover:bg-dialin-purple-dark">
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Main Chat List View
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                  <Input 
                    placeholder="search for contacts"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 rounded-full text-sm text-white placeholder:text-white/60"
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
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className="flex items-center p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 transition-colors"
                      onClick={() => setSelectedThread(thread)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={thread.avatar} />
                        <AvatarFallback className="bg-white/20 text-white">{thread.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-white">{thread.name}</span>
                          <span className="text-xs text-white/60">{thread.date}</span>
                        </div>
                        <p className="text-xs text-white/70 truncate mt-1">
                          {thread.lastMessage}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredThreads.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-white/60 text-sm">No conversations found</p>
                    </div>
                  )}
                </div>

                {/* Pinned Groups Section - Moved to Bottom */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">your pinned contacts</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGroupCreator(true)}
                      className="text-xs text-white/80 hover:text-white"
                    >
                      <Users size={14} className="mr-1" />
                      group
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2 mb-3">
                    {pinnedGroups.map((group) => (
                      <div key={group.id} className="flex flex-col items-center">
                        <Avatar className="h-10 w-10 mb-1">
                          <AvatarImage src={group.avatar} />
                          <AvatarFallback className="bg-white/20 text-white text-xs">{group.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-center text-white/80 truncate w-12">{group.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" size="sm" className="text-xs text-white/80 hover:text-white">
                      find new contacts
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-white/80 hover:text-white">
                      invite to dialin
                    </Button>
                  </div>
                </div>
              </>
            )}
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
              <h3 className="font-semibold mb-4 text-white">Create New Group</h3>
              <Input placeholder="Group name" className="mb-4 bg-white/10 border-white/20 text-white placeholder:text-white/60" />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowGroupCreator(false)} className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={() => setShowGroupCreator(false)} className="bg-dialin-purple hover:bg-dialin-purple-dark">
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
