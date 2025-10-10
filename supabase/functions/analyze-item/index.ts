import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Contextual prompt generator based on file type
function getContextualPrompt(category: string, fileName: string, fileType: string, mimeType: string): string {
  const baseContext = `Analyzing file: "${fileName}" (Type: ${fileType}, MIME: ${mimeType})`;
  
  switch (category) {
    case 'image':
      return `${baseContext}

Please analyze this image and provide:
1. 3-5 relevant hashtags
2. Contextual dials based on the content:
   - If it's FOOD/RESTAURANT: spiciness (1-10), richness (1-10), presentation (1-10), price_range ($-$$$$), cuisine type
   - If it's PEOPLE/SOCIAL: group_size (1-10), activity type (casual/sports/celebration/work), formality (1-10), mood, vibe
   - If it's LOCATION/TRAVEL: atmosphere (1-10), noise_level (1-10), lighting (1-10), crowd_size (1-10), location_type
   - Otherwise: mood, vibe, energy (1-10), quality (1-10), subject type
3. Suggested spaces where this would fit
4. Your confidence level (0.0-1.0)

Respond ONLY with valid JSON in this exact format:
{
  "hashtags": ["tag1", "tag2", "tag3"],
  "dial_values": {"dial_name": value},
  "suggested_dials": [{"key": "dial_name", "label": "Display Name", "type": "slider|select", "value": defaultValue, "options": ["opt1", "opt2"]}],
  "confidence": 0.85,
  "suggested_spaces": ["space-id-1"]
}`;

    case 'audio':
      return `${baseContext}

Analyze this audio file and provide:
1. 3-5 relevant hashtags
2. Music-specific dials: tempo (1-10), genre, acousticness (1-10), danceability (1-10), decade, mood, vibe, energy (1-10)
3. Suggested spaces
4. Confidence level

Respond ONLY with valid JSON in the specified format.`;

    case 'video':
      return `${baseContext}

Analyze this video file and provide:
1. 3-5 relevant hashtags
2. Video-specific dials: production_quality (1-10), video_type (documentary/vlog/tutorial/music-video), decade, mood, vibe, energy (1-10)
3. Suggested spaces
4. Confidence level

Respond ONLY with valid JSON in the specified format.`;

    case 'document':
      return `${baseContext}

Analyze this document and provide:
1. 3-5 relevant hashtags
2. Document-specific dials: importance (1-10), document_type (personal/work/financial/legal), urgency (1-10)
3. Suggested spaces
4. Confidence level

Respond ONLY with valid JSON in the specified format.`;

    default:
      return `${baseContext}

Analyze this file and provide relevant hashtags, dials, suggested spaces, and confidence level.
Respond ONLY with valid JSON.`;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, fileName, fileType, mimeType, imageData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine content category based on file type and name
    let category = 'general';
    if (mimeType?.startsWith('image/')) category = 'image';
    else if (mimeType?.startsWith('video/')) category = 'video';
    else if (mimeType?.startsWith('audio/')) category = 'audio';
    else if (fileName.match(/\.(pdf|doc|docx|txt)$/i)) category = 'document';

    // Get contextual prompt
    const contextualPrompt = getContextualPrompt(category, fileName, fileType, mimeType);

    // Call AI gateway for analysis
    const messages: any[] = [
      { 
        role: 'system', 
        content: 'You are an expert at analyzing files and generating metadata. Always respond with valid JSON only.' 
      }
    ];

    // For images with actual image data, use vision analysis
    if (category === 'image' && imageData) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: contextualPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData // base64 data URL
            }
          }
        ]
      });
    } else {
      // For other files or images without data, use text-based analysis
      messages.push({ role: 'user', content: contextualPrompt });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return fallback metadata if AI fails
      return new Response(JSON.stringify({
        hashtags: [category, 'untagged'],
        dial_values: {
          energy: 5,
          mood: 'neutral',
          vibe: 'neutral',
        },
        suggested_dials: [
          { key: 'energy', label: 'Energy', type: 'slider', value: 5 },
          { key: 'mood', label: 'Mood', type: 'select', value: 'neutral' },
          { key: 'vibe', label: 'Vibe', type: 'select', value: 'neutral' },
          { key: 'complexity', label: 'Complexity', type: 'slider', value: 5 },
        ],
        confidence: 0.3,
        suggested_spaces: ['lobby'],
        fallback: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    // Parse the AI response
    let metadata;
    try {
      // Extract JSON from response (in case AI adds explanation)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        metadata = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Return fallback metadata
      metadata = {
        hashtags: [category, 'untagged'],
        dial_values: {
          energy: 5,
          mood: 'neutral',
          vibe: 'neutral',
        },
        suggested_dials: [
          { key: 'energy', label: 'Energy', type: 'slider', value: 5 },
          { key: 'mood', label: 'Mood', type: 'select', value: 'neutral' },
          { key: 'vibe', label: 'Vibe', type: 'select', value: 'neutral' },
        ],
        confidence: 0.3,
        suggested_spaces: ['lobby'],
        fallback: true
      };
    }

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-item function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
