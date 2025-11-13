import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SetThumbnailModalProps {
  fileId: string;
  currentThumb?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SetThumbnailModal({ fileId, currentThumb, isOpen, onClose, onSaved }: SetThumbnailModalProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Upload to space-covers/thumbnails/{fileId}.jpg
      const fileName = `thumbnails/${fileId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('space-covers')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update files.thumbnail_path
      const thumbnailPath = `space-covers/${fileName}`;
      const { error: updateError } = await supabase
        .from('files')
        .update({ thumbnail_path: thumbnailPath })
        .eq('id', fileId);

      if (updateError) throw updateError;

      toast.success('Thumbnail updated successfully');
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      toast.error('Failed to update thumbnail');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Custom Thumbnail</DialogTitle>
          <DialogDescription>
            Upload a custom thumbnail image for this item. This will be visible in public spaces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          {(previewUrl || currentThumb) && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl || currentThumb}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Upload Button */}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              id="thumbnail-upload"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('thumbnail-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
