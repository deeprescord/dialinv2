import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isPublic: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profile_media_url?: string;
  profile_media_type?: 'image' | 'video' | null;
  full_name_public: boolean;
  email_public: boolean;
  phone_public: boolean;
  address_public: boolean;
  bio_public: boolean;
  profile_media_public: boolean;
  custom_fields?: CustomField[];
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        const profileData: Profile = {
          ...data,
          profile_media_type: data.profile_media_type as 'image' | 'video' | null,
          custom_fields: Array.isArray(data.custom_fields) ? (data.custom_fields as unknown as CustomField[]) : []
        };
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return false;
      }

      // Prepare the updates with proper typing
      const updateData: any = {
        user_id: user.id,
        ...updates,
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return false;
      }

      if (data) {
        const profileData: Profile = {
          ...data,
          profile_media_type: data.profile_media_type as 'image' | 'video' | null,
          custom_fields: Array.isArray(data.custom_fields) ? (data.custom_fields as unknown as CustomField[]) : []
        };
        setProfile(profileData);
      }
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
      return false;
    }
  };

  const uploadProfileMedia = async (file: File): Promise<string | null> => {
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload media');
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-media')
        .getPublicUrl(uploadData.path);

      return data.publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    uploading,
    updateProfile,
    uploadProfileMedia,
    refetch: fetchProfile,
  };
}