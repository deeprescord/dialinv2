import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close, Share, Users, Smile, Plus } from '../icons';
import { Card } from '../ui/card';
import { Trash2, Edit3, Download, Copy, Eye, Globe, Play, Sparkles, X, Volume2, VolumeX, Image, Upload, Settings } from 'lucide-react';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MetadataDetailsPanel } from './MetadataDetailsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { DOSMindMap } from './DOSMindMap';
import { DOSHeatMap } from './DOSHeatMap';
import { DOSCharts } from './DOSCharts';
import { DOSVennDiagram } from './DOSVennDiagram';
import { MediaCarousel } from './MediaCarousel';
import type { MetadataItem } from './DOSPanel';

interface DialPopupProps {
  isOpen: boolean;
  item: {
    id: string;
    title: string;
    thumb: string;
    type?: string;
    vibe?: string;
    decade?: string;
    energy?: string;
  } | null;
  onClose: () => void;
  onUseAsFilters?: () => void;
  onDelete?: (itemId: string) => void;
  onRename?: (itemId: string, newName: string) => void;
  on360Toggle?: (itemId: string, enabled: boolean) => void;
  on360AxisChange?: (itemId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (itemId: string, volume: number) => void;
  on360MuteToggle?: (itemId: string, muted: boolean) => void;
  on360RotationToggle?: (itemId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (itemId: string, speed: number) => void;
  onFlipHorizontalToggle?: (itemId: string, flipped: boolean) => void;
  onFlipVerticalToggle?: (itemId: string, flipped: boolean) => void;
  onUpdateThumbnail?: (itemId: string, thumbnailUrl: string) => void;
}

interface ActionOption {
  id: string;
  label: string;
  icon: any;
  variant?: 'default' | 'destructive';
}

export function DialPopup({ isOpen, item, onClose, onUseAsFilters, onDelete, onRename, on360Toggle, on360AxisChange, on360VolumeChange, on360MuteToggle, on360RotationToggle, on360RotationSpeedChange, onFlipHorizontalToggle, onFlipVerticalToggle, onUpdateThumbnail }: DialPopupProps) {
  // Early return MUST be before any hooks
  if (!item) return null;

  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [showingDetails, setShowingDetails] = useState(false);
  const [show360, setShow360] = useState(false);
  const [showPlayAllButton, setShowPlayAllButton] = useState(false);
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'dials'>('settings');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState<{ hashtags: string[], dial_values: any } | null>(null);
  const [newHashtag, setNewHashtag] = useState('');
  const [xAxis, setXAxis] = useState(0);
  const [yAxis, setYAxis] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(true);
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [uploadedThumbnails, setUploadedThumbnails] = useState<string[]>([]);
  const [thumbnailMediaTypes, setThumbnailMediaTypes] = useState<('image' | 'video')[]>([]);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  // ESC key handling
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (isRenaming) {
          setIsRenaming(false);
          setNewName('');
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, isRenaming]);

  // Reset rename state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setIsRenaming(false);
      setNewName('');
      setShowingDetails(false);
    }
  }, [isOpen]);

  // Fetch 360 settings, play all button, and metadata when popup opens
  useEffect(() => {
    if (isOpen && item) {
      const fetchSettings = async () => {
        try {
          const { data, error } = await supabase
            .from('files')
            .select('show_360, show_play_all_button, x_axis_offset, y_axis_offset, rotation_enabled, rotation_speed, thumbnail_path')
            .eq('id', item.id)
            .maybeSingle();
          
          if (data && !error) {
            setShow360(data.show_360 || false);
            setShowPlayAllButton(data.show_play_all_button || false);
            setXAxis(data.x_axis_offset || 0);
            setYAxis(data.y_axis_offset || 0);
            setRotationEnabled(data.rotation_enabled || false);
            setRotationSpeed(data.rotation_speed || 1);
            
            // Load thumbnail if available
            if (data.thumbnail_path) {
              setUploadedThumbnails([data.thumbnail_path]);
              setThumbnailMediaTypes(['image']);
            }
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }
      };
      
      const fetchMetadata = async () => {
        try {
          setLoadingMetadata(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('item_metadata')
            .select('*')
            .eq('file_id', item.id)
            .eq('user_id', user.id);

          if (error) throw error;
          setMetadata(data || []);
        } catch (error) {
          console.error('Error loading metadata:', error);
        } finally {
          setLoadingMetadata(false);
        }
      };
      
      fetchSettings();
      fetchMetadata();
    }
  }, [isOpen, item]);

  const handle360Toggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ show_360: enabled })
        .eq('id', item.id);
      
      if (error) throw error;
      setShow360(enabled);
      toast.success(enabled ? '360 view enabled' : '360 view disabled');
      
      // Notify parent to update the selected item
      if (on360Toggle) {
        on360Toggle(item.id, enabled);
      }
      onClose();
    } catch (error) {
      console.error('Error updating 360 setting:', error);
      toast.error('Failed to update 360 setting');
    }
  };

  const handlePlayAllButtonToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ show_play_all_button: enabled })
        .eq('id', item.id);
      
      if (error) throw error;
      setShowPlayAllButton(enabled);
      toast.success(enabled ? 'Play All button enabled' : 'Play All button disabled');
      onClose();
      window.dispatchEvent(new CustomEvent('refetch-spaces'));
    } catch (error) {
      console.error('Error updating play all button setting:', error);
      toast.error('Failed to update play all button setting');
    }
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
        
        // Update the file thumbnail_path in the database
        const { error: updateError } = await supabase
          .from('files')
          .update({ thumbnail_path: `space-covers/${data.path}` })
          .eq('id', item.id)
          .eq('owner_id', user.id);

        if (updateError) {
          console.error('Error updating file thumbnail:', updateError);
        }
        
        if (onUpdateThumbnail) {
          onUpdateThumbnail(item.id, publicUrl);
        }
        
        toast.success(`Thumbnail uploaded and set`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const removeThumbnail = async (index: number) => {
    setUploadedThumbnails(prev => prev.filter((_, i) => i !== index));
    setThumbnailMediaTypes(prev => prev.filter((_, i) => i !== index));
  };

  const selectThumbnail = async (imageUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('files')
        .update({ thumbnail_path: imageUrl })
        .eq('id', item.id)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Error updating file thumbnail:', error);
        toast.error('Failed to update thumbnail');
        return;
      }

      if (onUpdateThumbnail) {
        onUpdateThumbnail(item.id, imageUrl);
      }
      
      toast.success('Thumbnail updated');
    } catch (err) {
      console.error('Error updating file:', err);
      toast.error('Failed to update thumbnail');
    }
  };

  const actionOptions: ActionOption[] = [
    { id: 'rename', label: 'Rename', icon: Edit3 },
    { id: 'details', label: 'Show Details', icon: Eye },
    { id: 'download', label: 'Download', icon: Download },
    { id: 'duplicate', label: 'Duplicate', icon: Copy },
    { id: 'share', label: 'Share', icon: Share },
    { id: 'connect', label: 'Connect', icon: Users },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive' },
  ];

  const handleActionClick = async (actionId: string) => {
    console.log('Action clicked:', actionId, 'for item:', item.id);
    
    switch (actionId) {
      case 'rename':
        setIsRenaming(true);
        setNewName(item.title);
        break;

      case 'details':
        setShowingDetails(true);
        break;
        
      case 'delete':
        if (onDelete) {
          onDelete(item.id);
          onClose();
        } else {
          // Default delete handler - delete from files table
          try {
            const { error } = await supabase
              .from('files')
              .delete()
              .eq('id', item.id);
            
            if (error) throw error;
            toast.success('Item deleted successfully');
            onClose();
            window.dispatchEvent(new CustomEvent('refetch-spaces'));
          } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
          }
        }
        break;
        
      case 'download':
        // Get the file URL and download it
        try {
          const { data, error: fetchError } = await supabase
            .from('files')
            .select('storage_path, original_name')
            .eq('id', item.id)
            .single();
          
          if (fetchError) throw fetchError;
          
          if (data && data.storage_path) {
            // Get signed URL
            const { data: signedData } = await supabase.storage
              .from('user-files')
              .createSignedUrl(data.storage_path, 3600);
            
            if (signedData?.signedUrl) {
              const link = document.createElement('a');
              link.href = signedData.signedUrl;
              link.download = data.original_name || item.title;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Download started');
            }
          }
        } catch (error) {
          console.error('Error downloading:', error);
          toast.error('Failed to download item');
        }
        onClose();
        break;
        
      default:
        toast.info(`${actionId} feature coming soon`);
        onClose();
    }
  };

  const handleAnalyzeItem = async () => {
    try {
      setIsAnalyzing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to analyze items');
        return;
      }

      // Fetch full file data
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('original_name, file_type, mime_type')
        .eq('id', item.id)
        .single();

      if (fileError) throw fileError;

      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: { 
          fileId: item.id,
          fileName: fileData.original_name,
          fileType: fileData.file_type,
          mimeType: fileData.mime_type
        }
      });

      if (error) throw error;

      // Show preview instead of saving immediately
      setPreviewMetadata({
        hashtags: data.hashtags || [],
        dial_values: data.dial_values || {}
      });
      
      toast.success('Analysis complete! Review the results below.');
    } catch (error) {
      console.error('Error analyzing item:', error);
      toast.error('Failed to analyze item. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!previewMetadata) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save the metadata
      const { error } = await supabase
        .from('item_metadata')
        .upsert({
          file_id: item.id,
          user_id: user.id,
          hashtags: previewMetadata.hashtags,
          dial_values: previewMetadata.dial_values,
          ai_generated: true,
          ai_confidence: 0.8
        });

      if (error) throw error;

      toast.success('Metadata saved successfully!');
      
      // Refresh metadata
      const { data: newMetadata, error: fetchError } = await supabase
        .from('item_metadata')
        .select('*')
        .eq('file_id', item.id)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      setMetadata(newMetadata || []);
      setPreviewMetadata(null);
    } catch (error) {
      console.error('Error saving metadata:', error);
      toast.error('Failed to save metadata. Please try again.');
    }
  };

  const handleDiscardMetadata = () => {
    setPreviewMetadata(null);
    toast.info('Analysis results discarded');
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (onRename) {
      onRename(item.id, newName.trim());
      setIsRenaming(false);
      setNewName('');
      onClose();
    } else {
      // Default rename handler - update the files table
      try {
        const { error } = await supabase
          .from('files')
          .update({ original_name: newName.trim() })
          .eq('id', item.id);
        
        if (error) throw error;
        toast.success('Item renamed successfully');
        setIsRenaming(false);
        setNewName('');
        onClose();
        window.dispatchEvent(new CustomEvent('refetch-spaces'));
      } catch (error) {
        console.error('Error renaming item:', error);
        toast.error('Failed to rename item');
      }
    }
  };

  const handleAddHashtag = () => {
    if (!newHashtag.trim() || !previewMetadata) return;
    
    const cleanTag = newHashtag.trim().replace(/^#+/, '');
    if (!cleanTag) return;
    
    setPreviewMetadata({
      ...previewMetadata,
      hashtags: [...(previewMetadata.hashtags || []), cleanTag]
    });
    setNewHashtag('');
  };

  const handleRemoveHashtag = (index: number) => {
    if (!previewMetadata) return;
    
    setPreviewMetadata({
      ...previewMetadata,
      hashtags: previewMetadata.hashtags.filter((_, i) => i !== index)
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-4xl mx-4"
          >
            <Card className="glass-card border-white/20 overflow-hidden max-h-[90vh] flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 p-1 h-6 w-6"
                onClick={onClose}
              >
                <Close size={12} />
              </Button>

              {/* Header with Preview */}
              <div className="relative flex-shrink-0">
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="w-full h-32 object-cover"
                />
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'settings' | 'dials')} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="dials">Dials</TabsTrigger>
                </TabsList>

                {/* Settings Tab */}
                <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 mt-0">
                  {isRenaming ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Rename Item</h3>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter new name"
                      className="bg-background/50 border-white/20 text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRenameSubmit}
                        className="flex-1"
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setIsRenaming(false);
                          setNewName('');
                        }}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : showingDetails ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Item Details</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowingDetails(false)}
                      >
                        Back
                      </Button>
                    </div>
                    <MetadataDetailsPanel fileId={item.id} />
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold mb-4 break-words whitespace-normal">{item.title}</h3>

                    {/* Thumbnail Upload Section */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <Image size={14} className="text-primary" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Thumbnail</span>
                      </div>
                      <div className="bg-background/50 border border-white/10 rounded-lg p-3 space-y-2">
                        <button
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 rounded-lg transition-all duration-200"
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={uploadingThumbnail}
                        >
                          {uploadingThumbnail ? (
                            <>
                              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-medium text-foreground">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={16} className="text-foreground" />
                              <span className="text-xs font-medium text-foreground">Upload Thumbnail</span>
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

                        {uploadedThumbnails.length > 0 && (
                          <MediaCarousel
                            items={uploadedThumbnails}
                            mediaTypes={thumbnailMediaTypes}
                            onSelect={selectThumbnail}
                            onRemove={removeThumbnail}
                            selectedUrl={item.thumb}
                          />
                        )}
                      </div>
                    </div>

                    {/* 360 View Toggle */}
                    <div className="mb-4 p-3 bg-background/50 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe size={18} className="text-primary" />
                          <span className="text-sm font-medium">Display as 360°</span>
                        </div>
                        <Switch
                          checked={show360}
                          onCheckedChange={handle360Toggle}
                        />
                      </div>

                      {/* 360 Advanced Controls */}
                      {show360 && (
                        <div className="space-y-3 pt-3 border-t border-white/10">
                          <div className="space-y-1">
                            <label className="text-xs text-foreground/70">X-Axis Offset</label>
                            <Slider
                              value={[xAxis]}
                              onValueChange={(value) => setXAxis(value[0])}
                              onValueCommit={(value) => on360AxisChange?.(item.id, 'x', value[0])}
                              min={-90}
                              max={90}
                              step={1}
                            />
                            <span className="text-[10px] text-foreground/60">{xAxis}°</span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-foreground/70">Y-Axis Offset</label>
                            <Slider
                              value={[yAxis]}
                              onValueChange={(value) => setYAxis(value[0])}
                              onValueCommit={(value) => on360AxisChange?.(item.id, 'y', value[0])}
                              min={-90}
                              max={90}
                              step={1}
                            />
                            <span className="text-[10px] text-foreground/60">{yAxis}°</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {isMuted ? <VolumeX size={12} className="text-foreground" /> : <Volume2 size={12} className="text-foreground" />}
                              <span className="text-xs text-foreground">Audio</span>
                            </div>
                            <Switch
                              checked={!isMuted}
                              onCheckedChange={(checked) => {
                                setIsMuted(!checked);
                                on360MuteToggle?.(item.id, !checked);
                              }}
                            />
                          </div>

                          {!isMuted && (
                            <div className="space-y-1">
                              <label className="text-xs text-foreground/70">Volume</label>
                              <Slider
                                value={[volume]}
                                onValueChange={(value) => setVolume(value[0])}
                                onValueCommit={(value) => on360VolumeChange?.(item.id, value[0])}
                                min={0}
                                max={100}
                                step={1}
                              />
                              <span className="text-[10px] text-foreground/60">{volume}%</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground">Auto Rotate</span>
                            <Switch
                              checked={rotationEnabled}
                              onCheckedChange={(checked) => {
                                setRotationEnabled(checked);
                                on360RotationToggle?.(item.id, checked);
                              }}
                            />
                          </div>

                          {rotationEnabled && (
                            <div className="space-y-1">
                              <label className="text-xs text-foreground/70">Rotation Speed</label>
                              <Slider
                                value={[rotationSpeed]}
                                onValueChange={(value) => setRotationSpeed(value[0])}
                                onValueCommit={(value) => on360RotationSpeedChange?.(item.id, value[0])}
                                min={0.1}
                                max={5}
                                step={0.1}
                              />
                              <span className="text-[10px] text-foreground/60">{rotationSpeed.toFixed(1)}x</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground">Flip Horizontal</span>
                            <Switch
                              checked={flipHorizontal}
                              onCheckedChange={(checked) => {
                                setFlipHorizontal(checked);
                                onFlipHorizontalToggle?.(item.id, checked);
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground">Flip Vertical</span>
                            <Switch
                              checked={flipVertical}
                              onCheckedChange={(checked) => {
                                setFlipVertical(checked);
                                onFlipVerticalToggle?.(item.id, checked);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Play All Button Toggle */}
                    <div className="mb-4 p-3 bg-background/50 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Play size={18} className="text-primary" />
                          <span className="text-sm font-medium">Show Play All Button</span>
                        </div>
                        <Switch
                          checked={showPlayAllButton}
                          onCheckedChange={handlePlayAllButtonToggle}
                        />
                      </div>
                    </div>

                    {/* Action Options */}
                    <div className="space-y-1">
                      {actionOptions.map((option) => (
                        <Button
                          key={option.id}
                          variant={option.variant === 'destructive' ? 'destructive' : 'ghost'}
                          className="w-full justify-start gap-3 h-10"
                          onClick={() => handleActionClick(option.id)}
                        >
                          <option.icon size={18} />
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </>
                )}
                </TabsContent>

                {/* Dials Tab */}
                <TabsContent value="dials" className="flex-1 overflow-y-auto p-4 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-4">Data Observation System</h3>
                    
                    {loadingMetadata ? (
                      <div className="text-center py-8 text-muted-foreground">Loading metadata...</div>
                    ) : previewMetadata ? (
                      <div className="space-y-4">
                        <div className="border border-border rounded-lg p-4 bg-muted/50">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Generated Metadata Preview
                          </h3>
                          
                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">Hashtags:</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {previewMetadata.hashtags?.map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm flex items-center gap-1 group"
                                >
                                  #{tag}
                                  <button
                                    onClick={() => handleRemoveHashtag(idx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newHashtag}
                                onChange={(e) => setNewHashtag(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddHashtag();
                                  }
                                }}
                                placeholder="Add hashtag..."
                                className="flex-1 h-8 text-sm"
                              />
                              <Button 
                                onClick={handleAddHashtag}
                                size="sm"
                                className="h-8"
                                disabled={!newHashtag.trim()}
                              >
                                Add
                              </Button>
                            </div>
                          </div>

                          {previewMetadata.dial_values && Object.keys(previewMetadata.dial_values).length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Dial Values:</p>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(previewMetadata.dial_values).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={handleDiscardMetadata}>
                            Discard
                          </Button>
                          <Button onClick={handleSaveMetadata}>
                            Save Metadata
                          </Button>
                        </div>
                      </div>
                    ) : metadata.length > 0 ? (
                      <>
                        <DOSMindMap metadata={metadata} loading={loadingMetadata} />
                        <DOSHeatMap metadata={metadata} loading={loadingMetadata} />
                        <DOSCharts metadata={metadata} loading={loadingMetadata} />
                        <DOSVennDiagram metadata={metadata} loading={loadingMetadata} />
                      </>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <p className="text-muted-foreground">
                          No metadata available. Analyze this item to generate dial data.
                        </p>
                        <Button
                          onClick={handleAnalyzeItem}
                          disabled={isAnalyzing}
                          className="mx-auto"
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Item'}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}