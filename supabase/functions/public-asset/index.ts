import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');
    const storagePath = url.searchParams.get('storagePath');

    if (!fileId && !storagePath) {
      return new Response(
        JSON.stringify({ error: 'fileId or storagePath required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let finalStoragePath = storagePath;

    // If fileId provided, verify public space membership
    if (fileId) {
      const { data: spaceFiles, error: spaceError } = await supabase
        .from('space_files')
        .select(`
          file_id,
          space_id,
          spaces!inner(is_public, id)
        `)
        .eq('file_id', fileId);

      if (spaceError) {
        console.error('Error checking space membership:', spaceError);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if file belongs to at least one public space
      const isPublic = spaceFiles?.some((sf: any) => sf.spaces?.is_public === true);
      
      if (!isPublic) {
        return new Response(
          JSON.stringify({ error: 'Not found or not public' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get file's storage path
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fileError || !fileData) {
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      finalStoragePath = fileData.storage_path;
    }

    if (!finalStoragePath) {
      return new Response(
        JSON.stringify({ error: 'No storage path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect bucket
    let bucket = 'user-files';
    let normalizedPath = finalStoragePath;
    
    if (finalStoragePath.startsWith('space-covers/')) {
      bucket = 'space-covers';
      normalizedPath = finalStoragePath.replace(/^space-covers\//, '');
    } else if (finalStoragePath.startsWith('profile-media/')) {
      bucket = 'profile-media';
      normalizedPath = finalStoragePath.replace(/^profile-media\//, '');
    } else if (finalStoragePath.startsWith('user-files/')) {
      normalizedPath = finalStoragePath.replace(/^user-files\//, '');
    }

    // For public buckets, redirect to public URL
    if (bucket === 'space-covers' || bucket === 'profile-media') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': data.publicUrl,
          'Cache-Control': 'public, max-age=300',
        }
      });
    }

    // For private buckets, generate short-lived signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, 900); // 15 minutes

    if (signError || !signedData?.signedUrl) {
      console.error('Error creating signed URL:', signError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 302 redirect to signed URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': signedData.signedUrl,
        'Cache-Control': 'public, max-age=300',
      }
    });

  } catch (error) {
    console.error('public-asset error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
