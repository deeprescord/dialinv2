import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { User, GitBranch, DollarSign, Zap, TrendingUp } from 'lucide-react';

interface InfluenceStats {
  user_id: string;
  total_branches_active: number;
  unique_holders_count: number;
  total_lifetime_harvest: number;
  pending_harvest: number;
  last_updated: string;
}

interface TreeGeneration {
  generation_depth: number;
  pointer_count: number;
  revenue_generated: number;
}

interface HoloProfileProps {
  userId: string;
}

export const HoloProfile: React.FC<HoloProfileProps> = ({ userId }) => {
  const [stats, setStats] = useState<InfluenceStats | null>(null);
  const [treeData, setTreeData] = useState<TreeGeneration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHolographicData();
  }, [userId]);

  const fetchHolographicData = async () => {
    try {
      setLoading(true);

      // 1. Fetch High-Level Stats
      const { data: statData, error: statsError } = await supabase
        .from('influence_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsError) {
        console.error('Error fetching influence stats:', statsError);
      }

      setStats(statData);

      // 2. Fetch the Tree Structure (RPC Call)
      const { data: tree, error: treeError } = await supabase.rpc('get_influence_tree', { 
        _user_id: userId 
      });

      if (treeError) {
        console.error('Error fetching influence tree:', treeError);
      }

      setTreeData(tree || []);
    } catch (error) {
      console.error('Error in fetchHolographicData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-foreground animate-pulse">Aligning Phase...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">No influence data available</div>
      </div>
    );
  }

  // Calculate average entropy from tree data
  const totalPointers = treeData.reduce((sum, gen) => sum + gen.pointer_count, 0);
  const averageDepth = totalPointers > 0 
    ? treeData.reduce((sum, gen) => sum + (gen.generation_depth * gen.pointer_count), 0) / totalPointers
    : 0;
  const normalizedEntropy = Math.min(averageDepth / 10, 1); // Normalize to 0-1

  return (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center p-10 relative overflow-hidden">
      
      {/* BACKGROUND: The Quantum Field */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0 pointer-events-none" />

      {/* 1. THE CORE (User Self) */}
      <div className="z-10 relative">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: 'spring', stiffness: 100 }}
          className="w-32 h-32 rounded-full border-4 border-amber-500/50 shadow-[0_0_50px_hsl(var(--primary)_/_0.4)] flex items-center justify-center bg-background"
        >
          <User size={48} className="text-foreground/80" />
        </motion.div>
        
        {/* Orbital Ring 1: The First Generation */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-border border-dashed"
        />
        
        {/* Orbital Ring 2: The Ripple */}
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-border/50"
        />
      </div>

      {/* 2. THE METRICS (Floating HUD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 z-20 w-full max-w-4xl">
        
        {/* Card 1: REACH (Branches) */}
        <MetricCard 
          icon={<GitBranch className="text-cyan-400" />}
          label="Active Branches"
          value={stats.total_branches_active.toString()}
          subtext="Across N=3 Reality"
          accentColor="cyan"
        />

        {/* Card 2: AMPLITUDE (Revenue) */}
        <MetricCard 
          icon={<DollarSign className="text-amber-400" />}
          label="Spectral Harvest"
          value={`$${Number(stats.total_lifetime_harvest).toFixed(2)}`}
          subtext="Flowing to Source"
          accentColor="amber"
        />

        {/* Card 3: HARMONY (Entropy) */}
        <MetricCard 
          icon={<Zap className="text-violet-400" />}
          label="Resonance (p)"
          value={normalizedEntropy.toFixed(2)}
          subtext="Optimal Flow State"
          accentColor="violet"
        />
      </div>

      {/* 3. THE TREE VISUALIZATION (Generation Breakdown) */}
      {treeData.length > 0 && (
        <div className="mt-12 z-20 w-full max-w-4xl">
          <h3 className="text-foreground text-xl font-bold mb-4 text-center">Influence Generations</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {treeData.slice(0, 5).map((gen) => (
              <motion.div
                key={gen.generation_depth}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gen.generation_depth * 0.1 }}
                className="p-4 rounded-xl bg-accent/50 border border-border backdrop-blur-md text-center"
              >
                <div className="text-2xl font-bold text-primary mb-1">
                  Gen {gen.generation_depth}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp size={12} />
                  {gen.pointer_count} pointers
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${Number(gen.revenue_generated).toFixed(2)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Glass Card
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  accentColor: 'cyan' | 'amber' | 'violet';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subtext, accentColor }) => {
  const colorClasses = {
    cyan: 'hover:border-cyan-500/50 bg-cyan-500/10',
    amber: 'hover:border-amber-500/50 bg-amber-500/10',
    violet: 'hover:border-violet-500/50 bg-violet-500/10'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-2xl bg-card/50 border border-border backdrop-blur-md flex flex-col items-center text-center ${colorClasses[accentColor]} transition-colors`}
    >
      <div className={`p-3 rounded-full mb-3 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-foreground font-mono">{value}</h3>
      <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold mt-1">{label}</p>
      <p className="text-muted-foreground/50 text-xs mt-2">{subtext}</p>
    </motion.div>
  );
};
