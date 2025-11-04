import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Friend } from '@/data/catalogs';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '../ui/scroll-area';

interface ContactsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onContactClick?: (contact: Friend) => void;
}

export function ContactsPanel({ isOpen, onClose, onContactClick }: ContactsPanelProps) {
  const [contacts, setContacts] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchContacts = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all profiles as potential contacts
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_media_url')
          .neq('user_id', user.id);

        if (error) throw error;

        const contactsList: Friend[] = (profiles || []).map(profile => ({
          id: profile.user_id,
          name: profile.full_name || 'Unknown User',
          avatar: profile.profile_media_url || '/placeholder.svg',
          status: 'offline' as const
        }));

        setContacts(contactsList);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-background/95 backdrop-blur-md border-l border-white/10 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">Contacts</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Contacts List */}
            <ScrollArea className="h-[calc(100vh-65px)]">
              <div className="p-4 space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading contacts...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No contacts found
                  </div>
                ) : (
                  contacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto hover:bg-white/10"
                        onClick={() => onContactClick?.(contact)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage 
                                src={contact.avatar} 
                                alt={contact.name}
                              />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {contact.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div 
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
                                contact.status === 'online' ? 'bg-emerald-500' :
                                contact.status === 'away' ? 'bg-amber-500' :
                                'bg-gray-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {contact.status}
                            </div>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
