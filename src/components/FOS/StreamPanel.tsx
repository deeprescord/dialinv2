import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface StreamPanelProps {
  floating?: boolean;
}

export function StreamPanel({ floating = false }: StreamPanelProps) {
  return (
    <motion.aside 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`w-80 border-l border-border/20 p-4 overflow-auto h-full ${floating ? 'glass-card bg-background/40 backdrop-blur-xl' : 'glass'}`}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Stream
        </h2>
        <p className="text-sm text-muted-foreground">Field activity</p>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-4 rounded-lg border border-border/20">
          <p className="text-sm text-muted-foreground">
            Stream events will appear here
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
