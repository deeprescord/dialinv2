import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Trash2, Edit3, GripVertical, X, Globe, MessageSquare, ChevronDown, ChevronUp, Volume2, VolumeX, Image, Upload, Sparkles, Video, ImageIcon, Settings, Play } from 'lucide-react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [is360Mode, setIs360Mode] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showAIControls, setShowAIControls] = useState(false);
  const [syncThumbnailBackground, setSyncThumbnailBackground] = useState(false);
  const [show360Settings, setShow360Settings] = useState(false);
  const [showPlayAllButton, setShowPlayAllButton] = useState(false);
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

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Sync Toggle */}
                <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-primary" />
                    <span className="text-xs font-medium text-white">Sync Thumbnail & Background</span>
                  </div>
                  <Switch
                    checked={syncThumbnailBackground}
                    onCheckedChange={setSyncThumbnailBackground}
                  />
                </div>

                {/* Thumbnail and Background Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                {/* Space Thumbnail Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Image size={14} className="text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Thumbnail</span>
                  </div>
                  <div className="bg-black/20 border border-white/10 rounded-xl p-3 space-y-2">
                    <button
                      className="w-full flex items-center justify-center gap-2 px-3 py-6 bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 rounded-xl transition-all duration-200"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploadingThumbnail}
                    >
                      {uploadingThumbnail ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium text-white">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-white" />
                          <span className="text-sm font-medium text-white">Upload</span>
                        </>
                      )}
                    </button>
                    
                    
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/quicktime"
                      multiple
                      onChange={handleThumbnailUpload}
                      className="hidden"
                    />

                    <MediaCarousel
                      items={uploadedThumbnails}
                      mediaTypes={thumbnailMediaTypes}
                      onSelect={selectThumbnail}
                      onRemove={removeThumbnail}
                      selectedUrl={space.thumb}
                    />
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
                      className="w-full flex items-center justify-center gap-2 px-3 py-6 bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 rounded-xl transition-all duration-200"
                      onClick={() => backgroundInputRef.current?.click()}
                      disabled={uploadingBackground || syncThumbnailBackground}
                    >
                      {uploadingBackground ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium text-white">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={20} className="text-white" />
                          <span className="text-sm font-medium text-white">Upload</span>
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

                    <MediaCarousel
                      items={uploadedBackgrounds}
                      mediaTypes={backgroundMediaTypes}
                      onSelect={selectBackground}
                      onRemove={removeBackground}
                      selectedUrl={space.backgroundImage}
                    />
                  </div>
                </div>
              </div>

                {/* Divider */}
                <div className="h-px bg-white/10 my-3" />

                {/* Space Name & Description */}
                {isRenaming ? (
                  <div className="mb-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleRename}
                      className="text-xs h-8 bg-black/40 border-white/10 text-white"
                      autoFocus
                      placeholder="Space name"
                    />
                  </div>
                ) : isEditingDescription ? (
                  <div className="mb-2">
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleDescriptionUpdate}
                      className="text-xs resize-none bg-black/40 border-white/10 text-white"
                      rows={2}
                      autoFocus
                      placeholder="Welcome back phrase"
                    />
                  </div>
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
                    <span className="text-xs font-bold text-white uppercase tracking-wider">360 Mode</span>
                  </div>

                {/* Menu Items */}
                <div className="space-y-0.5 bg-black/20 border border-white/10 rounded-xl p-2">
                  {/* 360° Toggle */}
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-white" />
                      <span className="text-xs text-white">360° View</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={space.show360 || false}
                        onCheckedChange={(checked) => {
                          onToggle360(space.id, checked);
                        }}
                      />
                    </div>
                  </div>

                  {/* Play All Button Toggle */}
                  <div className="flex items-center justify-between px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Play size={14} className="text-white" />
                      <span className="text-xs text-white">Show Play All Button</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                  </div>

                  {/* 360° Settings Button */}
                  {space.show360 && (
                    <button
                      onClick={() => setShow360Settings(true)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                    >
                      <Settings size={14} className="text-white" />
                      <span className="text-xs text-white">360° Settings</span>
                    </button>
                  )}

                  {/* Advanced 360° Controls */}
                  {space.show360 && show360Advanced && (
                    <div className="px-2 py-2 space-y-2 bg-black/20 rounded-lg ml-2 mr-1 my-1">
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/70">X Axis</label>
                        <Slider
                        value={[xAxis]}
                        onValueChange={(value) => {
                          setXAxis(value[0]);
                        }}
                        onValueCommit={(value) => {
                          on360AxisChange?.(space.id, 'x', value[0]);
                        }}
                        min={-180}
                        max={180}
                        step={1}
                      />
                        <span className="text-[10px] text-white/60">{xAxis}°</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-white/70">Y Axis</label>
                      <Slider
                        value={[yAxis]}
                        onValueChange={(value) => {
                          setYAxis(value[0]);
                        }}
                        onValueCommit={(value) => {
                          on360AxisChange?.(space.id, 'y', value[0]);
                        }}
                        min={-90}
                        max={90}
                        step={1}
                      />
                        <span className="text-[10px] text-white/60">{yAxis}°</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isMuted ? <VolumeX size={12} className="text-white" /> : <Volume2 size={12} className="text-white" />}
                          <span className="text-[10px] text-white">Audio</span>
                        </div>
                      <Switch
                        checked={!isMuted}
                        onCheckedChange={(checked) => {
                          setIsMuted(!checked);
                          on360MuteToggle?.(space.id, !checked);
                        }}
                      />
                    </div>

                      {!isMuted && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/70">Volume</label>
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => {
                            setVolume(value[0]);
                          }}
                          onValueCommit={(value) => {
                            on360VolumeChange?.(space.id, value[0]);
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                          <span className="text-[10px] text-white/60">{volume}%</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white">Auto Rotate</span>
                      <Switch
                        checked={rotationEnabled}
                        onCheckedChange={(checked) => {
                          setRotationEnabled(checked);
                          on360RotationToggle?.(space.id, checked);
                        }}
                      />
                    </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white">Flip Horizontal</span>
                        <Switch
                          checked={space.flipHorizontal || false}
                          onCheckedChange={(checked) => {
                            onFlipHorizontalToggle?.(space.id, checked);
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white">Flip Vertical</span>
                        <Switch
                          checked={space.flipVertical || false}
                          onCheckedChange={(checked) => {
                            onFlipVerticalToggle?.(space.id, checked);
                          }}
                        />
                      </div>

                      {rotationEnabled && (
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/70">Rotation Speed</label>
                        <Slider
                          value={[rotationSpeed]}
                          onValueChange={(value) => {
                            setRotationSpeed(value[0]);
                          }}
                          onValueCommit={(value) => {
                            on360RotationSpeedChange?.(space.id, value[0]);
                          }}
                          min={0.1}
                          max={5}
                          step={0.1}
                        />
                          <span className="text-[10px] text-white/60">{rotationSpeed.toFixed(1)}x</span>
                        </div>
                      )}
                    </div>
                  )}

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
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/10 bg-black/10">
                <Button
                  onClick={onClose}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white h-8 text-xs"
                >
                  Close
                </Button>
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