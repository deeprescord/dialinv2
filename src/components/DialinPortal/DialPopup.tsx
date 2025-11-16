import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close, Share, Users, Smile, Plus } from '../icons';
import { Card } from '../ui/card';
import { Trash2, Edit3, Download, Copy, Eye, Globe, Play } from 'lucide-react';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MetadataDetailsPanel } from './MetadataDetailsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { DOSMindMap } from './DOSMindMap';
import { DOSHeatMap } from './DOSHeatMap';
import { DOSCharts } from './DOSCharts';
import { DOSVennDiagram } from './DOSVennDiagram';
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
}

interface ActionOption {
  id: string;
  label: string;
  icon: any;
  variant?: 'default' | 'destructive';
}

export function DialPopup({ isOpen, item, onClose, onUseAsFilters, onDelete, onRename, on360Toggle }: DialPopupProps) {
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
            .select('show_360, show_play_all_button')
            .eq('id', item.id)
            .maybeSingle();
          
          if (data && !error) {
            setShow360(data.show_360 || false);
            setShowPlayAllButton(data.show_play_all_button || false);
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
      // Trigger a refetch to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error updating play all button setting:', error);
      toast.error('Failed to update play all button setting');
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
            // Trigger a refetch
            window.location.reload();
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

      toast.success('Analysis complete! Metadata has been generated.');
      
      // Refresh metadata
      const { data: newMetadata, error: fetchError } = await supabase
        .from('item_metadata')
        .select('*')
        .eq('file_id', item.id)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      setMetadata(newMetadata || []);
    } catch (error) {
      console.error('Error analyzing item:', error);
      toast.error('Failed to analyze item. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
        // Trigger a refetch
        window.location.reload();
      } catch (error) {
        console.error('Error renaming item:', error);
        toast.error('Failed to rename item');
      }
    }
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

                    {/* 360 View Toggle */}
                    <div className="mb-4 p-3 bg-background/50 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe size={18} className="text-primary" />
                          <span className="text-sm font-medium">Display as 360°</span>
                        </div>
                        <Switch
                          checked={show360}
                          onCheckedChange={handle360Toggle}
                        />
                      </div>
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