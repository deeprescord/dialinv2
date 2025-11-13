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

    // Accept spaceId via JSON body or query param
    let spaceId: string | null = null;
    try {
      const url = new URL(req.url);
      spaceId = url.searchParams.get('spaceId');
    } catch {}

    if (!spaceId && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.json();
        spaceId = body?.spaceId ?? null;
      } catch {}
    }

    if (!spaceId) {
      return new Response(
        JSON.stringify({ error: 'spaceId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the space is public
    const { data: space, error: spaceErr } = await supabase
      .from('spaces')
      .select('id, is_public')
      .eq('id', spaceId)
      .single();

    if (spaceErr) {
      console.error('public-space-items: space lookup error', spaceErr);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!space || !space.is_public) {
      return new Response(
        JSON.stringify({ error: 'Not found or not public' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch child public spaces (only expose public children)
    const { data: childSpaces, error: childErr } = await supabase
      .from('spaces')
      .select('id, name, created_at, thumbnail_url, cover_url, position, is_public')
      .eq('parent_id', spaceId)
      .eq('is_public', true)
      .order('position', { ascending: true })
      .limit(100);

    if (childErr) {
      console.error('public-space-items: child spaces error', childErr);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch files attached to this space
    const { data: spaceFiles, error: filesErr } = await supabase
      .from('space_files')
      .select(`
        file_id,
        position,
        files!inner(
          id,
          original_name,
          file_type,
          mime_type,
          storage_path,
          thumbnail_path,
          duration,
          created_at,
          file_size
        )
      `)
      .eq('space_id', spaceId)
      .order('position', { ascending: true })
      .limit(200);

    if (filesErr) {
      console.error('public-space-items: files error', filesErr);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map to SpaceItem[] shape used by frontend
    const items: any[] = [];

    for (const sp of childSpaces || []) {
      items.push({
        id: sp.id,
        original_name: sp.name,
        file_type: 'space',
        created_at: sp.created_at,
        is_space: true,
        space_name: sp.name,
        thumbnail_path: sp.thumbnail_url || sp.cover_url || null,
        position: sp.position || 0,
      });
    }

    for (const sf of spaceFiles || []) {
      const f = (sf as any).files;
      items.push({
        id: f.id,
        file_id: f.id,
        original_name: f.original_name,
        file_type: f.file_type,
        mime_type: f.mime_type,
        storage_path: f.storage_path,
        thumbnail_path: f.thumbnail_path || null,
        duration: f.duration || null,
        created_at: f.created_at,
        is_space: false,
        position: (sf as any).position || 0,
        file_size: f.file_size || 0,
      });
    }

    return new Response(
      JSON.stringify({ items }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=15' } }
    );
  } catch (error) {
    console.error('public-space-items error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
