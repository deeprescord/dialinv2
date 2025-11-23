import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassHUDProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function GlassHUD({ children, className = '', variant = 'default' }: GlassHUDProps) {
  const variants = {
    default: 'backdrop-blur-2xl bg-background/10 border-2 border-primary/20 shadow-[0_8px_32px_0_rgba(118,51,204,0.37)]',
    compact: 'backdrop-blur-xl bg-background/5 border border-border/30',
    minimal: 'backdrop-blur-md bg-background/5 border border-border/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl ${variants[variant]} ${className}`}
      style={{
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* Holographic edge effect */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(118, 51, 204, 0.1) 0%, transparent 50%, rgba(118, 51, 204, 0.1) 100%)',
        }}
      />
      
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
        initial={{ y: '-100%' }}
        animate={{ y: '100%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(118, 51, 204, 0.3), transparent)',
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
