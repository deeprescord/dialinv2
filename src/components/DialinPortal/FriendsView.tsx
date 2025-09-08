
import React from 'react';
import { motion } from 'framer-motion';
import { HeroHeaderVideo } from './HeroHeaderVideo';
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
      className="pb-32"
    >
      {/* Hero Header */}
      <HeroHeaderVideo
        posterSrc="/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"
        title="Friends"
        subtitle="Connect and share moments"
        backgroundImage="/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png"
        showVideo={false}
      />

      {/* Featured Post Section */}
      {featuredPost && (
        <div className="px-4 mb-6">
          <FeaturedPostHeader
            post={featuredPost}
            onPostClick={onPostClick}
          />
        </div>
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
