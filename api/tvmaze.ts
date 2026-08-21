import { fetchWithRetry } from './_lib/retryFetch.js';
import { withWebHandler } from './_lib/webHandler.js';
import { resolveConfig } from './_lib/config.js';
import {
  BoundedResponseCache,
  cachedProxyResponse,
  isAbsoluteUrl,
  jsonProxyResponse,
  type CachedProxyResponse,
} from './_lib/cachedProxy.js';

const TVMAZE_API_BASE_URL = resolveConfig(
  process.env.TVMAZE_API_URL || process.env.VITE_TVMAZE_API_URL,
  'https://api.tvmaze.com'
);
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const tvMazeCache = new BoundedResponseCache<CachedProxyResponse>({
  ttlMs: ONE_HOUR_MS,
  maxEntries: MAX_CACHE_ENTRIES,
});

const badConfigResponse = (message: string) =>
  jsonProxyResponse({ error: message }, 500);
const badRequestResponse = (message: string) =>
  jsonProxyResponse({ error: message }, 400);
const methodNotAllowedResponse = () =>
  jsonProxyResponse({ error: 'Method not allowed.' }, 405);

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
    const cached = tvMazeCache.get(cacheKey);
    if (cached) {
      return cachedProxyResponse(cached);
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
      tvMazeCache.set(cacheKey, {
        body,
        contentType,
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
    return jsonProxyResponse({ error: 'Internal server error.' }, 500);
  }
}

export default withWebHandler(handler);
