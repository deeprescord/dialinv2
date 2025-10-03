import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, useStructuredOutput } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: useStructuredOutput ? messages : [
        {
          role: "system",
          content: "You are a helpful AI assistant for the DialIn platform, a social communication app. Be friendly, concise, and helpful. If users ask about specific DialIn features, let them know that you can help with general questions and that more specific app training is coming soon."
        },
        ...messages,
      ],
    };

    // Add tool calling for structured output when generating item descriptions with dials
    if (useStructuredOutput) {
      body.tools = [
        {
          type: 'function',
          function: {
            name: 'describe_item_with_dials',
            description: 'Generate a description and suggest contextual dials for an item',
            parameters: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'A creative, engaging description of the item (2-3 sentences)'
                },
                dials: {
                  type: 'array',
                  description: 'Suggested dials that users can adjust for this item (2-4 contextual dials)',
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        description: 'Name of the dial (e.g., "Spicy", "Energy Level", "Tempo")'
                      },
                      minLabel: {
                        type: 'string',
                        description: 'Label for minimum value (e.g., "Mild", "Calm", "Slow")'
                      },
                      maxLabel: {
                        type: 'string',
                        description: 'Label for maximum value (e.g., "Extra Hot", "Energetic", "Fast")'
                      },
                      defaultValue: {
                        type: 'number',
                        description: 'Default value from 0-100',
                        minimum: 0,
                        maximum: 100
                      }
                    },
                    required: ['name', 'minLabel', 'maxLabel', 'defaultValue']
                  }
                }
              },
              required: ['description', 'dials']
            }
          }
        }
      ];
      body.tool_choice = { type: 'function', function: { name: 'describe_item_with_dials' } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Return the full response for structured output, or just content for regular chat
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
