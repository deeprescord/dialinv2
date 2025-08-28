
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Friend } from '@/data/catalogs';

interface ContactHeaderProps {
  contact: Friend;
  onContactClick: (contact: Friend) => void;
}

export function ContactHeader({ contact, onContactClick }: ContactHeaderProps) {
  const getHeaderImage = (name: string) => {
    // Generate consistent header images based on contact name
    const images = [
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?q=80&w=800&h=300&fit=crop',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bea4d5618c?q=80&w=800&h=300&fit=crop',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&h=300&fit=crop'
    ];
    return images[name.length % images.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-64 bg-gradient-to-br from-dialin-purple/20 to-dialin-purple-dark/20 rounded-lg overflow-hidden cursor-pointer group"
      onClick={() => onContactClick(contact)}
    >
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-300"
        style={{ backgroundImage: `url(${getHeaderImage(contact.name)})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Contact Info */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 ring-2 ring-white/20">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback>{contact.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold text-lg">{contact.name}</h3>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-2 h-2 rounded-full ${
                  contact.status === 'online' ? 'bg-emerald-500' :
                  contact.status === 'away' ? 'bg-amber-500' :
                  'bg-gray-500'
                }`}
              />
              <span className="text-white/80 text-sm capitalize">{contact.status}</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="glass-card border-white/20 text-white hover:bg-white/10"
        >
          View Profile
        </Button>
      </div>
    </motion.div>
  );
}
