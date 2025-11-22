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

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userA = user.id; // The initiator (authenticated user)

    // Get the target user from request body
    const { userB } = await req.json();
    
    if (!userB) {
      throw new Error('Target user ID (userB) is required');
    }

    console.log(`Creating entanglement between ${userA} and ${userB}`);

    // Check if a chat already exists between these users
    const { data: existingSpaces } = await supabase
      .from('space_members')
      .select('space_id')
      .eq('user_id', userA);

    if (existingSpaces) {
      for (const { space_id } of existingSpaces) {
        const { data: otherMember } = await supabase
          .from('space_members')
          .select('user_id')
          .eq('space_id', space_id)
          .eq('user_id', userB)
          .maybeSingle();

        if (otherMember) {
          console.log(`Entanglement already exists: ${space_id}`);
          const { data: existingSpace } = await supabase
            .from('spaces')
            .select('*')
            .eq('id', space_id)
            .single();
          
          return new Response(
            JSON.stringify({ 
              message: 'Entanglement already exists',
              space: existingSpace,
              isNew: false
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 1. Create the Container (Space) - The Shared Reality
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert({
        user_id: userA, // Initiator as owner
        name: 'Direct Message',
        space_type: 'stream', // Special type for chat/messaging
        is_public: false,
        environment_settings: { 
          type: 'direct_message',
          participants: [userA, userB]
        }
      })
      .select()
      .single();

    if (spaceError) {
      console.error('Error creating space:', spaceError);
      throw spaceError;
    }

    console.log(`Created entanglement space: ${space.id}`);

    // 2. Entangle the Users (Members) - Phase Coupling
    const { error: membersError } = await supabase
      .from('space_members')
      .insert([
        { 
          space_id: space.id, 
          user_id: userA, 
          role: 'owner',
          phase_coupling_score: 1.0 // Initiator is fully coupled
        },
        { 
          space_id: space.id, 
          user_id: userB, 
          role: 'editor',
          phase_coupling_score: 0.5 // Initial coupling for invited user
        }
      ]);

    if (membersError) {
      console.error('Error adding members:', membersError);
      // Rollback: delete the space if member insertion fails
      await supabase.from('spaces').delete().eq('id', space.id);
      throw membersError;
    }

    console.log(`Successfully entangled users in space ${space.id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Entanglement created successfully',
        space,
        isNew: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-entanglement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
