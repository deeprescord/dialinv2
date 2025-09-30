import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FileUploadResult {
  id: string;
  storage_path: string;
  original_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  thumbnail_path?: string;
  duration?: number;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, spaceId: string): Promise<FileUploadResult | null> => {
    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload files');
        return null;
      }

      // Generate unique filename with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file');
        return null;
      }

      // Create file metadata record
      const fileMetadata = {
        owner_id: user.id,
        storage_path: uploadData.path,
        original_name: file.name,
        file_type: getFileType(file.type),
        file_size: file.size,
        mime_type: file.type,
      };

      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert(fileMetadata)
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file
        await supabase.storage.from('user-files').remove([uploadData.path]);
        toast.error('Failed to save file metadata');
        return null;
      }

      // Add file to the specified space
      const { error: spaceError } = await supabase
        .from('space_files')
        .insert({
          space_id: spaceId,
          file_id: fileRecord.id,
          added_by: user.id,
        });

      if (spaceError) {
        console.error('Space assignment error:', spaceError);
        toast.error('Failed to add file to space');
        return null;
      }

      toast.success(`File "${file.name}" uploaded successfully`);
      return fileRecord;

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[], spaceId: string): Promise<FileUploadResult[]> => {
    const results: FileUploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, spaceId);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    uploading,
  };
}

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('text/') || mimeType.includes('document')) return 'document';
  return 'other';
}