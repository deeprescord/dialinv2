import React from 'react';
import { motion } from 'framer-motion';

interface GradientLoaderProps {
  isLoading: boolean;
  className?: string;
}

export function GradientLoader({ isLoading, className = '' }: GradientLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className={`absolute top-0 left-0 right-0 h-1 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{ width: '50%' }}
      />
    </div>
  );
}