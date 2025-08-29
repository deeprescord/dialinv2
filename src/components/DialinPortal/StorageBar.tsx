import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '../ui/progress';
import { formatStorageUsed } from '@/lib/filters';

interface StorageBarProps {
  usedGB: number;
  totalTB: number;
  className?: string;
}

export function StorageBar({ usedGB, totalTB, className = "" }: StorageBarProps) {
  const { used, total, percentage } = formatStorageUsed(usedGB, totalTB) as any;
  
  return (
    <motion.div 
      className={`fixed bottom-0 left-0 right-0 glass-nav p-4 border-t border-white/10 ${className}`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Storage</span>
        <span className="text-xs text-muted-foreground">{used} / {total}</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
      />
    </motion.div>
  );
}