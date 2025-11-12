import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileId, storagePath, mimeType } = await req.json();

    if (!fileId || !storagePath || !mimeType) {
      throw new Error('Missing required parameters');
    }

    let thumbnailPath: string | null = null;

    // Only generate thumbnails for images and videos
    if (mimeType.startsWith('image/')) {
      // Normalize storage path (remove bucket prefix if present)
      const normalizedPath = storagePath.replace(/^user-files\//, '');
      
      // Download the file from private storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('user-files')
        .download(normalizedPath);

      if (downloadError) throw downloadError;

      // Upload to PUBLIC bucket (space-covers) for web-optimized access
      const publicThumbnailPath = `thumbnails/${fileId}.jpg`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('space-covers')
        .upload(publicThumbnailPath, fileData, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Store path WITH bucket prefix for consistency
      thumbnailPath = `space-covers/${publicThumbnailPath}`;

    } else if (mimeType.startsWith('video/')) {
      // For videos, we'll extract the first frame as thumbnail
      // This requires ffmpeg which isn't available in edge functions
      // So we'll skip video thumbnail generation for now
      thumbnailPath = null;
    }

    // Update the file record with PUBLIC thumbnail path
    if (thumbnailPath) {
      const { error: updateError } = await supabaseClient
        .from('files')
        .update({ thumbnail_path: thumbnailPath })
        .eq('id', fileId);

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, thumbnailPath }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
