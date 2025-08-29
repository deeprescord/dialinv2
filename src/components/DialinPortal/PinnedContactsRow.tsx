import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Friend } from '@/data/catalogs';

interface PinnedContactsRowProps {
  contacts: Friend[];
  onContactClick: (contact: Friend) => void;
}

export function PinnedContactsRow({ contacts, onContactClick }: PinnedContactsRowProps) {
  if (contacts.length === 0) return null;

  return (
    <div className="mb-8 relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg"></div>
      <div className="relative">
        <h2 className="text-xl font-semibold mb-4 px-4 pt-3">Pinned Contacts</h2>
        <div className="flex space-x-3 px-4 pb-3 overflow-x-auto scrollbar-thin">
        {contacts.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="flex items-center space-x-3 px-4 py-2 h-auto glass-card hover:bg-white/10 border-white/10"
              onClick={() => onContactClick(contact)}
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div 
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                    contact.status === 'online' ? 'bg-emerald-500' :
                    contact.status === 'away' ? 'bg-amber-500' :
                    'bg-gray-500'
                  }`}
                />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{contact.name}</span>
            </Button>
          </motion.div>
        ))}
        </div>
      </div>
    </div>
  );
}