import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close, Share, Users } from '../icons';
import { Card } from '../ui/card';
import { Trash2, Edit3, Download, Copy, Eye, ScanEye } from 'lucide-react';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MetadataDetailsPanel } from './MetadataDetailsPanel';

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
  onView360?: (itemId: string) => void;
  spaceId?: string;
}

interface ActionOption {
  id: string;
  label: string;
  icon: any;
  variant?: 'default' | 'destructive';
}

export function DialPopup({ isOpen, item, onClose, onUseAsFilters, onDelete, onRename, onView360, spaceId }: DialPopupProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [showingDetails, setShowingDetails] = useState(false);
  const [show360, setShow360] = useState(false);

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

  // Fetch 360 state when popup opens
  useEffect(() => {
    if (isOpen && spaceId) {
      const fetch360State = async () => {
        const { data } = await supabase
          .from('spaces')
          .select('show_360')
          .eq('id', spaceId)
          .single();
        
        if (data) {
          setShow360(data.show_360 || false);
        }
      };
      fetch360State();
    }
  }, [isOpen, spaceId]);

  // Reset rename state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setIsRenaming(false);
      setNewName('');
      setShowingDetails(false);
    }
  }, [isOpen]);

  if (!item) return null;

  const actionOptions: ActionOption[] = [
    ...(onView360 ? [{ id: '360', label: 'View as 360', icon: ScanEye }] : []),
    { id: 'rename', label: 'Rename', icon: Edit3 },
    { id: 'details', label: 'Show Details', icon: Eye },
    { id: 'duplicate', label: 'Duplicate', icon: Copy },
    { id: 'share', label: 'Share', icon: Share },
    { id: 'connect', label: 'Connect', icon: Users },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive' },
  ];

  const handleActionClick = async (actionId: string) => {
    console.log('Action clicked:', actionId, 'for item:', item.id);
    
    switch (actionId) {
      case '360':
        onView360?.(item.id);
        onClose();
        break;

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
        
      default:
        toast.info(`${actionId} feature coming soon`);
        onClose();
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

  const handle360Toggle = async (checked: boolean) => {
    if (!spaceId) return;
    
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ show_360: checked })
        .eq('id', spaceId);
      
      if (error) throw error;
      setShow360(checked);
      toast.success(`360 view ${checked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling 360:', error);
      toast.error('Failed to toggle 360 view');
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
            className="relative z-10 w-80"
          >
            <Card className="glass-card border-white/20 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 p-1 h-6 w-6"
                onClick={onClose}
              >
                <Close size={12} />
              </Button>

              {/* Item Preview */}
              <div className="relative">
                <img
                  src={item.thumb}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              </div>

              <div className="p-4">
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

                    {/* 360 Toggle */}
                    {spaceId && (
                      <div className="flex items-center justify-between p-3 mb-3 bg-background/50 rounded-md border border-white/10">
                        <Label htmlFor="360-toggle" className="cursor-pointer flex items-center gap-2">
                          <ScanEye size={18} />
                          <span>360° View</span>
                        </Label>
                        <Switch
                          id="360-toggle"
                          checked={show360}
                          onCheckedChange={handle360Toggle}
                        />
                      </div>
                    )}

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
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}