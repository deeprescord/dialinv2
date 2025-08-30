import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import videoThumbnails from '@/assets/video-thumbnails.jpg';
import musicCollection from '@/assets/music-collection.jpg';
import locationShowcase from '@/assets/location-showcase.jpg';
import heroAvatars from '@/assets/hero-avatars.jpg';

interface ImageGridFallbackProps {
  type: 'video' | 'music' | 'location' | 'avatar';
  count?: number;
  className?: string;
}

export function ImageGridFallback({ type, count = 8, className = "" }: ImageGridFallbackProps) {
  const getBackgroundImage = () => {
    switch (type) {
      case 'video':
        return videoThumbnails;
      case 'music':
        return musicCollection;
      case 'location':
        return locationShowcase;
      case 'avatar':
        return heroAvatars;
      default:
        return videoThumbnails;
    }
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4 ${className}`}>
      {items.map((index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardContent className="p-0">
              <div 
                className="aspect-video bg-cover bg-center relative"
                style={{ 
                  backgroundImage: `url(${getBackgroundImage()})`,
                  backgroundPosition: `${(index * 12.5) % 100}% ${Math.floor(index / 8) * 25}%`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
                  {type === 'video' && 'Video Content'}
                  {type === 'music' && 'Music Track'}
                  {type === 'location' && 'Location'}
                  {type === 'avatar' && 'Profile'}
                </div>
                {type === 'video' && (
                  <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs">
                    {Math.floor(Math.random() * 5 + 1)}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}