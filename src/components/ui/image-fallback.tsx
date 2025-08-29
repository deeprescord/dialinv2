import React, { useState } from 'react';
import { cn } from '@/lib/utils';

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
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const defaultFallback = "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-family='system-ui' font-size='14' fill='%23d1d5db' text-anchor='middle' dy='0.3em'%3eImage%3c/text%3e%3c/svg%3e";

  const handleLoad = () => {
    setImageState('loaded');
  };

  const handleError = () => {
    setImageState('error');
  };

  // Only reset state when src actually changes and is different
  React.useEffect(() => {
    if (src && src !== currentSrc) {
      setCurrentSrc(src);
      setImageState('loading');
    }
  }, [src, currentSrc]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imageState === 'error' ? (fallbackSrc || defaultFallback) : src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageState === 'error' && fallbackClassName,
          imageState === 'loading' ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}