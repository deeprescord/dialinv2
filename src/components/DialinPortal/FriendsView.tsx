
import React from 'react';
import { motion } from 'framer-motion';
import { ContactHeader } from './ContactHeader';
import { MediaGrid } from './MediaGrid';
import { Friend, Post } from '@/data/catalogs';

interface FriendsViewProps {
  pinnedContacts: Friend[];
  posts: Post[];
  onContactClick: (contact: Friend) => void;
  onPostClick: (post: Post) => void;
  onPostLongPress: (post: Post) => void;
}

export function FriendsView({ 
  pinnedContacts, 
  posts,
  onContactClick, 
  onPostClick,
  onPostLongPress
}: FriendsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-32 lg:pt-28 pb-20"
    >
      {/* Pinned Contact Headers */}
      {pinnedContacts.length > 0 && (
        <div className="mb-8 px-4">
          <h2 className="text-xl font-semibold mb-4">Pinned Contacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedContacts.slice(0, 4).map((contact) => (
              <ContactHeader
                key={contact.id}
                contact={contact}
                onContactClick={onContactClick}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
      </div>

      <MediaGrid
        items={posts}
        onItemClick={onPostClick}
        onItemLongPress={onPostLongPress}
      />
    </motion.div>
  );
}
