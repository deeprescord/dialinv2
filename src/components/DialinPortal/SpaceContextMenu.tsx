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

  const coverOptions = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=120&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1629909613654-28e6c8816c9b?q=80&w=200&h=120&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1583847268964-a6f45e725dc3?q=80&w=200&h=120&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=200&h=120&fit=crop&auto=format',
  ];

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

        setUploadedImages(prev => [...prev, publicUrl]);
        setUploadedMediaTypes(prev => [...prev, isVideo ? 'video' : 'image']);
        
        toast.success(`${isVideo ? 'Video' : 'Image'} uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedImage = (index: number) => {
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
      setShowCoverOptions(false);
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Context Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-background/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg w-[400px] max-h-[85vh] overflow-y-auto"
            ref={menuRef}
            style={{ left: computedPos.left, top: computedPos.top }}
          >
            <GradientLoader isLoading={isGenerating} />
            
            <div className="p-4 space-y-3">
              {/* Upload Media Button */}
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-background/50 hover:bg-background/70 border border-white/20 rounded-xl transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span className="text-sm font-medium">Upload Image / Video</span>
                  </>
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                multiple
                onChange={handleThumbnailChange}
                className="hidden"
              />

              {/* AI Generation Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-medium text-foreground/80">Generate with AI</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">360°</span>
                    <Switch
                      checked={is360Mode}
                      onCheckedChange={setIs360Mode}
                      className="scale-90"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Background..."
                    className="flex-1 bg-background/50 border-white/20 h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 hover:bg-white/5 px-3 h-10"
                    onClick={handleGenerateWithAI}
                    disabled={!aiPrompt.trim() || isGenerating}
                  >
                    {isGenerating ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                  </Button>
                </div>
              </div>

              {/* Media Grid - show uploaded images/videos */}
              {(uploadedImages.length > 0 || coverOptions.length > 0) && (
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {uploadedImages.map((mediaUrl, index) => {
                    const isVideo = uploadedMediaTypes[index] === 'video';
                    return (
                      <div
                        key={`uploaded-${index}`}
                        role="button"
                        tabIndex={0}
                        className="relative overflow-hidden rounded-lg border-2 border-white/20 hover:border-primary transition-all aspect-video"
                        onClick={() => selectCoverImage(mediaUrl)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectCoverImage(mediaUrl); }}
                      >
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div
                          role="button"
                          aria-label="Remove uploaded media"
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center hover:bg-black/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(index);
                          }}
                        >
                          <X size={12} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground/80">Space Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  onClick={onClose}
                >
                  <X size={14} />
                </Button>
              </div>

              {/* Space Name & Description */}
              {isRenaming ? (
                <div className="mb-4">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleRename}
                    className="text-sm h-9"
                    autoFocus
                    placeholder="Space name"
                  />
                </div>
              ) : isEditingDescription ? (
                <div className="mb-4">
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleDescriptionUpdate}
                    className="text-sm resize-none"
                    rows={2}
                    autoFocus
                    placeholder="Welcome back phrase"
                  />
                </div>
              ) : (
                <div className="mb-4 space-y-0.5">
                  <p 
                    className="text-base font-semibold cursor-pointer hover:text-primary/80 transition-colors" 
                    onClick={() => setIsRenaming(true)}
                  >
                    {space.name}
                  </p>
                  <p 
                    className="text-xs text-muted-foreground cursor-pointer hover:text-foreground/60 transition-colors" 
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {space.description || 'Welcome back'}
                  </p>
                </div>
              )}

              {/* Menu Items */}
              <div className="space-y-1">
                {/* 360° Toggle */}
                <div className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Globe size={16} />
                    <span className="text-sm">360° View</span>
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
                  <div className="px-3 py-3 space-y-3 bg-background/30 rounded-lg ml-3 mr-1 my-2">
                    <div className="space-y-2">
                      <label className="text-xs text-foreground/70">X Axis</label>
                      <Slider
                        value={[xAxis]}
                        onValueChange={(value) => {
                          setXAxis(value[0]);
                          on360AxisChange?.(space.id, 'x', value[0]);
                        }}
                        min={-180}
                        max={180}
                        step={1}
                      />
                      <span className="text-xs text-foreground/60">{xAxis}°</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-foreground/70">Y Axis</label>
                      <Slider
                        value={[yAxis]}
                        onValueChange={(value) => {
                          setYAxis(value[0]);
                          on360AxisChange?.(space.id, 'y', value[0]);
                        }}
                        min={-90}
                        max={90}
                        step={1}
                      />
                      <span className="text-xs text-foreground/60">{yAxis}°</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span className="text-xs">Audio</span>
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
                      <div className="space-y-2">
                        <label className="text-xs text-foreground/70">Volume</label>
                        <Slider
                          value={[volume]}
                          onValueChange={(value) => {
                            setVolume(value[0]);
                            on360VolumeChange?.(space.id, value[0]);
                          }}
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="text-xs text-foreground/60">{volume}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs">Auto Rotate</span>
                      <Switch
                        checked={rotationEnabled}
                        onCheckedChange={(checked) => {
                          setRotationEnabled(checked);
                          on360RotationToggle?.(space.id, checked);
                        }}
                      />
                    </div>

                    {rotationEnabled && (
                      <div className="space-y-2">
                        <label className="text-xs text-foreground/70">Rotation Speed</label>
                        <Slider
                          value={[rotationSpeed]}
                          onValueChange={(value) => {
                            setRotationSpeed(value[0]);
                            on360RotationSpeedChange?.(space.id, value[0]);
                          }}
                          min={0.1}
                          max={5}
                          step={0.1}
                        />
                        <span className="text-xs text-foreground/60">{rotationSpeed.toFixed(1)}x</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Rename */}
                {space.id !== 'lobby' && (
                  <button
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                    onClick={() => setIsRenaming(true)}
                    disabled={isRenaming || isEditingDescription}
                  >
                    <Edit3 size={16} />
                    <span className="text-sm">Rename</span>
                  </button>
                )}

                {/* Edit Description */}
                <button
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                  onClick={() => setIsEditingDescription(true)}
                  disabled={isRenaming || isEditingDescription}
                >
                  <MessageSquare size={16} />
                  <span className="text-sm">Edit Description</span>
                </button>

                {/* Move Left */}
                <button
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                  onClick={() => onReorder(space.id, 'left')}
                >
                  <GripVertical size={16} />
                  <span className="text-sm">Move Left</span>
                </button>

                {/* Move Right */}
                <button
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                  onClick={() => {
                    onReorder(space.id, 'right');
                    onClose();
                  }}
                >
                  <GripVertical size={16} />
                  <span className="text-sm">Move Right</span>
                </button>

                {/* Delete */}
                <button
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors text-left"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                  <span className="text-sm">Delete</span>
                </button>
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
        </>
      )}
    </AnimatePresence>
  );
}