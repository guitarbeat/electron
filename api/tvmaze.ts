import { fetchWithRetry } from './_lib/retryFetch.ts';
import { withWebHandler } from './_lib/webHandler.ts';
import { resolveConfig } from './_lib/config.ts';

const TVMAZE_API_BASE_URL = resolveConfig(
  process.env.TVMAZE_API_URL || process.env.VITE_TVMAZE_API_URL,
  'https://api.tvmaze.com'
);
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

interface CachedResponse {
  body: string;
  contentType: string;
  expiresAt: number;
  status: number;
  statusText: string;
}

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
const tvMazeCache = new Map<string, CachedResponse>();

const toJsonResponse = (body: string, status: number): Response =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

const badConfigResponse = (message: string) =>
  toJsonResponse(JSON.stringify({ error: message }), 500);
const badRequestResponse = (message: string) =>
  toJsonResponse(JSON.stringify({ error: message }), 400);
const methodNotAllowedResponse = () =>
  toJsonResponse(JSON.stringify({ error: 'Method not allowed.' }), 405);

const getCachedResponse = (cacheKey: string): CachedResponse | null => {
  const cached = tvMazeCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    tvMazeCache.delete(cacheKey);
    return null;
  }

  return cached;
};

const trimCache = () => {
  if (tvMazeCache.size < MAX_CACHE_ENTRIES) {
    return;
  }

  const now = Date.now();
  for (const [key, value] of tvMazeCache.entries()) {
    if (value.expiresAt <= now) {
      tvMazeCache.delete(key);
    }
  }

  while (tvMazeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = tvMazeCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    tvMazeCache.delete(oldestKey);
  }
};

const cacheResponse = (cacheKey: string, response: CachedResponse) => {
  trimCache();
  tvMazeCache.set(cacheKey, response);
};

const buildTargetUrl = (req: Request): URL | Response => {
  if (!isAbsoluteUrl(TVMAZE_API_BASE_URL)) {
    return badConfigResponse('Invalid TVMAZE_API_URL configuration.');
  }

  // Vercel may pass a relative `req.url` which requires a base.
  const sourceUrl = new URL(req.url, 'http://localhost');
  const mode = sourceUrl.searchParams.get('mode');
  const id = sourceUrl.searchParams.get('id');
  const query = sourceUrl.searchParams.get('q');
  const targetUrl = new URL(TVMAZE_API_BASE_URL);

  if (mode === 'show' && id) {
    targetUrl.pathname = `${targetUrl.pathname.replace(/\/$/, '')}/shows/${encodeURIComponent(id)}`;
    return targetUrl;
  }

  if (mode === 'search' && query) {
    targetUrl.pathname = `${targetUrl.pathname.replace(/\/$/, '')}/search/shows`;
    targetUrl.searchParams.set('q', query);
    return targetUrl;
  }

  return badRequestResponse('mode=show&id=... or mode=search&q=... is required.');
};

async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse();
    }

    const targetUrl = buildTargetUrl(req);
    if (targetUrl instanceof Response) {
      return targetUrl;
    }

    const cacheKey = targetUrl.toString();
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'no-store',
          'X-Cache': 'HIT',
        },
      });
    }

    const upstreamResponse = await fetchWithRetry(
      targetUrl,
      {
        headers: {
          Accept: 'application/json',
        },
      },
      'tvmaze',
      { timeoutMs: 5000 }
    );
    const body = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';

    if (upstreamResponse.ok) {
      cacheResponse(cacheKey, {
        body,
        contentType,
        expiresAt: Date.now() + ONE_HOUR_MS,
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
      });
    }

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error(`Error handling ${req.method} ${req.url}:`, error);
    return toJsonResponse(JSON.stringify({ error: 'Internal server error.' }), 500);
  }
}

export default withWebHandler(handler);
