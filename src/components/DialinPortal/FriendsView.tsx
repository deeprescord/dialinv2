
import React from 'react';
import { motion } from 'framer-motion';
import { FeaturedPostHeader } from './FeaturedPostHeader';
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
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-40 lg:pt-28 pb-40"
    >
      {/* Featured Post Header */}
      {featuredPost && (
        <FeaturedPostHeader
          post={featuredPost}
          onPostClick={onPostClick}
        />
      )}

      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">More Posts</h2>
      </div>

      <MediaGrid
        items={remainingPosts}
        onItemClick={onPostClick}
        onItemLongPress={onPostLongPress}
      />
    </motion.div>
  );
}
