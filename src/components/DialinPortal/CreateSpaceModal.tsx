import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, coverUrl: string, parentId?: string) => void;
  parentId?: string;
}

const defaultCover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=120&fit=crop&auto=format';

export function CreateSpaceModal({ isOpen, onClose, onCreate, parentId }: CreateSpaceModalProps) {
  const [spaceName, setSpaceName] = useState('');
  const [coverUrl, setCoverUrl] = useState(defaultCover);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image or video
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');

    if (!isVideoFile && !isImageFile) {
      toast.error('Please select an image or video file');
      return;
    }

    setUploading(true);
    setIsVideo(isVideoFile);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/space-covers/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-files')
        .getPublicUrl(data.path);

      setCoverUrl(publicUrl);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success('Background uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = () => {
    if (spaceName.trim()) {
      onCreate(spaceName.trim(), coverUrl, parentId);
      setSpaceName('');
      setCoverUrl(defaultCover);
      setPreviewUrl(null);
      setIsVideo(false);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && spaceName.trim()) {
      handleCreate();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-md bg-background/95 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Create New Space</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-foreground/80">
                  Space Name
                </label>
                <Input
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter space name..."
                  className="bg-background/50 border-white/20 focus:border-primary h-12 text-base"
                  autoFocus
                />
              </div>

              {/* Background Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 text-foreground/80">
                  Background (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-3">
                  {previewUrl ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
                      {isVideo ? (
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => {
                          setPreviewUrl(null);
                          setCoverUrl(defaultCover);
                          setIsVideo(false);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-background/30 hover:bg-background/50 transition-all flex flex-col items-center justify-center gap-3 text-foreground/60 hover:text-foreground/80"
                    >
                      {uploading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={32} />
                          <div className="text-center">
                            <div className="font-medium">Upload background</div>
                            <div className="text-sm flex items-center gap-2 justify-center mt-1">
                              <ImageIcon size={14} />
                              <span>Image</span>
                              <span className="text-white/20">|</span>
                              <Video size={14} />
                              <span>Video</span>
                            </div>
                          </div>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-12 border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={!spaceName.trim() || uploading}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Create Space
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}