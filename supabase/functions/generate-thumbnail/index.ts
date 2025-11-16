import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getDocument } from "https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.mjs";

// PDF.js worker configuration
const PDFJS_WORKER_URL = "https://esm.sh/pdfjs-dist@4.10.38/legacy/build/pdf.worker.min.mjs";

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

    // Generate thumbnails for images, videos, and PDFs
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
    } else if (mimeType === 'application/pdf') {
      console.log('Generating PDF thumbnail for:', fileId);
      
      // Normalize storage path
      const normalizedPath = storagePath.replace(/^user-files\//, '');
      
      // Download the PDF file
      const { data: pdfData, error: downloadError } = await supabaseClient.storage
        .from('user-files')
        .download(normalizedPath);

      if (downloadError) throw downloadError;

      // Convert blob to array buffer
      const arrayBuffer = await pdfData.arrayBuffer();
      
      // Load PDF document
      const loadingTask = getDocument({
        data: new Uint8Array(arrayBuffer),
        workerSrc: PDFJS_WORKER_URL,
      });
      
      const pdf = await loadingTask.promise;
      console.log('PDF loaded, pages:', pdf.numPages);
      
      // Get first page
      const page = await pdf.getPage(1);
      
      // Set viewport scale for good quality thumbnail
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas using OffscreenCanvas (available in Deno)
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Could not get canvas context');
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      console.log('PDF page rendered to canvas');
      
      // Convert canvas to blob
      const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.85,
      });
      
      // Upload thumbnail to public bucket
      const publicThumbnailPath = `thumbnails/${fileId}.jpg`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('space-covers')
        .upload(publicThumbnailPath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;
      
      console.log('PDF thumbnail uploaded:', publicThumbnailPath);

      // Store path WITH bucket prefix for consistency
      thumbnailPath = `space-covers/${publicThumbnailPath}`;
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
