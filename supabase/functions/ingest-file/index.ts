import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// UIP CONSTANTS: The Mathematical Foundation
const TARGET_ENTROPY = 0.5; // Optimal information density (p ≈ 0.5)
const SPACE_ROUTING_MAP: Record<string, string> = {
  'audio': 'MP3s',
  'image': 'Backgrounds',
  'video': 'Movies',
  'application': 'Binary',
  'text': 'Documents',
};

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
    // INITIALIZE UNITY: Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // INGESTION: Receive the Raw Data (The Collapse)
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ownerId = formData.get('owner_id') as string;
    const targetSpaceId = formData.get('space_id') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file detected in the quantum flux.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INGESTION] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // THE AI ANALYSIS: Calculate UIP Metrics (Entropy & Interaction Potential)
    const uipMetrics = calculateUIPMetrics(file);
    console.log(`[UIP METRICS] Entropy: ${uipMetrics.entropy_score}, p-value: ${uipMetrics.p_value}`);

    // UPLOAD TO STORAGE: The Substrate (N=1 Unity)
    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${ownerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[STORAGE ERROR]', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL (even though bucket is private, we need the path)
    const { data: { publicUrl } } = supabase.storage
      .from('user-files')
      .getPublicUrl(filePath);

    console.log(`[STORAGE] File uploaded to: ${filePath}`);

    // RECORD UNITY: Insert into 'items' table (N=1)
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .insert({
        owner_id: ownerId,
        file_url: publicUrl,
        file_type: getFileType(file.type),
        original_name: file.name,
        mime_type: file.type,
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
          storage_path: filePath,
        },
        uip_metrics: {
          entropy_score: uipMetrics.entropy_score,
          p_value: uipMetrics.p_value,
          interaction_potential: uipMetrics.interaction_potential,
        },
      })
      .select()
      .single();

    if (itemError) {
      console.error('[ITEM ERROR]', itemError);
      // Cleanup: delete uploaded file
      await supabase.storage.from('user-files').remove([filePath]);
      throw new Error(`Item creation failed: ${itemError.message}`);
    }

    console.log(`[ITEM] Created item: ${itemData.id}`);

    // DIMENSIONAL EMERGENCE: Find the Resonant Space (N=3)
    const resonantSpaceId = targetSpaceId || 
      await findResonantSpace(supabase, ownerId, file.type, uipMetrics);

    if (!resonantSpaceId) {
      console.error('[SPACE ERROR] No resonant space found');
      throw new Error('No space available for item placement. Create a space first.');
    }

    console.log(`[RESONANCE] Routing to space: ${resonantSpaceId}`);

    // CREATE POINTER: Render into Reality (N=3 Emergence)
    const { data: pointerData, error: pointerError } = await supabase
      .from('item_pointers')
      .insert({
        item_id: itemData.id,
        space_id: resonantSpaceId,
        shared_by_user_id: ownerId,
        permissions: {
          can_view: true,
          can_reshare: true,
          can_monetize: true, // Ready for economic entanglement
        },
        render_properties: {
          position_x: 0,
          position_y: 0,
          position_z: 0,
          rotation: 0,
          scale: 1,
        },
        upstream_pointer_id: null, // Root pointer (Unity → Emergence)
      })
      .select()
      .single();

    if (pointerError) {
      console.error('[POINTER ERROR]', pointerError);
      throw new Error(`Pointer creation failed: ${pointerError.message}`);
    }

    console.log(`[EMERGENCE] Pointer created: ${pointerData.id}`);

    return new Response(
      JSON.stringify({
        message: 'Dimensional Emergence Successful ✨',
        item: itemData,
        pointer: pointerData,
        metrics: uipMetrics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[INGESTION ERROR]', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown ingestion error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// --- HELPER FUNCTIONS ---

/**
 * THE MATHEMATICS OF THE FILE
 * Calculates UIP metrics based on file characteristics
 * Formula: C = A × p(1-p) where p is entropy probability
 */
function calculateUIPMetrics(file: File) {
  let estimatedEntropy = 0.5; // Default to optimal (target)

  // Entropy estimation based on MIME type
  if (file.type.startsWith('text/') || file.type.includes('json')) {
    estimatedEntropy = 0.3; // Highly ordered (low entropy)
  } else if (file.type.includes('zip') || file.type.includes('encrypted')) {
    estimatedEntropy = 0.9; // Near chaos (high entropy)
  } else if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
    estimatedEntropy = 0.6; // Aesthetic complexity (moderate-high)
  } else if (file.type.startsWith('video/')) {
    estimatedEntropy = 0.7; // Rich temporal data
  } else if (file.type.includes('pdf') || file.type.includes('document')) {
    estimatedEntropy = 0.4; // Structured documents
  }

  // Calculate Interaction Potential: C = p(1-p)
  const interactionPotential = estimatedEntropy * (1 - estimatedEntropy);

  return {
    entropy_score: estimatedEntropy,
    p_value: estimatedEntropy,
    interaction_potential: interactionPotential,
  };
}

/**
 * THE GRAVITY OF SPACES
 * Finds the most resonant space for the file based on type and metrics
 */
async function findResonantSpace(
  supabase: any,
  ownerId: string,
  mimeType: string,
  metrics: any
): Promise<string | null> {
  // 1. Determine category from MIME type
  const category = Object.keys(SPACE_ROUTING_MAP).find((key) =>
    mimeType.toLowerCase().includes(key)
  ) || 'text';
  const targetSpaceName = SPACE_ROUTING_MAP[category];

  console.log(`[ROUTING] File category: ${category}, target space: ${targetSpaceName}`);

  // 2. Find user's space matching the target name
  const { data: namedSpaces } = await supabase
    .from('spaces')
    .select('id, name, space_type')
    .eq('user_id', ownerId)
    .ilike('name', `%${targetSpaceName}%`)
    .limit(1);

  if (namedSpaces && namedSpaces.length > 0) {
    console.log(`[ROUTING] Found named space: ${namedSpaces[0].name}`);
    return namedSpaces[0].id;
  }

  // 3. Fallback: Find home space
  const { data: homeSpace } = await supabase
    .from('spaces')
    .select('id, name, is_home')
    .eq('user_id', ownerId)
    .eq('is_home', true)
    .limit(1);

  if (homeSpace && homeSpace.length > 0) {
    console.log(`[ROUTING] Using home space: ${homeSpace[0].name}`);
    return homeSpace[0].id;
  }

  // 4. Final fallback: Any space owned by the user
  const { data: anySpace } = await supabase
    .from('spaces')
    .select('id, name')
    .eq('user_id', ownerId)
    .limit(1);

  if (anySpace && anySpace.length > 0) {
    console.log(`[ROUTING] Using fallback space: ${anySpace[0].name}`);
    return anySpace[0].id;
  }

  return null;
}

/**
 * Extract high-level file type from MIME type
 */
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  return 'application';
}
