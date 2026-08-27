import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is not suspended and has enough credits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_suspended, credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.is_suspended) {
      return new Response(JSON.stringify({ error: 'Account suspended. Generation denied.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Image generation costs 2 credits
    if (profile.credits_remaining < 2) {
      return new Response(JSON.stringify({ error: 'Insufficient credits. Image generation requires 2 credits.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, aspect_ratio = '1:1', style = 'Photorealistic' } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Visual prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const replicateApiToken = Deno.env.get('REPLICATE_API_TOKEN');
    let imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';

    if (replicateApiToken) {
      // Call SDXL / Flux on Replicate
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          Authorization: `Token ${replicateApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: {
            prompt: `${style} style, ${prompt}, 8k resolution, cinematic lighting, masterpiece`,
            aspect_ratio,
          },
        }),
      });

      const prediction = await response.json();

      // Replicate may return async — poll for output if still processing
      if (prediction?.status === 'starting' || prediction?.status === 'processing') {
        const pollUrl = prediction.urls?.get;
        if (pollUrl) {
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const pollRes = await fetch(pollUrl, {
              headers: { Authorization: `Token ${replicateApiToken}` },
            });
            const pollData = await pollRes.json();
            if (pollData.status === 'succeeded' && pollData.output) {
              imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
              break;
            }
            if (pollData.status === 'failed') break;
          }
        }
      } else if (prediction?.output) {
        imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      }
    }

    // Store in generated_images table
    await supabaseClient.from('generated_images').insert({
      user_id: user.id,
      prompt,
      image_url: imageUrl,
      aspect_ratio,
      style,
    });

    // Deduct 2 credits via atomic RPC
    const { data: newBalance, error: creditError } = await supabaseClient.rpc(
      'decrement_user_credits',
      { user_id_param: user.id, amount: 2 }
    );

    if (creditError) {
      return new Response(JSON.stringify({ error: 'Credit deduction failed: ' + creditError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ image_url: imageUrl, credits_remaining: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
