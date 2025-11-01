import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import logoFallback from '@/assets/logo-fallback.jpg';
import userAvatarsSet from '@/assets/user-avatars-set.jpg';
import appBackground from '@/assets/app-background.jpg';
import featuredVideoBg from '@/assets/featured-video-bg.jpg';
import musicAlbumGrid from '@/assets/music-album-grid.jpg';
import videoGridThumbs from '@/assets/video-grid-thumbs.jpg';
import defaultMusicCover from '@/assets/default-music-cover.png';
import defaultSpaceThumbnail from '@/assets/default-space-thumbnail.jpg';
import audioVisualizer from '@/assets/audio-visualizer-animated.gif';

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackClassName?: string;
}

export function ImageFallback({ 
  src, 
  alt, 
  className, 
  fallbackSrc, 
  fallbackClassName,
  ...props 
}: ImageFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // Choose appropriate fallback based on alt text or className
  const getSmartFallback = () => {
    if (fallbackSrc) return fallbackSrc;
    
    const altLower = alt?.toLowerCase() || '';
    const classLower = className?.toLowerCase() || '';
    
    // Video content fallbacks
    if (altLower.includes('video') || altLower.includes('movie') || altLower.includes('film') || 
        altLower.includes('cyberpunk') || altLower.includes('tech') || altLower.includes('cinema')) {
      return featuredVideoBg;
    }
    
    // Music content fallbacks  
    if (altLower.includes('music') || altLower.includes('album') || altLower.includes('artist') || 
        altLower.includes('song') || altLower.includes('track') || altLower.includes('sound') ||
        altLower.includes('audio') || altLower.includes('mp3')) {
      return audioVisualizer;
    }
    
    // Avatar/profile fallbacks
    if (altLower.includes('avatar') || altLower.includes('profile') || classLower.includes('avatar')) {
      return userAvatarsSet;
    }
    
    // Logo fallbacks
    if (altLower.includes('logo') || altLower.includes('dialin') || classLower.includes('logo')) {
      return logoFallback;
    }
    
    // Background/hero fallbacks
    if (altLower.includes('background') || altLower.includes('hero') || classLower.includes('background')) {
      return appBackground;
    }
    
    // Thumbnail grid fallbacks
    if (altLower.includes('thumb') || altLower.includes('grid') || altLower.includes('collection')) {
      return videoGridThumbs;
    }
    
    // Space fallbacks
    if (altLower.includes('space') || classLower.includes('space')) {
      return defaultSpaceThumbnail;
    }
    
    // Default cyberpunk fallback with better styling
    return "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23020817'/%3e%3cg%3e%3crect x='20' y='20' width='60' height='60' fill='none' stroke='%236366f1' stroke-width='2'/%3e%3ccircle cx='50' cy='35' r='3' fill='%236366f1'/%3e%3cpath d='M30 50h40M35 55h30' stroke='%236366f1' stroke-width='1.5'/%3e%3c/g%3e%3c/svg%3e";
  };

  const handleError = () => {
    setHasError(true);
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  return (
    <img
      src={hasError ? getSmartFallback() : src}
      alt={alt}
      className={cn(
        className,
        hasError && fallbackClassName,
        hasError && "object-cover" // Ensure fallback images fit well
      )}
      onError={handleError}
      {...props}
    />
  );
}