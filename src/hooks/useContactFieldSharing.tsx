import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from './useProfile';

// Helper to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export interface ProfileFieldToggle {
  key: string;
  label: string;
  value: string;
  isPublic: boolean;
  icon: string;
  color: string;
}

export function useContactFieldSharing(contactUserId?: string) {
  const { profile } = useProfile();
  const [sharedFields, setSharedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Map profile fields to toggle format
  const getProfileFieldToggles = (): ProfileFieldToggle[] => {
    if (!profile) return [];

    const toggles: ProfileFieldToggle[] = [];
    const iconMap: Record<string, string> = {
      full_name: 'User',
      email: 'Mail',
      phone: 'Smartphone',
      address: 'Home',
      bio: 'FileText',
    };

    const colorMap: Record<string, string> = {
      full_name: 'bg-blue-500',
      email: 'bg-violet-500',
      phone: 'bg-emerald-500',
      address: 'bg-orange-500',
      bio: 'bg-indigo-500',
    };

    // Standard fields
    const standardFields = [
      { key: 'full_name', label: 'Name', value: profile.full_name || '', isPublic: profile.full_name_public },
      { key: 'email', label: 'Email', value: profile.email || '', isPublic: profile.email_public },
      { key: 'phone', label: 'Phone', value: profile.phone || '', isPublic: profile.phone_public },
      { key: 'address', label: 'Address', value: profile.address || '', isPublic: profile.address_public },
      { key: 'bio', label: 'Bio', value: profile.bio || '', isPublic: profile.bio_public },
    ];

    standardFields.forEach(field => {
      if (field.value) {
        toggles.push({
          key: field.key,
          label: field.label,
          value: field.value,
          isPublic: field.isPublic,
          icon: iconMap[field.key] || 'FileText',
          color: colorMap[field.key] || 'bg-gray-500',
        });
      }
    });

    // Custom fields
    if (profile.custom_fields && Array.isArray(profile.custom_fields)) {
      profile.custom_fields.forEach((customField: any, index: number) => {
        if (customField.value) {
          toggles.push({
            key: `custom_${customField.id}`,
            label: customField.label,
            value: customField.value,
            isPublic: customField.isPublic,
            icon: 'FileText',
            color: `bg-${['pink', 'teal', 'yellow', 'red', 'purple'][index % 5]}-500`,
          });
        }
      });
    }

    return toggles;
  };

  // Fetch shared fields for a specific contact
  const fetchSharedFields = async () => {
    if (!contactUserId) {
      setLoading(false);
      return;
    }

    // Skip if contact ID is not a valid UUID (e.g., mock data)
    if (!isValidUUID(contactUserId)) {
      console.log('Skipping field sharing fetch - invalid UUID:', contactUserId);
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contact_field_shares')
        .select('field_name')
        .eq('user_id', user.id)
        .eq('contact_user_id', contactUserId);

      if (error) {
        console.error('Error fetching shared fields:', error);
        return;
      }

      setSharedFields(data?.map(d => d.field_name) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle field sharing with a contact
  const toggleFieldShare = async (fieldName: string) => {
    if (!contactUserId) {
      toast.error('No contact selected');
      return;
    }

    // Skip if contact ID is not a valid UUID (e.g., mock data)
    if (!isValidUUID(contactUserId)) {
      toast.error('Cannot share with mock contacts. This feature works with real user contacts only.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const isCurrentlyShared = sharedFields.includes(fieldName);

      if (isCurrentlyShared) {
        // Remove sharing
        const { error } = await supabase
          .from('contact_field_shares')
          .delete()
          .eq('user_id', user.id)
          .eq('contact_user_id', contactUserId)
          .eq('field_name', fieldName);

        if (error) {
          console.error('Error removing field share:', error);
          toast.error('Failed to update sharing');
          return;
        }

        setSharedFields(prev => prev.filter(f => f !== fieldName));
      } else {
        // Add sharing
        const { error } = await supabase
          .from('contact_field_shares')
          .insert({
            user_id: user.id,
            contact_user_id: contactUserId,
            field_name: fieldName,
          });

        if (error) {
          console.error('Error adding field share:', error);
          toast.error('Failed to update sharing');
          return;
        }

        setSharedFields(prev => [...prev, fieldName]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
  };

  useEffect(() => {
    if (contactUserId) {
      fetchSharedFields();
    }
  }, [contactUserId]);

  const profileToggles = getProfileFieldToggles();
  
  // Public fields + shared private fields
  const visibleFields = profileToggles.filter(
    toggle => toggle.isPublic || sharedFields.includes(toggle.key)
  );

  // Private fields that can be toggled
  const toggleableFields = profileToggles.filter(toggle => !toggle.isPublic);

  return {
    profileToggles,
    visibleFields,
    toggleableFields,
    sharedFields,
    loading,
    toggleFieldShare,
  };
}
