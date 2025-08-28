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
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const defaultFallback = "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-family='system-ui' font-size='14' fill='%23d1d5db' text-anchor='middle' dy='0.3em'%3eImage%3c/text%3e%3c/svg%3e";

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className={cn("bg-muted animate-pulse", className)} />
      )}
      <img
        src={hasError ? (fallbackSrc || defaultFallback) : src}
        alt={alt}
        className={cn(
          className,
          hasError && fallbackClassName,
          isLoading && "hidden"
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
}