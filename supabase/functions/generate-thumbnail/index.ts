import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateAIThumbnail(fileName: string, fileType: string): Promise<string | null> {
  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not set');
      return null;
    }

    // Create a descriptive prompt based on file type
    let prompt = `Create a minimalist, professional thumbnail icon for a ${fileType} file named "${fileName}". `;
    
    if (fileType === 'document') {
      prompt += 'Modern document icon with clean lines, use blue and white colors.';
    } else if (fileType === 'audio') {
      prompt += 'Stylish audio waveform visualization, use purple and cyan gradient.';
    } else if (fileType === 'video') {
      prompt += 'Modern play button on film reel background, use red and black colors.';
    } else if (fileType === 'web') {
      prompt += 'Globe or link icon with modern design, use green and blue colors.';
    } else {
      prompt += 'Generic file icon with modern, clean aesthetic.';
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{
          role: 'user',
          content: prompt
        }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('AI image generation failed:', await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    return imageUrl || null;
  } catch (error) {
    console.error('Error generating AI thumbnail:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { fileId, storagePath, mimeType, fileName, fileType } = await req.json();

    if (!fileId) {
      throw new Error('Missing fileId parameter');
    }

    console.log('Generating thumbnail for:', { fileId, fileName, fileType, mimeType });

    let thumbnailPath: string | null = null;

    // Generate thumbnails for images
    if (mimeType && mimeType.startsWith('image/')) {
      if (!storagePath) {
        throw new Error('storagePath required for image thumbnails');
      }

      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('user-files')
        .download(storagePath);

      if (downloadError) {
        console.error('Download error:', downloadError);
        throw downloadError;
      }

      // Generate thumbnail filename
      const pathParts = storagePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userId = pathParts[0];
      thumbnailPath = `${userId}/thumbnails/thumb_${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('user-files')
        .upload(thumbnailPath, fileData, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Image thumbnail created:', thumbnailPath);
    } 
    // Generate AI thumbnails for non-image files
    else if (fileType && fileName) {
      const base64Image = await generateAIThumbnail(fileName, fileType);
      
      if (base64Image) {
        // Extract base64 data and convert to blob
        const base64Data = base64Image.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Get user ID from file record
        const { data: fileRecord } = await supabaseClient
          .from('files')
          .select('owner_id')
          .eq('id', fileId)
          .single();

        if (fileRecord?.owner_id) {
          const userId = fileRecord.owner_id;
          const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          thumbnailPath = `${userId}/thumbnails/ai_thumb_${sanitizedName}.png`;

          const { error: uploadError } = await supabaseClient.storage
            .from('user-files')
            .upload(thumbnailPath, binaryData, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            console.error('AI thumbnail upload error:', uploadError);
          } else {
            console.log('AI thumbnail created:', thumbnailPath);
          }
        }
      }
    }

    // Update the file record with thumbnail path
    if (thumbnailPath) {
      const { error: updateError } = await supabaseClient
        .from('files')
        .update({ thumbnail_path: thumbnailPath })
        .eq('id', fileId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Thumbnail path updated in database');
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
