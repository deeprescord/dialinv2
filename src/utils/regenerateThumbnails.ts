import { supabase } from '@/integrations/supabase/client';

/**
 * Regenerates thumbnails for all image files that don't have them
 */
export async function regenerateAllThumbnails() {
  try {
    // Get all image files without thumbnails
    const { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('file_type', 'image')
      .is('thumbnail_path', null);

    if (error) {
      console.error('Error fetching files:', error);
      return { success: false, error };
    }

    if (!files || files.length === 0) {
      console.log('No files need thumbnail generation');
      return { success: true, count: 0 };
    }

    console.log(`Generating thumbnails for ${files.length} images...`);

    // Generate thumbnails in parallel (max 5 at a time)
    const batchSize = 5;
    let processed = 0;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (file) => {
          try {
            const { error: thumbError } = await supabase.functions.invoke('generate-thumbnail', {
              body: {
                fileId: file.id,
                storagePath: file.storage_path,
                mimeType: file.mime_type || 'image/jpeg'
              }
            });

            if (thumbError) {
              console.warn(`Thumbnail generation failed for ${file.id}:`, thumbError);
            } else {
              processed++;
            }
          } catch (err) {
            console.warn(`Error generating thumbnail for ${file.id}:`, err);
          }
        })
      );
    }

    console.log(`Successfully generated ${processed} thumbnails`);
    return { success: true, count: processed };
    
  } catch (error) {
    console.error('Error in regenerateAllThumbnails:', error);
    return { success: false, error };
  }
}
