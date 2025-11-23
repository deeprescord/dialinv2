import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassHUDProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export function GlassHUD({ children, className = '', variant = 'default' }: GlassHUDProps) {
  const variants = {
    default: 'backdrop-blur-3xl bg-background/10 border border-white/10 shadow-[0_8px_32px_0_rgba(118,51,204,0.4),inset_0_1px_1px_0_rgba(255,255,255,0.1)]',
    compact: 'backdrop-blur-2xl bg-background/5 border border-white/10 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.08)]',
    minimal: 'backdrop-blur-xl bg-background/5 border border-white/5 shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05)]'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl ${variants[variant]} ${className}`}
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* Inner white glow - thick glass effect */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%, rgba(255, 255, 255, 0.08) 100%)',
        }}
      />
      
      {/* Holographic prismatic edge */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(118, 51, 204, 0.15) 0%, transparent 30%, transparent 70%, rgba(0, 188, 212, 0.15) 100%)',
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
            background: 'linear-gradient(to bottom, transparent, rgba(118, 51, 204, 0.4), transparent)',
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
