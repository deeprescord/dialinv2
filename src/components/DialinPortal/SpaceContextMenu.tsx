import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Trash2, Edit3, GripVertical, X, Globe, MessageSquare, ChevronDown, ChevronUp, Volume2, VolumeX, Image, Upload, Sparkles, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GradientLoader } from './GradientLoader';
import { Space } from '@/data/catalogs';
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedMediaTypes, setUploadedMediaTypes] = useState<('image' | 'video')[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [is360Mode, setIs360Mode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAIControls, setShowAIControls] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [computedPos, setComputedPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

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
        const { data, error } = await supabase.storage
          .from('space-covers')
          .list(user.id, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) {
          console.error('Failed listing media:', error);
          return;
        }
        const urls: string[] = [];
        const types: ('image' | 'video')[] = [];
        (data || []).forEach((item) => {
          const { data: pub } = supabase.storage
            .from('space-covers')
            .getPublicUrl(`${user.id}/${item.name}`);
          urls.push(pub.publicUrl);
          const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(item.name);
          types.push(isVideo ? 'video' : 'image');
        });
        setUploadedImages(urls);
        setUploadedMediaTypes(types);
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

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        setUploading(false);
        return;
      }

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          toast.error('Please select image or video files only');
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to Lovable Cloud storage (public space-covers bucket)
        const { data, error } = await supabase.storage
          .from('space-covers')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('space-covers')
          .getPublicUrl(data.path);

        // Add to uploaded images array
        setUploadedImages(prev => [...prev, publicUrl]);
        setUploadedMediaTypes(prev => [...prev, isVideo ? 'video' : 'image']);
        
        // Automatically apply the first uploaded image as the cover
        if (onUpdateThumbnail) {
          onUpdateThumbnail(space.id, publicUrl);
        }
        
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded and applied successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedImage = async (index: number) => {
    const url = uploadedImages[index];
    // Try to remove from storage as well
    try {
      const path = (() => {
        try {
          const u = new URL(url);
          const seg = u.pathname.split('/object/public/space-covers/')[1];
          return seg ? decodeURIComponent(seg) : null;
        } catch {
          return null;
        }
      })();
      if (path) {
        const { error } = await supabase.storage.from('space-covers').remove([path]);
        if (error) {
          console.error('Failed to remove from storage:', error);
        }
      }
    } catch (err) {
      console.error('Error removing uploaded media:', err);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedMediaTypes(prev => prev.filter((_, i) => i !== index));
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
        
        setUploadedImages(prev => [...prev, generatedImage]);
        if (onUpdateThumbnail) {
          onUpdateThumbnail(space.id, generatedImage);
        }
        setAiPrompt('');
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate image:', error);
      setIsGenerating(false);
    }
  };

  const selectCoverImage = (imageUrl: string) => {
    if (onUpdateThumbnail) {
      onUpdateThumbnail(space.id, imageUrl);
      toast.success('Cover updated successfully');
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
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Top Action Buttons */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black/40 hover:bg-black/50 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium text-white">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="text-white" />
                        <span className="text-xs font-medium text-white">Upload</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-xl transition-all duration-200 ${
                      showAIControls 
                        ? 'bg-primary/20 border-primary/50 text-white' 
                        : 'bg-black/40 hover:bg-black/50 border-white/10 hover:border-white/20 text-white'
                    }`}
                    onClick={() => setShowAIControls(!showAIControls)}
                  >
                    <Sparkles size={14} />
                    <span className="text-xs font-medium">AI Generate</span>
                  </button>
                </div>
              
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/quicktime"
                  multiple
                  onChange={handleThumbnailChange}
                  className="hidden"
                />

                {/* AI Controls - Collapsible */}
                <AnimatePresence>
                  {showAIControls && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1.5">
                          <Input
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe your background..."
                            className="flex-1 bg-black/40 border-white/10 h-8 text-white placeholder:text-white/40 text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 hover:bg-white/5 px-2 h-8 text-white"
                            onClick={handleGenerateWithAI}
                            disabled={!aiPrompt.trim() || isGenerating}
                          >
                            {isGenerating ? (
                              <div className="animate-spin w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5 px-1">
                          <Switch
                            checked={is360Mode}
                            onCheckedChange={setIs360Mode}
                            className="scale-90"
                          />
                          <span className="text-[10px] text-white/60">360° Mode</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Image Carousel */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-white">Your Uploads</span>
                      <span className="text-[10px] text-white/60">{currentCarouselIndex + 1}/{uploadedImages.length}</span>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-white/20">
                      {uploadedMediaTypes[currentCarouselIndex] === 'video' ? (
                        <video
                          src={uploadedImages[currentCarouselIndex]}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={uploadedImages[currentCarouselIndex]}
                          alt={`Upload ${currentCarouselIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Carousel Controls */}
                      {uploadedImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentCarouselIndex((prev) => (prev - 1 + uploadedImages.length) % uploadedImages.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border border-white/20"
                          >
                            <ChevronDown size={14} className="rotate-90" />
                          </button>
                          <button
                            onClick={() => setCurrentCarouselIndex((prev) => (prev + 1) % uploadedImages.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border border-white/20"
                          >
                            <ChevronDown size={14} className="-rotate-90" />
                          </button>
                        </>
                      )}
                      
                      {/* Action Buttons Overlay */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                        <button
                          onClick={() => selectCoverImage(uploadedImages[currentCarouselIndex])}
                          className="flex-1 px-2 py-1 bg-primary/80 hover:bg-primary rounded text-[10px] font-medium text-white"
                        >
                          Set as Cover
                        </button>
                        <button
                          onClick={() => {
                            removeUploadedImage(currentCarouselIndex);
                            if (currentCarouselIndex >= uploadedImages.length - 1) {
                              setCurrentCarouselIndex(Math.max(0, uploadedImages.length - 2));
                            }
                          }}
                          className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded text-white"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-white/10 my-2" />

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

                {/* Menu Items */}
                <div className="space-y-0.5">
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
                    {space.show360 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShow360Advanced(!show360Advanced);
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        {show360Advanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                </div>

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
                  {space.id !== 'lobby' && (
                    <button
                      className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-black/30 rounded-lg transition-colors text-left"
                      onClick={() => setIsRenaming(true)}
                      disabled={isRenaming || isEditingDescription}
                    >
                      <Edit3 size={14} className="text-white" />
                      <span className="text-xs text-white">Rename</span>
                    </button>
                  )}

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

                  {/* Delete */}
                  <button
                    className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-left"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={14} />
                    <span className="text-xs">Delete</span>
                  </button>
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
        </div>
      )}
    </AnimatePresence>
  );
}