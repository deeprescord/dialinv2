import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type InteractionRole = 'artist' | 'viewer' | 'creator';

interface RoleConfig {
  role: InteractionRole;
  pValue: number;
  interactionPotential: number;
}

// UIP-based p-values for each role
const ROLE_P_VALUES: Record<InteractionRole, number> = {
  artist: 0.95,   // High certainty, low interaction potential
  viewer: 0.5,    // Maximum interaction potential p(1-p) = 0.25
  creator: 0.7,   // Dynamic, leaning toward creation
};

export function useInteractionRole() {
  const [roleConfig, setRoleConfig] = useState<RoleConfig>({
    role: 'viewer',
    pValue: 0.5,
    interactionPotential: 0.25,
  });
  const [loading, setLoading] = useState(true);

  const calculateInteractionPotential = (p: number): number => {
    return p * (1 - p);
  };

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching role:', error);
      }

      const role = (data?.role as InteractionRole) || 'viewer';
      const pValue = ROLE_P_VALUES[role];
      
      setRoleConfig({
        role,
        pValue,
        interactionPotential: calculateInteractionPotential(pValue),
      });
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    } finally {
      setLoading(false);
    }
  };

  const setUserRole = async (newRole: InteractionRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: newRole,
        });

      if (error) throw error;

      const pValue = ROLE_P_VALUES[newRole];
      setRoleConfig({
        role: newRole,
        pValue,
        interactionPotential: calculateInteractionPotential(pValue),
      });
    } catch (error) {
      console.error('Error setting role:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for role changes
  useEffect(() => {
    const channel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        () => {
          fetchUserRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...roleConfig,
    loading,
    setUserRole,
    refetch: fetchUserRole,
  };
}
