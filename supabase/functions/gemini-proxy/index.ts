import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Allowed Gemini models (whitelist)
const ALLOWED_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-lite',
]);

// Input limits
const MAX_CONTENT_LENGTH = 50_000; // characters
const MAX_OUTPUT_TOKENS = 4096;

function validateInput(body: unknown): { valid: true; data: { contents: unknown; generationConfig?: unknown; model?: string } } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { contents, generationConfig, model } = body as Record<string, unknown>;

  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    return { valid: false, error: 'contents must be a non-empty array' };
  }

  // Validate content length
  const contentStr = JSON.stringify(contents);
  if (contentStr.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` };
  }

  // Validate model if provided
  const geminiModel = typeof model === 'string' ? model : 'gemini-2.0-flash';
  if (!ALLOWED_MODELS.has(geminiModel)) {
    return { valid: false, error: `Model "${geminiModel}" is not allowed. Allowed: ${[...ALLOWED_MODELS].join(', ')}` };
  }

  // Cap maxOutputTokens
  if (generationConfig && typeof generationConfig === 'object') {
    const config = generationConfig as Record<string, unknown>;
    if (typeof config.maxOutputTokens === 'number' && config.maxOutputTokens > MAX_OUTPUT_TOKENS) {
      config.maxOutputTokens = MAX_OUTPUT_TOKENS;
    }
  }

  return { valid: true, data: { contents, generationConfig, model: geminiModel } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require the Supabase apikey header (anon key) as a basic gate
    const apiKeyHeader = req.headers.get('apikey');
    if (!apiKeyHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing apikey header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contents, generationConfig, model } = validation.data;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured in Edge Function');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents, generationConfig }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Upstream API error' }),
        {
          status: geminiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await geminiResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
