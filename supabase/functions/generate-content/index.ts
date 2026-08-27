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

    // Verify user is not suspended
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_suspended, credits_remaining, role')
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

    if (profile.credits_remaining < 1) {
      return new Response(JSON.stringify({ error: 'Insufficient credits. Please upgrade your plan.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, type, platform = 'instagram', tone = 'Professional' } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch active AI configuration from database
    const { data: aiConfig } = await supabaseClient
      .from('ai_config')
      .select('*')
      .limit(1)
      .single();

    const systemPrompt = aiConfig?.system_prompt || 'You are SocialPilot AI, an elite social media copywriter.';
    const temperature = Number(aiConfig?.temperature) || 0.7;
    const maxTokens = aiConfig?.max_tokens || 2048;
    const textModel = aiConfig?.text_model || 'gemini-2.0-flash';

    // 2. Call Google Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    let generatedResult = '';
    let tokensUsed = 0;

    if (geminiApiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nCreate a high-converting ${type} for ${platform} with a ${tone} tone about: ${prompt}` }
                ],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      const result = await response.json();
      generatedResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      tokensUsed = result.usageMetadata?.totalTokenCount || 150;
    } else {
      // Graceful fallback if API key not yet configured
      generatedResult = `🚀 High-Impact ${type.toUpperCase()} for ${platform.toUpperCase()}:\n\n1. Hook: Why most creators fail with ${prompt} (and how to win).\n2. Core Value: Authenticity + Strategic Distribution.\n3. CTA: Save this post and take action today!\n\n#SocialPilot #GrowthStrategy #${platform}`;
      tokensUsed = 150;
    }

    // 3. Decrement user credit balance via atomic RPC (also records analytics)
    const { data: newBalance, error: creditError } = await supabaseClient.rpc(
      'decrement_user_credits',
      { user_id_param: user.id, amount: 1 }
    );

    if (creditError) {
      return new Response(JSON.stringify({ error: 'Credit deduction failed: ' + creditError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        result: generatedResult,
        tokens_used: tokensUsed,
        credits_remaining: newBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
