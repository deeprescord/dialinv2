import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Close, Share, Users, Smile, Plus } from '../icons';
import { Card } from '../ui/card';
import { Trash2, Edit3, Download, Copy, Eye } from 'lucide-react';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface ActionOption {
  id: string;
  label: string;
  icon: any;
  variant?: 'default' | 'destructive';
}

export function DialPopup({ isOpen, item, onClose, onUseAsFilters, onDelete, onRename }: DialPopupProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');

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
    }
  }, [isOpen]);

  if (!item) return null;

  const actionOptions: ActionOption[] = [
    { id: 'rename', label: 'Rename', icon: Edit3 },
    { id: 'view', label: 'View Details', icon: Eye },
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
                ) : (
                  <>
                    <h3 className="font-semibold mb-4 break-words whitespace-normal">{item.title}</h3>

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