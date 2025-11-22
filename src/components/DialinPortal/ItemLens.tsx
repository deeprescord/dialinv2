import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MoreVertical, 
  Share2, 
  DollarSign, 
  Zap,
  Box
} from 'lucide-react';

// --- TYPES (The Schema) ---
type ItemType = 'image' | 'video' | 'audio' | 'code' | '360_space' | 'document';

interface ItemAscription {
  value: string;
  tags: string[];
  isMonetizable: boolean;
  suggestedPrice?: number;
  licenseType?: string;
}

interface ItemProps {
  id: string;
  title: string;
  type: ItemType;
  url: string;
  entropyScore: number; // 0 to 1 (p-value in UIP)
  ascription?: ItemAscription;
  onMonetize?: (id: string, enabled: boolean) => void;
  onShare?: (id: string) => void;
  onMore?: (id: string) => void;
}

// --- THE COMPONENT ---
export const ItemLens: React.FC<{ item: ItemProps }> = ({ item }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMonetized, setIsMonetized] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  // Simulate the AI "Auto-Ingest" Scan completing
  useEffect(() => {
    const timer = setTimeout(() => setIsScanning(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleMonetizeToggle = () => {
    const newState = !isMonetized;
    setIsMonetized(newState);
    item.onMonetize?.(item.id, newState);
  };

  const handleShare = () => {
    item.onShare?.(item.id);
  };

  const handleMore = () => {
    item.onMore?.(item.id);
  };

  // Dynamic Aura Color based on Entropy/Type
  const getAuraColor = () => {
    if (item.ascription?.isMonetizable) return 'shadow-amber-500/50 border-amber-500/30';
    if (item.type === '360_space') return 'shadow-violet-500/50 border-violet-500/30';
    return 'shadow-cyan-500/50 border-cyan-500/30';
  };

  // Calculate interaction potential: p(1-p)
  const interactionPotential = (item.entropyScore * (1 - item.entropyScore)).toFixed(3);

  return (
    <motion.div
      layout
      className={`relative w-72 h-96 rounded-3xl overflow-hidden backdrop-blur-xl bg-background/40 border transition-all duration-500 ${getAuraColor()} ${isHovered ? 'scale-105 shadow-2xl' : 'shadow-lg'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 1. THE SUBSTRATE (Media Layer) */}
      <div className="absolute inset-0 z-0">
        {item.type === 'image' && (
          <img 
            src={item.url} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-80" 
          />
        )}
        {item.type === 'video' && (
          <video 
            src={item.url} 
            className="w-full h-full object-cover opacity-80" 
            muted 
            loop 
            playsInline
          />
        )}
        {item.type === '360_space' && (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-background flex items-center justify-center">
            <Box className="text-muted-foreground/20 animate-pulse" size={64} />
          </div>
        )}
        {(item.type === 'document' || item.type === 'code') && (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-background flex items-center justify-center">
            <div className="text-muted-foreground/20 text-6xl font-mono">
              {item.type === 'code' ? '</>' : '📄'}
            </div>
          </div>
        )}
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* 2. THE SCANNER (AI Ascription Animation) */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none"
            initial={{ top: '-100%' }}
            animate={{ top: '200%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "linear" }}
          />
        )}
      </AnimatePresence>

      {/* 3. THE HUD (Heads Up Display) */}
      <div className="absolute inset-0 z-20 p-5 flex flex-col justify-between">
        
        {/* Top Bar: Interaction Nodes */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {/* Entropy Badge (p-value) */}
            <div className="px-2 py-1 rounded-full bg-background/50 border border-border backdrop-blur-md text-xs font-mono text-muted-foreground flex items-center gap-1">
              <Zap size={10} className={item.entropyScore > 0.5 ? "text-yellow-400" : "text-blue-400"} />
              p: {item.entropyScore.toFixed(2)}
            </div>
            
            {/* Interaction Potential Badge */}
            <div className="px-2 py-1 rounded-full bg-background/50 border border-border backdrop-blur-md text-xs font-mono text-muted-foreground">
              C: {interactionPotential}
            </div>
            
            {/* AI Tag */}
            {!isScanning && item.ascription?.isMonetizable && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-xs font-bold text-amber-200"
              >
                ASSET
              </motion.div>
            )}
          </div>
          
          <button 
            onClick={handleMore}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            aria-label="More options"
          >
            <MoreVertical size={18} className="text-foreground" />
          </button>
        </div>

        {/* Bottom Bar: Identity & Value */}
        <div className="space-y-3">
          <div>
            <h3 className="text-foreground font-bold text-lg leading-tight line-clamp-2">
              {item.title}
            </h3>
            {item.ascription?.tags && (
              <p className="text-muted-foreground text-sm line-clamp-1">
                {item.ascription.tags.join(' • ')}
              </p>
            )}
            {item.ascription?.suggestedPrice !== undefined && (
              <p className="text-primary text-sm font-bold mt-1">
                ${item.ascription.suggestedPrice.toFixed(2)} {item.ascription.licenseType}
              </p>
            )}
          </div>

          {/* The "Fluid" Action Panel - Expands on Hover */}
          <motion.div 
            className="grid grid-cols-2 gap-2 overflow-hidden"
            animate={{ 
              height: isHovered ? 'auto' : 0, 
              opacity: isHovered ? 1 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Monetize Toggle (The DOS Switch) */}
            <button 
              onClick={handleMonetizeToggle}
              className={`col-span-1 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                isMonetized 
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                  : 'bg-accent text-foreground hover:bg-accent/80'
              }`}
              aria-label={isMonetized ? 'Disable monetization' : 'Enable monetization'}
            >
              <DollarSign size={14} />
              {isMonetized ? 'ACTIVE' : 'MONETIZE'}
            </button>

            {/* Share/Entangle */}
            <button 
              onClick={handleShare}
              className="col-span-1 py-2 rounded-xl bg-accent text-foreground hover:bg-accent/80 flex items-center justify-center gap-2 text-xs font-bold transition-all"
              aria-label="Share item"
            >
              <Share2 size={14} />
              SHARE
            </button>
          </motion.div>
        </div>
      </div>

      {/* 4. THE UDDHAVA "BREATH" (Subtle background pulse) */}
      {/* This mimics the rendering rate tau = 42.3 microseconds (scaled up) */}
      <motion.div
        className="absolute inset-0 z-[-1] bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 pointer-events-none"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
};
