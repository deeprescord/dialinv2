import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Upload, Camera, Video, User, X, Plus, Trash2, Check } from 'lucide-react';
import { useProfile, CustomField } from '@/hooks/useProfile';
import { VideoTrimmer } from './VideoTrimmer';
import { toast } from 'sonner';

export const UserSettings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, uploading, updateProfile, uploadProfileMedia, mediaHistory, selectMediaFromHistory } = useProfile();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    bio: profile?.bio || '',
    full_name_public: profile?.full_name_public || false,
    email_public: profile?.email_public || false,
    phone_public: profile?.phone_public || false,
    address_public: profile?.address_public || false,
    bio_public: profile?.bio_public ?? true,
    profile_media_public: profile?.profile_media_public ?? true,
  });
  
  const [customFields, setCustomFields] = useState<CustomField[]>(profile?.custom_fields || []);
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        full_name_public: profile.full_name_public,
        email_public: profile.email_public,
        phone_public: profile.phone_public,
        address_public: profile.address_public,
        bio_public: profile.bio_public,
        profile_media_public: profile.profile_media_public,
      });
      setCustomFields(profile.custom_fields || []);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const success = await updateProfile({
      ...formData,
      custom_fields: customFields,
    });
    if (success) {
      toast.success('Settings saved successfully');
      // Navigate back to home after successful save
      setTimeout(() => navigate('/'), 1000);
    }
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: '',
      value: '',
      isPublic: false,
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (file.type.startsWith('video/')) {
      // Check video duration (simplified check)
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.duration > 60) {
          setPendingVideoFile(file);
          setShowVideoTrimmer(true);
        } else {
          handleMediaUpload(file, 'video');
        }
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith('image/')) {
      handleMediaUpload(file, 'image');
    } else {
      toast.error('Please select an image or video file');
    }
  };

  const handleMediaUpload = async (file: File, type: 'image' | 'video') => {
    const url = await uploadProfileMedia(file);
    if (url) {
      await updateProfile({
        ...formData,
        profile_media_url: url,
        profile_media_type: type,
      });
    }
  };

  const handleVideoTrimmed = (trimmedFile: File) => {
    setShowVideoTrimmer(false);
    setPendingVideoFile(null);
    handleMediaUpload(trimmedFile, 'video');
  };

  const handleSelectFromHistory = async (mediaUrl: string, mediaType: 'image' | 'video') => {
    await selectMediaFromHistory(mediaUrl, mediaType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-2xl h-full glass-card border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl bg-black/40">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Profile Settings</h3>
              <p className="text-xs text-white/60">Manage your profile information</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-8 w-8 p-0 hover:bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          {/* Profile Media Upload */}
          <div className="space-y-4">
            <Label className="text-white">Profile Picture/Video</Label>
            <div className="flex items-center gap-4">
              {profile?.profile_media_url ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                  {profile.profile_media_type === 'video' ? (
                    <video
                      src={profile.profile_media_url}
                      className="w-full h-full object-cover"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={profile.profile_media_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.profile_media_public}
                    onCheckedChange={(checked) => handleInputChange('profile_media_public', checked)}
                  />
                  <Label className="text-sm text-white">Public</Label>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Previous Profile Pictures Carousel */}
          {mediaHistory.length > 0 && (
            <div className="space-y-4">
              <Label className="text-white">Previous Profile Pictures</Label>
              <Carousel className="w-full">
                <CarouselContent className="-ml-2">
                  {mediaHistory.map((media) => (
                    <CarouselItem key={media.id} className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5">
                      <div 
                        className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-muted"
                        onClick={() => handleSelectFromHistory(media.media_url, media.media_type)}
                      >
                        {media.media_type === 'video' ? (
                          <video
                            src={media.media_url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                          />
                        ) : (
                          <img
                            src={media.media_url}
                            alt="Previous profile"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        {profile?.profile_media_url === media.media_url && (
                          <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Personal Information Fields */}
          <div className="grid gap-4">
            {[
              { key: 'full_name', label: 'Full Name', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Phone', type: 'tel' },
              { key: 'address', label: 'Address', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key} className="grid grid-cols-1 gap-2">
                <Label htmlFor={key} className="text-white">{label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={key}
                    type={type}
                    value={formData[key as keyof typeof formData] as string}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData[`${key}_public` as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => handleInputChange(`${key}_public`, checked)}
                    />
                    <Label className="text-sm text-white">Public</Label>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Bio Field */}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <div className="flex items-start gap-2">
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={formData.bio_public}
                    onCheckedChange={(checked) => handleInputChange('bio_public', checked)}
                  />
                  <Label className="text-sm text-white">Public</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold text-white">Custom Fields</Label>
              <Button
                onClick={addCustomField}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </Button>
            </div>

            {customFields.length === 0 ? (
              <p className="text-sm text-white/60">No custom fields yet. Click "Add Field" to create one.</p>
            ) : (
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-start gap-2 p-3 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Field label"
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                        className="font-medium bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-blue-500"
                      />
                      <Input
                        placeholder="Field value"
                        value={field.value}
                        onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.isPublic}
                          onCheckedChange={(checked) => updateCustomField(field.id, { isPublic: checked })}
                        />
                        <Label className="text-sm text-white">Public</Label>
                      </div>
                      <Button
                        onClick={() => removeCustomField(field.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-white/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Video Trimmer Modal */}
      {showVideoTrimmer && pendingVideoFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card border border-white/10 rounded-xl backdrop-blur-xl bg-black/40 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Trim Video</h2>
              <Button
                onClick={() => {
                  setShowVideoTrimmer(false);
                  setPendingVideoFile(null);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <VideoTrimmer
              videoFile={pendingVideoFile}
              onTrimmed={handleVideoTrimmed}
              onCancel={() => {
                setShowVideoTrimmer(false);
                setPendingVideoFile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};