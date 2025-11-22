import { motion } from 'framer-motion';
import { File, Image, Video, Music, FileText } from 'lucide-react';
import type { Item } from '@/hooks/useItems';

interface LensCardProps {
  item: Item;
  index: number;
}

export function LensCard({ item, index }: LensCardProps) {
  const getFileIcon = () => {
    if (!item.mime_type) return <File className="w-8 h-8" />;
    
    if (item.mime_type.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (item.mime_type.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (item.mime_type.startsWith('audio/')) return <Music className="w-8 h-8" />;
    if (item.mime_type.includes('text') || item.mime_type.includes('pdf')) return <FileText className="w-8 h-8" />;
    
    return <File className="w-8 h-8" />;
  };

  const getPreviewUrl = () => {
    if (item.mime_type?.startsWith('image/') && item.file_url) {
      // Construct proper Supabase storage URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Remove any bucket prefix from file_url if present
      const cleanPath = item.file_url.replace(/^user_files\//, '');
      return `${supabaseUrl}/storage/v1/object/public/user_files/${cleanPath}`;
    }
    return null;
  };

  const entropyScore = item.uip_metrics?.entropy_score || Math.random();
  const previewUrl = getPreviewUrl();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="glass-card rounded-xl overflow-hidden border border-border/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
    >
      {/* Image Preview or Icon */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt={item.original_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-primary/60">
            {getFileIcon()}
          </div>
        )}
        
        {/* Entropy Badge */}
        <div className="absolute top-3 right-3 glass px-3 py-1 rounded-full border border-primary/30">
          <span className="text-xs font-mono text-primary">
            E: {entropyScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate mb-1">
          {item.original_name}
        </h3>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {item.file_type}
        </p>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      </div>
    </motion.div>
  );
}
