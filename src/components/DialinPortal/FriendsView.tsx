import React from 'react';
import { motion } from 'framer-motion';
import { PinnedContactsRow } from './PinnedContactsRow';
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
      <PinnedContactsRow 
        contacts={pinnedContacts}
        onContactClick={onContactClick}
      />

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