import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomDial {
  id: string;
  dial_name: string;
  dial_language: string;
  content_type: string;
  usage_count: number;
  created_at: string;
}

export function useCustomDials(contentType?: string) {
  const [customDials, setCustomDials] = useState<CustomDial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchCustomDials = async () => {
    if (!contentType) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_dials')
        .select('*')
        .eq('content_type', contentType)
        .order('usage_count', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCustomDials(data || []);
    } catch (error: any) {
      console.error('Error fetching custom dials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load custom dials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomDial = async (dialName: string, language: string = 'en') => {
    if (!contentType) return null;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      // Check if dial already exists
      const { data: existing } = await supabase
        .from('custom_dials')
        .select('*')
        .eq('normalized_name', dialName.toLowerCase().trim())
        .eq('content_type', contentType)
        .maybeSingle();

      if (existing) {
        // Increment usage count
        const { data: updated, error } = await supabase
          .from('custom_dials')
          .update({ usage_count: existing.usage_count + 1 })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      }

      // Create new dial
      const { data: newDial, error } = await supabase
        .from('custom_dials')
        .insert({
          user_id: session.session.user.id,
          dial_name: dialName,
          dial_language: language,
          content_type: contentType,
          usage_count: 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Custom dial created',
        description: `"${dialName}" is now available for filtering`,
      });

      // Refresh list
      await fetchCustomDials();

      return newDial;
    } catch (error: any) {
      console.error('Error creating custom dial:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create custom dial',
        variant: 'destructive',
      });
      return null;
    }
  };

  const addCustomDialToFile = async (fileId: string, dialId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('custom_dial_values')
        .insert({
          file_id: fileId,
          custom_dial_id: dialId,
          user_id: session.session.user.id,
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Error adding custom dial to file:', error);
      return false;
    }
  };

  const getFileCustomDials = async (fileId: string) => {
    try {
      const { data, error } = await supabase
        .from('custom_dial_values')
        .select('custom_dial_id, custom_dials(dial_name, id)')
        .eq('file_id', fileId);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.custom_dials.id,
        name: item.custom_dials.dial_name,
      }));
    } catch (error: any) {
      console.error('Error fetching file custom dials:', error);
      return [];
    }
  };

  const getTrendingDials = async (days: number = 7, limit: number = 10) => {
    if (!contentType) return [];

    try {
      const { data, error } = await supabase.rpc('get_trending_dials', {
        p_content_type: contentType,
        p_days: days,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching trending dials:', error);
      return [];
    }
  };

  useEffect(() => {
    if (contentType) {
      fetchCustomDials();
    }
  }, [contentType]);

  return {
    customDials,
    isLoading,
    createCustomDial,
    addCustomDialToFile,
    getFileCustomDials,
    getTrendingDials,
    refreshDials: fetchCustomDials,
  };
}
