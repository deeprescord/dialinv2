import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../ui/skeleton';
import { ImageGridFallback } from './ImageGridFallback';

interface LoadingStateProps {
  type: 'media' | 'contacts' | 'grid' | 'infinite';
  count?: number;
}

export function LoadingState({ type, count = 8 }: LoadingStateProps) {
  if (type === 'grid') {
    return <ImageGridFallback type="video" count={count} />;
  }

  if (type === 'contacts') {
    return (
      <div className="flex space-x-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex flex-col items-center"
          >
            <Skeleton className="h-12 w-12 rounded-full mb-2" />
            <Skeleton className="h-3 w-16" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'infinite') {
    return (
      <div className="min-h-[90vh] snap-start flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="w-full max-w-2xl"
        >
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl">
            <Skeleton className="aspect-video w-full" />
            <div className="p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Media loading state
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}