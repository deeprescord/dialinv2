import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, fileName, fileType, mimeType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine content category based on file type and name
    let category = 'general';
    if (mimeType?.startsWith('image/')) category = 'image';
    else if (mimeType?.startsWith('video/')) category = 'video';
    else if (mimeType?.startsWith('audio/')) category = 'music';
    else if (fileName.match(/\.(pdf|doc|docx|txt)$/i)) category = 'document';

    // Build context-aware prompt for AI
    const prompt = `Analyze this ${category} file: "${fileName}"

Generate intelligent metadata in the following JSON structure:
{
  "hashtags": ["tag1", "tag2", "tag3"],
  "dial_values": {
    "energy": 0-10,
    "mood": "happy|sad|calm|excited|angry|peaceful",
    "vibe": "chill|energetic|dark|uplifting|contemplative|futuristic",
    "complexity": 0-10,
    "professionalism": 0-10
  },
  "confidence": 0.0-1.0,
  "suggested_spaces": ["space_name1", "space_name2"]
}

Rules:
- For images/videos: Consider visual mood, energy, color palette
- For music/audio: Focus on tempo, mood, genre
- For documents: Consider topic, formality, purpose
- Generate 3-7 relevant hashtags
- All dial values must be numeric (0-10) or specific string values as shown
- Confidence reflects how certain you are about the analysis
- Suggest 1-3 spaces where this item would fit best

Return ONLY valid JSON, no explanation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert at analyzing files and generating metadata. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
          complexity: 5,
          professionalism: 5
        },
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
          complexity: 5,
          professionalism: 5
        },
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