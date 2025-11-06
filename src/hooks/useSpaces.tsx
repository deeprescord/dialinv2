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
  thumb?: string; // Alias for thumbnail_url for backwards compatibility
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
  isHome?: boolean; // Alias for is_home for backwards compatibility
  is_public?: boolean;
  share_slug?: string | null;
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
        // Create home space with town square background and 360 enabled
        const { data: newHome, error } = await supabase
          .from('spaces')
          .insert({
            user_id: user.id,
            name: 'Home',
            is_home: true,
            cover_url: '/media/default-home-bg.mp4',
            thumbnail_url: '/media/default-home-bg.mp4',
            show_360: true,
            x_axis_offset: 0,
            y_axis_offset: 0,
            volume: 50,
            is_muted: true,
            rotation_enabled: false,
            rotation_speed: 1,
            rotation_axis: 'x',
            flip_horizontal: false,
            flip_vertical: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating home space:', error);
          return;
        }

        // Migrate localStorage lobby settings if they exist (but keep default if not)
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

      // Map database fields to component-friendly aliases
      const mappedSpaces = (data || []).map(space => ({
        ...space,
        thumb: space.thumbnail_url || '/lovable-uploads/d39f3d3e-93c9-409f-b7e7-7f358aac18f6.png',
        isHome: space.is_home
      }));

      setSpaces(mappedSpaces);
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

  const makePublic = async (id: string): Promise<string | null> => {
    try {
      const space = spaces.find(s => s.id === id);
      if (!space) {
        toast.error('Space not found');
        return null;
      }

      // Generate share slug if it doesn't exist
      let shareSlug = space.share_slug;
      if (!shareSlug) {
        const { data, error } = await supabase.rpc('generate_share_slug', { 
          space_name: space.name 
        });

        if (error) {
          console.error('Error generating share slug:', error);
          toast.error('Failed to generate share link');
          return null;
        }

        shareSlug = data;
      }

      // Update space to be public with share slug
      const { error } = await supabase
        .from('spaces')
        .update({ 
          is_public: true, 
          share_slug: shareSlug 
        })
        .eq('id', id);

      if (error) {
        console.error('Error making space public:', error);
        toast.error('Failed to make space public');
        return null;
      }

      setSpaces(prev => prev.map(s => 
        s.id === id ? { ...s, is_public: true, share_slug: shareSlug } : s
      ));

      const shareUrl = `${window.location.origin}/s/${shareSlug}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
      
      return shareUrl;
    } catch (error) {
      console.error('Error making space public:', error);
      toast.error('Failed to make space public');
      return null;
    }
  };

  const makePrivate = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ is_public: false })
        .eq('id', id);

      if (error) {
        console.error('Error making space private:', error);
        toast.error('Failed to make space private');
        return false;
      }

      setSpaces(prev => prev.map(s => 
        s.id === id ? { ...s, is_public: false } : s
      ));

      toast.success('Space is now private');
      return true;
    } catch (error) {
      console.error('Error making space private:', error);
      toast.error('Failed to make space private');
      return false;
    }
  };

  const updateSpace = async (id: string, updates: Partial<Pick<Space, 'name' | 'description' | 'cover_url' | 'thumbnail_url' | 'show_360' | 'x_axis_offset' | 'y_axis_offset' | 'volume' | 'is_muted' | 'rotation_enabled' | 'rotation_speed' | 'rotation_axis' | 'flip_horizontal' | 'flip_vertical' | 'is_home' | 'is_public'>>, options?: { silent?: boolean }): Promise<boolean> => {
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
    makePublic,
    makePrivate,
    refetch: fetchSpaces,
  };
}