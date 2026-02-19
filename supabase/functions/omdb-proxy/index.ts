import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-expect-error - Deno is not defined in this environment
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('s');
    const title = searchParams.get('t');
    const id = searchParams.get('i');

    // @ts-expect-error - Deno is not defined in this environment
    const apiKey = Deno.env.get('OMDB_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OMDb API Key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const omdbUrl = new URL('https://www.omdbapi.com');
    omdbUrl.searchParams.append('apikey', apiKey);

    if (id) omdbUrl.searchParams.append('i', id);
    else if (title) omdbUrl.searchParams.append('t', title);
    else if (query) omdbUrl.searchParams.append('s', query);
    else {
      return new Response(JSON.stringify({ error: 'Missing search parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(omdbUrl.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
