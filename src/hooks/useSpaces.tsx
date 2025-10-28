import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Space {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  cover_url?: string | null;
  thumbnail_url?: string | null;
  show_360?: boolean;
  x_axis_offset?: number;
  y_axis_offset?: number;
  volume?: number;
  is_muted?: boolean;
  rotation_enabled?: boolean;
  rotation_speed?: number;
  rotation_axis?: string;
  flip_horizontal?: boolean;
  flip_vertical?: boolean;
  is_home?: boolean;
  created_at: string;
  updated_at: string;
}

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureHomeSpaceExists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if home space exists
      const { data: existingHome } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_home', true)
        .maybeSingle();

      if (!existingHome) {
        // Create home space
        const { data: newHome, error } = await supabase
          .from('spaces')
          .insert({
            user_id: user.id,
            name: 'Home',
            is_home: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating home space:', error);
          return;
        }

        // Migrate localStorage lobby settings if they exist
        const lobbyThumbnail = localStorage.getItem('lobby-thumbnail');
        const lobbyBackground = localStorage.getItem('lobby-background');
        
        if (lobbyThumbnail || lobbyBackground) {
          const updates: any = {};
          if (lobbyThumbnail) updates.thumbnail_url = lobbyThumbnail;
          if (lobbyBackground) updates.cover_url = lobbyBackground;
          
          await supabase
            .from('spaces')
            .update(updates)
            .eq('id', newHome.id);
          
          // Clear localStorage
          localStorage.removeItem('lobby-thumbnail');
          localStorage.removeItem('lobby-background');
        }
      }
    } catch (error) {
      console.error('Error ensuring home space exists:', error);
    }
  };

  const fetchSpaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure home space exists
      await ensureHomeSpaceExists();

      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', user.id)
        .order('is_home', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching spaces:', error);
        toast.error('Failed to load spaces');
        return;
      }

      setSpaces(data || []);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast.error('Failed to load spaces');
    } finally {
      setLoading(false);
    }
  };

  const createSpace = async (name: string, description?: string, parentId?: string): Promise<Space | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create spaces');
        return null;
      }

      const { data, error } = await supabase
        .from('spaces')
        .insert({
          user_id: user.id,
          name,
          description,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating space:', error);
        toast.error('Failed to create space');
        return null;
      }

      setSpaces(prev => [data, ...prev]);
      toast.success(`Space "${name}" created successfully`);
      return data;
    } catch (error) {
      console.error('Error creating space:', error);
      toast.error('Failed to create space');
      return null;
    }
  };

  const updateSpace = async (id: string, updates: Partial<Pick<Space, 'name' | 'description' | 'cover_url' | 'thumbnail_url' | 'show_360' | 'x_axis_offset' | 'y_axis_offset' | 'volume' | 'is_muted' | 'rotation_enabled' | 'rotation_speed' | 'rotation_axis' | 'flip_horizontal' | 'flip_vertical' | 'is_home'>>, options?: { silent?: boolean }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating space:', error);
        toast.error('Failed to update space');
        return false;
      }

      setSpaces(prev => prev.map(space => 
        space.id === id ? { ...space, ...updates } : space
      ));
      if (!options?.silent) {
        toast.success('Space updated successfully');
      }
      return true;
    } catch (error) {
      console.error('Error updating space:', error);
      toast.error('Failed to update space');
      return false;
    }
  };
  const deleteSpace = async (id: string): Promise<boolean> => {
    try {
      // Prevent deletion of home space
      const spaceToDelete = spaces.find(s => s.id === id);
      if (spaceToDelete?.is_home) {
        toast.error('Cannot delete the Home space');
        return false;
      }

      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting space:', error);
        toast.error('Failed to delete space');
        return false;
      }

      setSpaces(prev => prev.filter(space => space.id !== id));
      toast.success('Space deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting space:', error);
      toast.error('Failed to delete space');
      return false;
    }
  };

  useEffect(() => {
    fetchSpaces();
    
    // Realtime subscription for spaces changes
    const spacesChannel = supabase
      .channel('user-spaces')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spaces' },
        () => {
          fetchSpaces();
        }
      )
      .subscribe();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSpaces();
      } else {
        setSpaces([]);
      }
    });
    
    return () => {
      supabase.removeChannel(spacesChannel);
      subscription.unsubscribe();
    };
  }, []);
  return {
    spaces,
    loading,
    createSpace,
    updateSpace,
    deleteSpace,
    refetch: fetchSpaces,
  };
}