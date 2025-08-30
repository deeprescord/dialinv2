import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ArrowLeft, Close, Plus, MessageCircle, Send } from '../icons';

interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  type: 'direct' | 'group';
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const chatThreads: ChatThread[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    lastMessage: 'Hey! How\'s the new project going?',
    timestamp: '2:30 PM',
    unread: 2,
    type: 'direct'
  },
  {
    id: '2',
    name: 'Tech Team',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=150&h=150&fit=crop',
    lastMessage: 'Meeting at 3 PM today',
    timestamp: '1:45 PM',
    unread: 0,
    type: 'group'
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatar: 'https://i.pravatar.cc/150?img=3',
    lastMessage: 'Thanks for the help!',
    timestamp: '12:15 PM',
    unread: 1,
    type: 'direct'
  },
  {
    id: '4',
    name: 'Design Squad',
    avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=150&h=150&fit=crop',
    lastMessage: 'New mockups are ready',
    timestamp: '11:30 AM',
    unread: 3,
    type: 'group'
  },
  {
    id: '5',
    name: 'Alex Rivera',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Let\'s catch up soon',
    timestamp: 'Yesterday',
    unread: 0,
    type: 'direct'
  }
];

const pinnedContacts = [
  { id: 'p1', name: 'Emma', avatar: 'https://i.pravatar.cc/150?img=44' },
  { id: 'p2', name: 'James', avatar: 'https://i.pravatar.cc/150?img=52' },
  { id: 'p3', name: 'Lisa', avatar: 'https://i.pravatar.cc/150?img=49' },
  { id: 'p4', name: 'David', avatar: 'https://i.pravatar.cc/150?img=55' }
];

const pinnedGroups = [
  { id: 'g1', name: 'Guardians of the Galaxy', avatar: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?q=80&w=150&h=150&fit=crop' },
  { id: 'g2', name: 'The Enterprise', avatar: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?q=80&w=150&h=150&fit=crop' }
];

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
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
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-transparent z-40"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-40 right-6 w-80 h-[36rem] glass-card border border-white/10 rounded-lg overflow-hidden z-50 flex flex-col"
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
                    onClick={onClose}
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
                        <p className="text-white text-sm">Pretty good! Just working on some new features.</p>
                        <span className="text-xs text-white/60 mt-1 block">2:32 PM</span>
                      </div>
                    </div>
                    <div className="flex justify-end mb-2">
                      <div className="bg-dialin-purple rounded-lg p-3 max-w-xs">
                        <p className="text-white text-sm">That sounds exciting! Can't wait to see what you're building.</p>
                        <span className="text-xs text-white/60 mt-1 block">2:35 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10 bg-black/10">
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Type a message..." 
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-dialin-purple"
                    />
                    <Button size="sm" className="bg-dialin-purple hover:bg-dialin-purple-dark">
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Chat List View
              <>
                {/* Header with Search */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Messages</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGroupCreator(true)}
                      >
                        <Plus size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                      >
                        <Close size={16} />
                      </Button>
                    </div>
                  </div>
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-dialin-purple"
                  />
                </div>

                {/* Pinned Section */}
                <div className="p-4 border-b border-white/10">
                  <h4 className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wide">Pinned</h4>
                  <div className="flex space-x-3 mb-4 overflow-x-auto scrollbar-thin">
                    {pinnedContacts.map((contact) => (
                      <div key={contact.id} className="flex flex-col items-center cursor-pointer hover:opacity-80 flex-shrink-0">
                        <Avatar className="h-10 w-10 mb-1">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{contact.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-white/80">{contact.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3 overflow-x-auto scrollbar-thin">
                    {pinnedGroups.map((group) => (
                      <div key={group.id} className="flex items-center p-2 rounded hover:bg-white/5 cursor-pointer flex-shrink-0 min-w-[120px]">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={group.avatar} />
                          <AvatarFallback>{group.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white font-medium truncate">{group.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thread List - Now takes more space */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-h-full">
                    {filteredThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedThread(thread)}
                        className="flex items-center p-4 hover:bg-white/5 cursor-pointer border-b border-white/5"
                      >
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarImage src={thread.avatar} />
                          <AvatarFallback>{thread.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white truncate">{thread.name}</h4>
                            <span className="text-xs text-white/60 ml-2">{thread.timestamp}</span>
                          </div>
                          <p className="text-sm text-white/70 truncate mt-1">{thread.lastMessage}</p>
                        </div>
                        {thread.unread > 0 && (
                          <div className="bg-dialin-purple text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                            {thread.unread}
                          </div>
                        )}
                      </div>
                    ))}

                    {filteredThreads.length === 0 && (
                      <div className="p-8 text-center">
                        <MessageCircle className="mx-auto mb-2 text-white/30" width={48} height={48} />
                        <p className="text-sm text-white/50 mb-4">Start chatting with friends and groups</p>
                        <div className="flex justify-center space-x-4">
                          <Button variant="ghost" size="sm" className="text-xs text-white/80 hover:text-white">
                            find new contacts
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-white/80 hover:text-white">
                            invite to dialin
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            </motion.div>
          </>
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