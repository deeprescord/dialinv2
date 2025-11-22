import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { HoloProfile } from '@/components/DialinPortal/HoloProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function HoloProfileDemo() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        toast.error('Please sign in to view your holographic profile');
        navigate('/');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!userId) return;
    
    try {
      toast.loading('Recalculating influence metrics...');
      
      // Call the refresh function
      const { error } = await supabase.rpc('refresh_user_influence', {
        _user_id: userId
      });

      if (error) {
        console.error('Refresh error:', error);
        toast.error('Failed to refresh influence stats');
      } else {
        toast.success('Influence metrics updated!');
        // Force HoloProfile to re-fetch
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Holographic Profile - UIP Influence Visualization</title>
        <meta 
          name="description" 
          content="View your Universal Interaction Potential influence metrics and pointer tree visualization" 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Back to Portal
            </Button>

            <h1 className="text-xl font-bold text-foreground hidden md:block">
              Holographic Profile
            </h1>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw size={16} />
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="container px-4 py-8">
          <div className="mb-8 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Influence in the UIP Framework
            </h2>
            <p className="text-muted-foreground">
              Track how your content spreads through the network via pointer generations, 
              see your total reach, and monitor revenue flowing back to the source. 
              The holographic visualization shows your amplitude in the system.
            </p>
          </div>

          {/* HoloProfile Component */}
          <div className="w-full" style={{ minHeight: '800px' }}>
            <HoloProfile key={refreshKey} userId={userId} />
          </div>

          {/* Information Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">Active Branches</h3>
              <p className="text-sm text-muted-foreground">
                Total number of pointers in your influence tree across all generations. 
                Each branch represents someone holding a copy of your content.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">Spectral Harvest</h3>
              <p className="text-sm text-muted-foreground">
                Total revenue generated through smart contracts attached to your content. 
                This is the economic energy flowing back to you as the source.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">Resonance (p)</h3>
              <p className="text-sm text-muted-foreground">
                Your entropy balance in the system. Values near 0.5 indicate optimal 
                interaction potential - the sweet spot between order and chaos.
              </p>
            </div>
          </div>

          {/* Generation Breakdown Explanation */}
          <div className="mt-8 max-w-3xl mx-auto p-6 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">Understanding Generations</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Generation 1:</strong> Direct shares of your content. 
                People who created pointers to your items in their spaces.
              </p>
              <p>
                <strong className="text-foreground">Generation 2:</strong> Shares of shares. 
                People who created pointers to Gen 1 pointers, creating a recursive tree.
              </p>
              <p>
                <strong className="text-foreground">Generation 3+:</strong> The ripple continues. 
                Each generation shows how far your content has spread through the network.
              </p>
              <p className="text-xs mt-4 text-muted-foreground/70">
                Revenue shown includes all transactions from smart contracts attached to pointers at each generation level.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
