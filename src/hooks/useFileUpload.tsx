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

export interface DialSuggestion {
  key: string;
  label: string;
  type: 'slider' | 'select';
  value: any;
  options?: string[];
}

export interface AIMetadata {
  hashtags: string[];
  dial_values: Record<string, any>;
  suggested_dials: DialSuggestion[];
  confidence: number;
  suggested_spaces: string[];
  fallback?: boolean;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);

  const analyzeWithAI = async (file: File, fileId: string): Promise<AIMetadata | null> => {
    setAnalyzingWithAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-item', {
        body: {
          fileId,
          fileName: file.name,
          fileType: getFileType(file.type),
          mimeType: file.type
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        toast.error('AI analysis failed, using defaults');
        return null;
      }

      return data as AIMetadata;
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const saveMetadata = async (
    fileId: string,
    hashtags: string[],
    dialValues: Record<string, any>,
    aiGenerated: boolean,
    confidence: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found when saving metadata');
        return;
      }

      // Sanitize inputs
      const safeHashtags = Array.isArray(hashtags) ? hashtags.filter((h) => typeof h === 'string').map((h) => h.trim()).slice(0, 50) : [];
      const safeDialValues = dialValues && typeof dialValues === 'object' ? dialValues : {};
      const safeConfidence = Number.isFinite(confidence) ? confidence : 0;

      // If a row already exists for this user+file, update it instead of inserting
      const { data: existing, error: selectError } = await supabase
        .from('item_metadata')
        .select('id')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.warn('Select existing metadata failed (continuing with insert):', selectError);
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('item_metadata')
          .update({
            hashtags: safeHashtags,
            dial_values: safeDialValues,
            ai_generated: aiGenerated,
            ai_confidence: safeConfidence,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Failed to update metadata:', updateError);
          toast.error(`Failed to save metadata: ${updateError.message || 'Unknown error'}`);
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('item_metadata')
          .insert({
            file_id: fileId,
            user_id: user.id,
            hashtags: safeHashtags,
            dial_values: safeDialValues,
            ai_generated: aiGenerated,
            ai_confidence: safeConfidence,
          });

        if (insertError) {
          console.error('Failed to insert metadata:', insertError);
          toast.error(`Failed to save metadata: ${insertError.message || 'Unknown error'}`);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error in saveMetadata:', error);
      toast.error(`Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

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
        .from('user_files')
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
        await supabase.storage.from('user_files').remove([uploadData.path]);
        toast.error('Failed to save file metadata');
        return null;
      }

      // Generate thumbnail in background (don't wait for it)
      if (file.type.startsWith('image/')) {
        supabase.functions.invoke('generate-thumbnail', {
          body: {
            fileId: fileRecord.id,
            storagePath: uploadData.path,
            mimeType: file.type
          }
        }).catch(err => console.warn('Thumbnail generation failed:', err));
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

      // Show prominent success notification
      toast.success(`✓ ${file.name} added to space!`, {
        duration: 3000,
        position: 'bottom-center',
      });
      
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
    analyzingWithAI,
    analyzeWithAI,
    saveMetadata,
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