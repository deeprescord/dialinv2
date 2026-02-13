import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import userAvatarsSet from '@/assets/user-avatars-set.jpg';

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackClassName?: string;
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => cleanUrl.endsWith(ext));
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
    
    // Avatar/profile fallbacks
    if (altLower.includes('avatar') || altLower.includes('profile') || classLower.includes('avatar')) {
      return userAvatarsSet;
    }
    
    // Black fallback for everything else (videos, music, spaces, backgrounds, logos, etc.)
    return "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23000000'/%3e%3c/svg%3e";
  };

  const handleError = () => {
    setHasError(true);
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  // Render video thumbnail as a muted video element to show the first frame
  if (!hasError && isVideoUrl(src)) {
    return (
      <video
        src={src}
        muted
        playsInline
        preload="metadata"
        className={cn(className)}
        onError={handleError}
        onLoadedData={(e) => {
          const video = e.currentTarget;
          if (video.currentTime === 0) video.currentTime = 0.1;
        }}
      />
    );
  }

  return (
    <img
      src={hasError ? getSmartFallback() : src}
      alt={alt}
      className={cn(
        className,
        hasError && fallbackClassName,
        hasError && "object-cover"
      )}
      onError={handleError}
      {...props}
    />
  );
}
