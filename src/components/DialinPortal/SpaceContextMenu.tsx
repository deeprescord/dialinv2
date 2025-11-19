import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Trash2, Edit3, GripVertical, X, Globe, MessageSquare, ChevronDown, ChevronUp, Volume2, VolumeX, Image, Upload, Sparkles, Video, ImageIcon, Settings, Play, Link, Unlink, BarChart3, CheckSquare } from 'lucide-react';
import { useSelection } from '@/contexts/SelectionContext';
import { MediaCarousel } from './MediaCarousel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GradientLoader } from './GradientLoader';
import { Space } from '@/data/catalogs';
import { Settings360Modal } from './Settings360Modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SpaceContextMenuProps {
  space: Space;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (spaceId: string) => void;
  onRename: (spaceId: string, newName: string) => void;
  onUpdateDescription: (spaceId: string, newDescription: string) => void;
  onUpdateThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorder: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  on360RotationToggle?: (spaceId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (spaceId: string, speed: number) => void;
  on360RotationAxisChange?: (spaceId: string, axis: 'x' | 'y') => void;
  onFlipHorizontalToggle?: (spaceId: string, flipped: boolean) => void;
  onFlipVerticalToggle?: (spaceId: string, flipped: boolean) => void;
  onToggleDOSPanel?: () => void;
  position: { x: number; y: number };
}

export function SpaceContextMenu({
  space,
  isOpen,
  onClose,
  onDelete,
  onRename,
  onUpdateDescription,
  onUpdateThumbnail,
  onReorder,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  on360RotationToggle,
  on360RotationSpeedChange,
  on360RotationAxisChange,
  onFlipHorizontalToggle,
  onFlipVerticalToggle,
  onToggleDOSPanel,
  position
}: SpaceContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newName, setNewName] = useState(space.name);
  const [newDescription, setNewDescription] = useState(space.description || 'Welcome back');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [show360Advanced, setShow360Advanced] = useState(true);
  const [xAxis, setXAxis] = useState(space.xAxis || 0);
  const [yAxis, setYAxis] = useState(space.yAxis || 0);
  const [volume, setVolume] = useState(space.volume || 50);
  const [isMuted, setIsMuted] = useState(space.isMuted !== undefined ? space.isMuted : true);
  const [rotationEnabled, setRotationEnabled] = useState(space.rotationEnabled || false);
  const [rotationSpeed, setRotationSpeed] = useState(space.rotationSpeed || 1);
  const [showCoverOptions, setShowCoverOptions] = useState(false);
  const [uploadedThumbnails, setUploadedThumbnails] = useState<string[]>([]);
  const [thumbnailMediaTypes, setThumbnailMediaTypes] = useState<('image' | 'video')[]>([]);
  const [uploadedBackgrounds, setUploadedBackgrounds] = useState<string[]>([]);
  const [backgroundMediaTypes, setBackgroundMediaTypes] = useState<('image' | 'video')[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const { toggleSelectMode, addToSelection, isSelectMode } = useSelection();
  const [isGenerating, setIsGenerating] = useState(false);
  const [is360Mode, setIs360Mode] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showAIControls, setShowAIControls] = useState(false);
  const [syncThumbnailBackground, setSyncThumbnailBackground] = useState(false);
  const [show360Settings, setShow360Settings] = useState(false);
  const [showPlayAllButton, setShowPlayAllButton] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'dials'>('settings');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [computedPos, setComputedPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // Fetch show_play_all_button setting when menu opens
  useEffect(() => {
    console.log('SpaceContextMenu: Fetch play all setting effect', { isOpen, spaceId: space.id });
    if (isOpen) {
      const fetchPlayAllSetting = async () => {
        try {
          console.log('SpaceContextMenu: Fetching play all setting for space', space.id);
          const { data, error } = await supabase
            .from('spaces')
            .select('show_play_all_button')
            .eq('id', space.id)
            .maybeSingle();
          
          console.log('SpaceContextMenu: Fetch result', { data, error });
          if (data && !error) {
            setShowPlayAllButton(data.show_play_all_button || false);
          }
        } catch (error) {
          console.error('Error fetching play all setting:', error);
        }
      };
      fetchPlayAllSetting();
    }
  }, [isOpen, space.id]);

  useEffect(() => {
    if (!isOpen) return;
    const margin = 10;
    const menuWidth = 400; // w-[400px]
    const maxHeight = Math.round(window.innerHeight * 0.85);
    const calc = () => {
      const left = Math.min(position.x, window.innerWidth - menuWidth - margin);
      // Calculate top to keep panel above the space bar (raise it even higher)
      let top = position.y - 650; // Increased from 500 to 650
      const height = Math.min(menuRef.current?.offsetHeight || maxHeight, maxHeight);
      top = Math.min(Math.max(margin, top), window.innerHeight - margin - height);
      setComputedPos({ left, top });
    };
    calc();
    const onResize = () => calc();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, position]);

  // Sync local state with space prop changes
  useEffect(() => {
    setXAxis(space.xAxis || 0);
    setYAxis(space.yAxis || 0);
    setVolume(space.volume || 50);
    setIsMuted(space.isMuted !== undefined ? space.isMuted : true);
    setRotationEnabled(space.rotationEnabled || false);
    setRotationSpeed(space.rotationSpeed || 1);
  }, [space.xAxis, space.yAxis, space.volume, space.isMuted, space.rotationEnabled, space.rotationSpeed]);

  // Load user's uploaded media from storage so carousel persists across openings
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Load thumbnails
        const { data: thumbData } = await supabase.storage
          .from('space-covers')
          .list(`${user.id}/thumbnails`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        
        const thumbUrls: string[] = [];
        const thumbTypes: ('image' | 'video')[] = [];
        (thumbData || []).forEach((item) => {
          const { data: pub } = supabase.storage
            .from('space-covers')
            .getPublicUrl(`${user.id}/thumbnails/${item.name}`);
          thumbUrls.push(pub.publicUrl);
          const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(item.name);
          thumbTypes.push(isVideo ? 'video' : 'image');
        });
        setUploadedThumbnails(thumbUrls);
        setThumbnailMediaTypes(thumbTypes);

        // Load backgrounds
        const { data: bgData } = await supabase.storage
          .from('space-covers')
          .list(`${user.id}/backgrounds`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        
        const bgUrls: string[] = [];
        const bgTypes: ('image' | 'video')[] = [];
        (bgData || []).forEach((item) => {
          const { data: pub } = supabase.storage
            .from('space-covers')
            .getPublicUrl(`${user.id}/backgrounds/${item.name}`);
          bgUrls.push(pub.publicUrl);
          const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(item.name);
          bgTypes.push(isVideo ? 'video' : 'image');
        });
        setUploadedBackgrounds(bgUrls);
        setBackgroundMediaTypes(bgTypes);
      } catch (err) {
        console.error('Error loading uploaded media:', err);
      }
    };
    load();
  }, [isOpen]);

  const handleRename = () => {
    if (newName.trim() && newName !== space.name) {
      onRename(space.id, newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleDescriptionUpdate = () => {
    if (newDescription.trim() && newDescription !== space.description) {
      onUpdateDescription(space.id, newDescription.trim());
    }
    setIsEditingDescription(false);
    onClose();
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingThumbnail(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        setUploadingThumbnail(false);
        return;
      }

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error('Please select image or video files only');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/thumbnails/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('space-covers')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('space-covers')
          .getPublicUrl(data.path);

        setUploadedThumbnails(prev => [...prev, publicUrl]);
        setThumbnailMediaTypes(prev => [...prev, isVideo ? 'video' : 'image']);
        
        // Update the space thumbnail_url in the database
        const { error: updateError } = await supabase
          .from('spaces')
          .update({ thumbnail_url: publicUrl })
          .eq('id', space.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating space thumbnail:', updateError);
        }
        
        if (onUpdateThumbnail) {
          onUpdateThumbnail(space.id, publicUrl);
        }
        
        toast.success(`Thumbnail uploaded and set`);
        
        // Force a refetch from SpacesContext to update the UI
        window.dispatchEvent(new CustomEvent('refetch-spaces'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingBackground(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        setUploadingBackground(false);
        return;
      }

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error('Please select image or video files only');
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/backgrounds/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('space-covers')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('space-covers')
          .getPublicUrl(data.path);

        setUploadedBackgrounds(prev => [...prev, publicUrl]);
        setBackgroundMediaTypes(prev => [...prev, isVideo ? 'video' : 'image']);
        
        // Update space cover_url
        try {
          const { error: updateError } = await supabase
            .from('spaces')
            .update({ cover_url: publicUrl })
            .eq('id', space.id)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating space:', updateError);
            toast.error('Failed to set background');
          } else {
            toast.success(`Background uploaded and set`);
            
            // Force a refetch from SpacesContext to update the UI
            window.dispatchEvent(new CustomEvent('refetch-spaces'));
          }
        } catch (err) {
          console.error('Error updating space:', err);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeThumbnail = async (index: number) => {
    const url = uploadedThumbnails[index];
    try {
      const path = new URL(url).pathname.split('/object/public/space-covers/')[1];
      if (path) {
        await supabase.storage.from('space-covers').remove([decodeURIComponent(path)]);
      }
    } catch (err) {
      console.error('Error removing thumbnail:', err);
    }
    setUploadedThumbnails(prev => prev.filter((_, i) => i !== index));
    setThumbnailMediaTypes(prev => prev.filter((_, i) => i !== index));
  };

  const removeBackground = async (index: number) => {
    const url = uploadedBackgrounds[index];
    try {
      const path = new URL(url).pathname.split('/object/public/space-covers/')[1];
      if (path) {
        await supabase.storage.from('space-covers').remove([decodeURIComponent(path)]);
      }
    } catch (err) {
      console.error('Error removing background:', err);
    }
    setUploadedBackgrounds(prev => prev.filter((_, i) => i !== index));
    setBackgroundMediaTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // TODO: Replace with actual AI image generation service
      setTimeout(() => {
        const generatedImage = `data:image/svg+xml,${encodeURIComponent(
          `<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="hsl(280, 100%, 70%)"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="12">
              ${is360Mode ? '360° ' : ''}AI: ${aiPrompt.slice(0, 15)}...
            </text>
          </svg>`
        )}`;
        
        setUploadedBackgrounds(prev => [...prev, generatedImage]);
        setBackgroundMediaTypes(prev => [...prev, 'image']);
        selectBackground(generatedImage);
        setAiPrompt('');
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate image:', error);
      setIsGenerating(false);
    }
  };

  const selectThumbnail = async (imageUrl: string) => {
    console.log('selectThumbnail called with:', imageUrl, 'for space:', space.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update space in database
    const { error } = await supabase
      .from('spaces')
      .update({ thumbnail_url: imageUrl })
      .eq('id', space.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating space thumbnail:', error);
      toast.error('Failed to update space thumbnail');
      return;
    }

    console.log('Thumbnail updated successfully in database');
    if (onUpdateThumbnail) {
      onUpdateThumbnail(space.id, imageUrl);
    }
    
    toast.success('Thumbnail updated');
    
    // Force a refetch from SpacesContext to update the UI
    window.dispatchEvent(new CustomEvent('refetch-spaces'));
  };

  const selectBackground = async (imageUrl: string) => {
    console.log('selectBackground called with:', imageUrl, 'for space:', space.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('spaces')
        .update({ cover_url: imageUrl })
        .eq('id', space.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating space background:', error);
        toast.error('Failed to set background');
      } else {
        console.log('Background updated successfully in database');
        toast.success('Background updated');
        
        // Force a refetch from SpacesContext to update the UI
        window.dispatchEvent(new CustomEvent('refetch-spaces'));
      }
    } catch (err) {
      console.error('Error updating space:', err);
      toast.error('Failed to set background');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isRenaming) {
        handleRename();
      } else if (isEditingDescription) {
        handleDescriptionUpdate();
      }
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setIsEditingDescription(false);
      setNewName(space.name);
      setNewDescription(space.description || 'Welcome back');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-20 left-0 right-0 z-40 flex items-start justify-center pt-4" style={{ bottom: 'calc(12.5vh + 6rem)' }}>
          {/* Context Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative z-10 w-[85vw] max-w-4xl h-full max-h-full"
            ref={menuRef}
          >
            <div className="w-full h-full glass-card border border-white/10 rounded-xl overflow-hidden flex flex-col backdrop-blur-xl bg-black/40">
              <GradientLoader isLoading={isGenerating} />
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div>
                  <h3 className="font-semibold text-white">Space Settings</h3>
                  <p className="text-xs text-white/60">Customize your space</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'settings' | 'dials')} className="flex-1 flex flex-col min-h-0">
                <TabsList className="w-full grid grid-cols-2 bg-black/30 border-b border-white/10 rounded-none h-12 flex-shrink-0">
                  <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/60">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="dials" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white text-white/60">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Dials
                  </TabsTrigger>
                </TabsList>

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0 min-h-0">
                  {/* Thumbnail and Background Side by Side with Link Button */}
                  <div className="relative grid grid-cols-2 gap-3">
                  {/* Space Thumbnail Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Image size={14} className="text-primary" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Thumbnail</span>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-3 space-y-2">
                      <button
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 rounded-xl transition-all duration-200"
                        onClick={() => {
                          thumbnailInputRef.current?.click();
                          if (syncThumbnailBackground) {
                            backgroundInputRef.current?.click();
                          }
                        }}
                        disabled={uploadingThumbnail}
                      >
                        {uploadingThumbnail ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium text-white">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-white" />
                            <span className="text-xs font-medium text-white">Upload</span>
                          </>
                        )}
                      </button>
                      
                      
                      <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/quicktime"
                        multiple
                        onChange={(e) => {
                          handleThumbnailUpload(e);
                          if (syncThumbnailBackground && e.target.files) {
                            // Create a new event with the same files for background upload
                            const bgEvent = { target: { files: e.target.files } } as React.ChangeEvent<HTMLInputElement>;
                            handleBackgroundUpload(bgEvent);
                          }
                        }}
                        className="hidden"
                      />

                      {uploadedThumbnails.length > 0 && (
                        <MediaCarousel
                          items={uploadedThumbnails}
                          mediaTypes={thumbnailMediaTypes}
                          onSelect={selectThumbnail}
                          onRemove={() => {}}
                        />
                      )}
                    </div>
                  </div>

                  {/* Space Background Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <ImageIcon size={14} className="text-primary" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Background</span>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-3 space-y-2">
                      <button
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 rounded-xl transition-all duration-200"
                        onClick={() => backgroundInputRef.current?.click()}
                        disabled={uploadingBackground}
                      >
                        {uploadingBackground ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium text-white">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-white" />
                            <span className="text-xs font-medium text-white">Upload</span>
                          </>
                        )}
                      </button>

                      <input
                        ref={backgroundInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/quicktime"
                        multiple
                        onChange={handleBackgroundUpload}
                        className="hidden"
                      />

                      {uploadedBackgrounds.length > 0 && (
                        <MediaCarousel
                          items={uploadedBackgrounds}
                          mediaTypes={backgroundMediaTypes}
                          onSelect={selectBackground}
                          onRemove={() => {}}
                        />
                      )}
                    </div>
                  </div>

                  {/* Sync Thumbnail/Background Button */}
                  <button
                    onClick={() => setSyncThumbnailBackground(!syncThumbnailBackground)}
                    className={`absolute -right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border-2 transition-all duration-200 ${
                      syncThumbnailBackground
                        ? 'bg-primary/30 border-primary/60 text-white hover:bg-primary/40'
                        : 'bg-black/40 border-white/20 text-white/40 hover:border-white/40 hover:text-white/60'
                    }`}
                    title={syncThumbnailBackground ? "Unlink uploads" : "Link uploads"}
                  >
                    {syncThumbnailBackground ? (
                      <Link size={14} />
                    ) : (
                      <Unlink size={14} />
                    )}
                  </button>
                </div>

                {/* Name and Description */}
                {isRenaming ? (
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleKeyPress}
                    placeholder="Space name"
                    className="mb-2 bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:border-primary/60"
                    autoFocus
                  />
                ) : isEditingDescription ? (
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onBlur={handleDescriptionUpdate}
                    onKeyDown={handleKeyPress}
                    placeholder="Space description"
                    className="mb-2 bg-black/40 border-white/20 text-white placeholder:text-white/40 focus:border-primary/60 min-h-[60px]"
                    autoFocus
                  />
                ) : (
                  <div className="mb-2 space-y-0.5">
                    <p 
                      className="text-sm font-semibold cursor-pointer hover:text-white/80 transition-colors text-white" 
                      onClick={() => setIsRenaming(true)}
                    >
                      {space.name}
                    </p>
                    <p 
                      className="text-[10px] text-white/60 cursor-pointer hover:text-white/80 transition-colors"
                      onClick={() => setIsEditingDescription(true)}
                    >
                      {space.description || 'Welcome back'}
                    </p>
                  </div>
                )}

                {/* 360 Mode Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Globe size={14} className="text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Display as 360°</span>
                  </div>

                  <div className="space-y-0.5 bg-black/20 border border-white/10 rounded-xl p-2">
                    {/* 360° Toggle */}
                    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-white" />
                        <span className="text-xs text-white">360° View</span>
                      </div>
                      <Switch
                        checked={space.show360 || false}
                        onCheckedChange={(checked) => {
                          onToggle360(space.id, checked);
                        }}
                      />
                    </div>

                    {/* Play All Button Toggle */}
                    <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <Play size={14} className="text-white" />
                        <span className="text-xs text-white">Show Play All Button</span>
                      </div>
                      <Switch
                        checked={showPlayAllButton}
                        onCheckedChange={async (checked) => {
                          try {
                            const { error } = await supabase
                              .from('spaces')
                              .update({ show_play_all_button: checked })
                              .eq('id', space.id);
                            
                            if (error) throw error;
                            setShowPlayAllButton(checked);
                            toast.success(checked ? 'Play All button enabled' : 'Play All button disabled');
                          } catch (error) {
                            console.error('Error updating play all button setting:', error);
                            toast.error('Failed to update play all button setting');
                          }
                        }}
                      />
                    </div>

                    {/* 360° Settings */}
                    {space.show360 && (
                      <div className="space-y-3 pt-2 border-t border-white/10 mt-2">
                        {/* X-Axis Offset */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs text-white">X-Axis Offset</span>
                            <span className="text-xs text-white/60">{xAxis}°</span>
                          </div>
                          <Slider
                            value={[xAxis]}
                            onValueChange={([value]) => {
                              setXAxis(value);
                              on360AxisChange?.(space.id, 'x', value);
                            }}
                            min={-180}
                            max={180}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Y-Axis Offset */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs text-white">Y-Axis Offset</span>
                            <span className="text-xs text-white/60">{yAxis}°</span>
                          </div>
                          <Slider
                            value={[yAxis]}
                            onValueChange={([value]) => {
                              setYAxis(value);
                              on360AxisChange?.(space.id, 'y', value);
                            }}
                            min={-90}
                            max={90}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Audio Controls */}
                        <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                          <div className="flex items-center gap-2">
                            {isMuted ? <VolumeX size={14} className="text-white" /> : <Volume2 size={14} className="text-white" />}
                            <span className="text-xs text-white">Mute Audio</span>
                          </div>
                          <Switch
                            checked={isMuted}
                            onCheckedChange={(checked) => {
                              setIsMuted(checked);
                              on360MuteToggle?.(space.id, checked);
                            }}
                          />
                        </div>

                        {/* Volume Slider */}
                        {!isMuted && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-2">
                              <span className="text-xs text-white">Volume</span>
                              <span className="text-xs text-white/60">{volume}%</span>
                            </div>
                            <Slider
                              value={[volume]}
                              onValueChange={([value]) => {
                                setVolume(value);
                                on360VolumeChange?.(space.id, value);
                              }}
                              min={0}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}

                        {/* Auto-Rotate */}
                        <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                          <span className="text-xs text-white">Auto-Rotate</span>
                          <Switch
                            checked={rotationEnabled}
                            onCheckedChange={(checked) => {
                              setRotationEnabled(checked);
                              on360RotationToggle?.(space.id, checked);
                            }}
                          />
                        </div>

                        {/* Rotation Speed */}
                        {rotationEnabled && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-2">
                              <span className="text-xs text-white">Rotation Speed</span>
                              <span className="text-xs text-white/60">{rotationSpeed}x</span>
                            </div>
                            <Slider
                              value={[rotationSpeed]}
                              onValueChange={([value]) => {
                                setRotationSpeed(value);
                                on360RotationSpeedChange?.(space.id, value);
                              }}
                              min={0.1}
                              max={5}
                              step={0.1}
                              className="w-full"
                            />
                          </div>
                        )}

                        {/* Flip Controls */}
                        <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                          <span className="text-xs text-white">Flip Horizontal</span>
                          <Switch
                            checked={space.flipHorizontal || false}
                            onCheckedChange={(checked) => {
                              onFlipHorizontalToggle?.(space.id, checked);
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                          <span className="text-xs text-white">Flip Vertical</span>
                          <Switch
                            checked={space.flipVertical || false}
                            onCheckedChange={(checked) => {
                              onFlipVerticalToggle?.(space.id, checked);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Settings size={14} className="text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Actions</span>
                  </div>

                  <div className="space-y-0.5 bg-black/20 border border-white/10 rounded-xl p-2">
                    {/* Select Mode */}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => {
                        addToSelection({
                          id: space.id,
                          type: 'space',
                          name: space.name,
                          thumbnailUrl: space.thumb || undefined,
                          isSpace: true,
                        });
                        if (!isSelectMode) toggleSelectMode();
                        onClose();
                      }}
                    >
                      <CheckSquare size={14} className="text-white" />
                      <span className="text-xs text-white">Select Mode</span>
                    </button>

                    {/* Rename */}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => setIsRenaming(true)}
                      disabled={isRenaming || isEditingDescription}
                    >
                      <Edit3 size={14} className="text-white" />
                      <span className="text-xs text-white">Rename</span>
                    </button>

                    {/* Edit Description */}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => setIsEditingDescription(true)}
                      disabled={isRenaming || isEditingDescription}
                    >
                      <MessageSquare size={14} className="text-white" />
                      <span className="text-xs text-white">Edit Description</span>
                    </button>

                    {/* Move Left */}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => onReorder(space.id, 'left')}
                    >
                      <GripVertical size={14} className="text-white" />
                      <span className="text-xs text-white">Move Left</span>
                    </button>

                    {/* Move Right */}
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => {
                        onReorder(space.id, 'right');
                        onClose();
                      }}
                    >
                      <GripVertical size={14} className="text-white" />
                      <span className="text-xs text-white">Move Right</span>
                    </button>

                    {/* Select */}
                    {!space.isHome && (
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-accent/20 text-foreground rounded-lg transition-colors text-left"
                        onClick={() => {
                          addToSelection({
                            id: space.id,
                            type: 'space',
                            name: space.name,
                            thumbnailUrl: space.thumb,
                            isSpace: true,
                          });
                          if (!isSelectMode) {
                            toggleSelectMode();
                          }
                          onClose();
                        }}
                      >
                        <CheckSquare size={14} />
                        <span className="text-xs">Select</span>
                      </button>
                    )}

                    {/* Delete - disabled for Home */}
                    {!space.isHome && (
                      <button
                        className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-left"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 size={14} />
                        <span className="text-xs">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Dials Tab */}
              <TabsContent value="dials" className="flex-1 overflow-y-auto p-3 mt-0 min-h-0">
                <div className="space-y-4">
                  <div className="text-center space-y-4">
                    <BarChart3 className="w-12 h-12 mx-auto text-primary/60" />
                    <h3 className="text-lg font-semibold text-white">Space DOS Analysis</h3>
                    <p className="text-sm text-white/60">Analyze this space's metadata and semantic relationships</p>
                    
                    <Button
                      onClick={() => {
                        if (onToggleDOSPanel) {
                          onToggleDOSPanel();
                        }
                        onClose();
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={!onToggleDOSPanel}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze Space
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

              {/* FOS Utility Section - Always visible at bottom */}
              <div className="border-t border-border/50 bg-background/5 p-3 space-y-2 flex-shrink-0">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">
                  Organization Tools
                </div>
                
                {/* Select - Big prominent button */}
                {!space.isHome && (
                  <button
                    className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium shadow-lg"
                    onClick={() => {
                      addToSelection({
                        id: space.id,
                        type: 'space',
                        name: space.name,
                        thumbnailUrl: space.thumb,
                        isSpace: true,
                      });
                      if (!isSelectMode) {
                        toggleSelectMode();
                      }
                      onClose();
                    }}
                  >
                    <CheckSquare size={18} />
                    <span className="text-sm font-semibold">SELECT</span>
                  </button>
                )}

                {/* Other utility buttons in a grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="flex items-center justify-center gap-2 px-3 py-2 hover:bg-accent/20 text-foreground rounded-lg transition-colors border border-border/30"
                    onClick={() => {
                      onReorder?.(space.id, 'left');
                    }}
                  >
                    <span className="text-xs">Move Left</span>
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 px-3 py-2 hover:bg-accent/20 text-foreground rounded-lg transition-colors border border-border/30"
                    onClick={() => {
                      onReorder?.(space.id, 'right');
                    }}
                  >
                    <span className="text-xs">Move Right</span>
                  </button>
                </div>

                {/* Delete button - full width, destructive */}
                {!space.isHome && (
                  <button
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 hover:bg-destructive/90 bg-destructive text-destructive-foreground rounded-lg transition-colors font-medium"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Delete</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Space</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{space.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(space.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 360 Settings Modal */}
          <Settings360Modal
            isOpen={show360Settings}
            onClose={() => setShow360Settings(false)}
            show360={space.show360 || false}
            onToggle360={() => onToggle360(space.id, !(space.show360 || false))}
            xAxisOffset={xAxis}
            yAxisOffset={yAxis}
            onAxisChange={(axis, value) => {
              if (axis === 'x') setXAxis(value);
              else setYAxis(value);
              on360AxisChange?.(space.id, axis, value);
            }}
            volume={volume / 100}
            isMuted={isMuted}
            onVolumeChange={(vol) => {
              const volumePercent = Math.round(vol * 100);
              setVolume(volumePercent);
              on360VolumeChange?.(space.id, volumePercent);
            }}
            onMuteToggle={() => {
              const newMuted = !isMuted;
              setIsMuted(newMuted);
              on360MuteToggle?.(space.id, newMuted);
            }}
            rotationEnabled={rotationEnabled}
            onRotationToggle={() => {
              const newRotation = !rotationEnabled;
              setRotationEnabled(newRotation);
              on360RotationToggle?.(space.id, newRotation);
            }}
            rotationSpeed={rotationSpeed}
            onRotationSpeedChange={(speed) => {
              setRotationSpeed(speed);
              on360RotationSpeedChange?.(space.id, speed);
            }}
            flipHorizontal={space.flipHorizontal || false}
            flipVertical={space.flipVertical || false}
            onFlipHorizontalToggle={() => onFlipHorizontalToggle?.(space.id, !(space.flipHorizontal || false))}
            onFlipVerticalToggle={() => onFlipVerticalToggle?.(space.id, !(space.flipVertical || false))}
          />
        </div>
      )}
    </AnimatePresence>
  );
}