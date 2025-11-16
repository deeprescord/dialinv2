import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dialName, contentType, language = 'en' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing dial similarity for: "${dialName}" (${contentType}, ${language})`);

    // Call AI to analyze semantic meaning and find similar dials
    const prompt = `Analyze the custom dial term "${dialName}" for ${contentType} content.

Find semantically similar terms and provide:
1. Similar English terms with similarity scores (0.0-1.0)
2. Translations in common languages (Spanish, French, German, Japanese, Korean)
3. Related concepts that capture similar meaning
4. Whether this is a synonym, translation, or related concept

Respond ONLY with valid JSON in this format:
{
  "similar_terms": [
    {"term": "lo-fi", "score": 0.95, "type": "synonym"},
    {"term": "chill", "score": 0.85, "type": "related"}
  ],
  "translations": [
    {"language": "es", "term": "relajado", "score": 0.9},
    {"language": "fr", "term": "détendu", "score": 0.9}
  ],
  "related_concepts": ["ambient", "downtempo", "relaxed"],
  "detected_language": "en",
  "semantic_category": "mood/vibe/genre/etc"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are an expert linguist and semantic analyzer. Respond only with valid JSON.' 
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;

    console.log('AI Response:', aiContent);

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid JSON in AI response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        dial_name: dialName,
        analysis: analysis
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-dial-similarity function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
