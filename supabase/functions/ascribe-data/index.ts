import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get request data
    const { pointerId, fileMetadata } = await req.json();
    
    if (!pointerId || !fileMetadata) {
      throw new Error('pointerId and fileMetadata are required');
    }

    console.log(`Ascribing data for pointer ${pointerId}`, fileMetadata);

    // Verify the pointer belongs to the user's space
    const { data: pointer, error: pointerError } = await supabase
      .from('item_pointers')
      .select('*, spaces(user_id)')
      .eq('id', pointerId)
      .single();

    if (pointerError || !pointer) {
      throw new Error('Pointer not found');
    }

    if ((pointer as any).spaces?.user_id !== user.id) {
      throw new Error('Unauthorized to ascribe data to this pointer');
    }

    // AI ANALYSIS using Lovable AI
    const ascription = await analyzeContentWithAI(fileMetadata);

    console.log('AI ascription result:', ascription);

    // Generate genesis contract terms
    const defaultTerms = {
      price: ascription.suggestedPrice,
      currency: "USD",
      royalty_percent: ascription.royaltyPercent || 0,
      license_type: ascription.licenseType,
      access_duration: ascription.accessDuration || "infinite",
      reshare_allowed: ascription.reshareAllowed !== false,
      is_monetizable: ascription.confidence > 0.7,
      ai_confidence: ascription.confidence,
      reasoning: ascription.reasoning
    };

    // Insert the genesis contract
    const { data: contract, error: contractError } = await supabase
      .from('smart_contracts')
      .insert({
        target_pointer_id: pointerId,
        contract_type: ascription.contractType || 'one_time_purchase',
        terms: defaultTerms,
        status: 'draft' // User must confirm to activate
      })
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      throw contractError;
    }

    console.log(`Created genesis contract ${contract.id} for pointer ${pointerId}`);

    return new Response(
      JSON.stringify({ 
        message: 'Data ascription successful',
        contract,
        ascription
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ascribe-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// AI-powered content analysis using Lovable AI
async function analyzeContentWithAI(fileMetadata: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not configured, using fallback heuristics');
    return fallbackAnalysis(fileMetadata);
  }

  const systemPrompt = `You are an AI that analyzes digital content and suggests economic models for monetization.
Analyze the file metadata and determine:
1. The most appropriate contract type (subscription, one_time_purchase, royalty_split, bounty)
2. A suggested price in USD
3. The license type (lease, exclusive, viral_share, access, etc.)
4. Whether royalties should apply (and what percentage)
5. Access duration (infinite, monthly, yearly)
6. Whether resharing should be allowed
7. Your confidence level (0.0-1.0)
8. Brief reasoning for your suggestions

Consider:
- Audio files (music, beats) → royalty_split with lease licensing
- Images (memes, art) → viral_share with tip jar model (price: 0)
- Video → one_time_purchase or subscription
- Documents/PDFs → subscription with access licensing
- Code/Software → license-based with royalties
- High entropy/complexity → higher value`;

  const userPrompt = `File Metadata:
Type: ${fileMetadata.file_type || fileMetadata.mime_type}
Name: ${fileMetadata.original_name || fileMetadata.name}
Size: ${fileMetadata.file_size || fileMetadata.size} bytes
${fileMetadata.duration ? `Duration: ${fileMetadata.duration}s` : ''}

Analyze this file and suggest economic terms.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_contract_terms',
            description: 'Generate smart contract terms for digital content',
            parameters: {
              type: 'object',
              properties: {
                contractType: {
                  type: 'string',
                  enum: ['subscription', 'one_time_purchase', 'royalty_split', 'bounty'],
                  description: 'The type of smart contract'
                },
                suggestedPrice: {
                  type: 'number',
                  description: 'Suggested price in USD'
                },
                licenseType: {
                  type: 'string',
                  description: 'Type of license (lease, exclusive, viral_share, access, etc.)'
                },
                royaltyPercent: {
                  type: 'number',
                  description: 'Royalty percentage (0-100) for royalty_split contracts'
                },
                accessDuration: {
                  type: 'string',
                  description: 'How long access is granted (infinite, monthly, yearly)'
                },
                reshareAllowed: {
                  type: 'boolean',
                  description: 'Whether resharing is allowed'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence level in suggestions (0.0-1.0)'
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of the suggestions'
                }
              },
              required: ['contractType', 'suggestedPrice', 'licenseType', 'confidence', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_contract_terms' } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded for AI analysis');
      }
      if (response.status === 402) {
        throw new Error('AI credits depleted, please add funds');
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const terms = JSON.parse(toolCall.function.arguments);
      console.log('AI generated terms:', terms);
      return terms;
    }

    throw new Error('No tool call in AI response');

  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback to heuristic analysis
    return fallbackAnalysis(fileMetadata);
  }
}

// Fallback heuristic analysis when AI is unavailable
function fallbackAnalysis(meta: any): any {
  const mimeType = meta.file_type || meta.mime_type || '';
  const name = meta.original_name || meta.name || '';

  // Audio files: Beat/Music → Royalty model
  if (mimeType.includes('audio')) {
    return {
      contractType: 'royalty_split',
      suggestedPrice: 29.99,
      licenseType: 'lease',
      royaltyPercent: 5,
      accessDuration: 'infinite',
      reshareAllowed: false,
      confidence: 0.8,
      reasoning: 'Audio content typically benefits from royalty-based licensing'
    };
  }

  // Images: Potential viral content → Tip jar model
  if (mimeType.includes('image')) {
    return {
      contractType: 'one_time_purchase',
      suggestedPrice: 0,
      licenseType: 'viral_share',
      accessDuration: 'infinite',
      reshareAllowed: true,
      confidence: 0.7,
      reasoning: 'Images benefit from viral sharing with optional tips'
    };
  }

  // Video: Premium content → One-time or subscription
  if (mimeType.includes('video')) {
    return {
      contractType: 'one_time_purchase',
      suggestedPrice: 9.99,
      licenseType: 'access',
      accessDuration: 'infinite',
      reshareAllowed: false,
      confidence: 0.75,
      reasoning: 'Video content is typically sold as one-time access'
    };
  }

  // Documents: Information access → Subscription
  if (mimeType.includes('pdf') || mimeType.includes('document')) {
    return {
      contractType: 'subscription',
      suggestedPrice: 5.00,
      licenseType: 'access',
      accessDuration: 'monthly',
      reshareAllowed: false,
      confidence: 0.6,
      reasoning: 'Documents work well with subscription-based access'
    };
  }

  // Default: Generic digital asset
  return {
    contractType: 'one_time_purchase',
    suggestedPrice: 1.99,
    licenseType: 'access',
    accessDuration: 'infinite',
    reshareAllowed: true,
    confidence: 0.5,
    reasoning: 'Default terms for unclassified digital content'
  };
}
