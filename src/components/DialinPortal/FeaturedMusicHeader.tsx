import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Play } from 'lucide-react';
import { MusicItem } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';

interface FeaturedMusicHeaderProps {
  music: MusicItem;
  onMusicClick: (music: MusicItem) => void;
}

export function FeaturedMusicHeader({ music, onMusicClick }: FeaturedMusicHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mb-8 mx-4 rounded-xl overflow-hidden cursor-pointer group h-[60vh] lg:h-[70vh]"
      onClick={() => onMusicClick(music)}
    >
      {/* Background Image */}
      <ImageFallback 
        src={music.art}
        alt={music.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyberpunk-primary/20 to-cyberpunk-accent/20" />
      
      {/* Glass Effect */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-white/5" />
      
      {/* Content */}
      <div className="relative p-8 h-full flex flex-col justify-end">
        {/* Featured Label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-4"
        >
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-cyberpunk-primary/80 text-white rounded-full backdrop-blur-sm">
            FEATURED MUSIC
          </span>
        </motion.div>
        
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-4xl lg:text-6xl font-bold text-white mb-3 leading-tight"
        >
          {music.title}
        </motion.h2>
        
        {/* Artist Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="text-white/90">
            <p className="text-lg lg:text-xl font-medium">By {music.artist}</p>
            <p className="text-sm lg:text-base text-white/60">{music.type} • {music.vibe}</p>
          </div>
          
          {/* Play Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm group-hover:scale-110 transition-all duration-300"
          >
            <Play className="h-8 w-8 lg:h-10 lg:w-10 text-white fill-white" />
          </Button>
        </motion.div>
        
        {/* Duration Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="absolute top-4 right-4"
        >
          <span className="inline-block px-3 py-2 text-sm font-medium bg-black/60 text-white rounded backdrop-blur-sm">
            {music.length}
          </span>
        </motion.div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyberpunk-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}