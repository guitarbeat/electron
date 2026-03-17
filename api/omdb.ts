const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = (value || '').trim();
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};
const OMDB_API_BASE_URL = resolveConfig(
  process.env.OMDB_API_URL || process.env.VITE_OMDB_API_URL,
  'https://www.omdbapi.com'
);
const OMDB_API_KEY = (process.env.OMDB_API_KEY || process.env.VITE_OMDB_API_KEY || '').trim();
const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

const toJsonResponse = (body: string, status: number): Response =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'cache-control': 'no-store',
    },
  });

const badConfigResponse = (message: string) => toJsonResponse(JSON.stringify({ error: message }), 500);
const methodNotAllowedResponse = () => toJsonResponse(JSON.stringify({ error: 'Method not allowed.' }), 405);

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse();
    }

    if (!isAbsoluteUrl(OMDB_API_BASE_URL)) {
      return badConfigResponse('Invalid OMDB_API_URL configuration.');
    }

    const sourceUrl = new URL(req.url);
    const targetUrl = new URL(OMDB_API_BASE_URL);

    sourceUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    if (!targetUrl.searchParams.has('apikey') && OMDB_API_KEY.length > 0) {
      targetUrl.searchParams.set('apikey', OMDB_API_KEY);
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
    });
    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error handling /api/omdb', error);
    return toJsonResponse(JSON.stringify({ error: 'Internal server error.' }), 500);
  }
}
