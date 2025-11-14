import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type InteractionRole = 'artist' | 'viewer' | 'creator';

// UIP p-values for each role
const ROLE_P_VALUES: Record<InteractionRole, number> = {
  artist: 0.95,    // High certainty, low interaction potential
  viewer: 0.5,     // Maximum interaction potential
  creator: 0.7,    // Balanced
};

export function useInteractionRole() {
  const [role, setRole] = useState<InteractionRole>('viewer');
  const [pValue, setPValue] = useState(0.5);
  const [interactionPotential, setInteractionPotential] = useState(0.25);
  const [loading, setLoading] = useState(true);

  // Calculate interaction potential: p(1-p)
  const calculatePotential = (p: number) => p * (1 - p);

  useEffect(() => {
    loadUserRole();

    // Subscribe to role changes
    const channel = supabase
      .channel('user_role_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        () => loadUserRole()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading role:', error);
        setLoading(false);
        return;
      }

      const userRole = (data?.role as InteractionRole) || 'viewer';
      const p = ROLE_P_VALUES[userRole];
      
      setRole(userRole);
      setPValue(p);
      setInteractionPotential(calculatePotential(p));
      setLoading(false);
    } catch (error) {
      console.error('Error in loadUserRole:', error);
      setLoading(false);
    }
  };

  const updateRole = async (newRole: InteractionRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: newRole,
        });

      if (error) throw error;

      const p = ROLE_P_VALUES[newRole];
      setRole(newRole);
      setPValue(p);
      setInteractionPotential(calculatePotential(p));
      
      toast.success(`Role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  return {
    role,
    pValue,
    interactionPotential,
    loading,
    updateRole,
  };
}
