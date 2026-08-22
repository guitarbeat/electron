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

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_RATE_LIMIT_ENTRIES = 10_000;

const OMDB_AUTH_FAILURE_CODE = 'omdb_auth';
const OMDB_CONFIG_FAILURE_CODE = 'omdb_config';

const omdbCache = new BoundedResponseCache<CachedProxyResponse>({
  ttlMs: ONE_HOUR_MS,
  maxEntries: MAX_CACHE_ENTRIES,
});

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const getOmdbApiBaseUrl = (): string =>
  resolveConfig(
    process.env.OMDB_API_URL || process.env.VITE_OMDB_API_URL,
    'https://www.omdbapi.com'
  );

const getOmdbApiKey = (): string =>
  (process.env.OMDB_API_KEY || process.env.VITE_OMDB_API_KEY || '').trim();

const badConfigResponse = (message: string) =>
  jsonProxyResponse({ error: message, code: OMDB_CONFIG_FAILURE_CODE }, 500);
const badRequestResponse = (message: string) =>
  jsonProxyResponse({ error: message }, 400);
const methodNotAllowedResponse = () =>
  jsonProxyResponse({ error: 'Method not allowed.' }, 405);
const rateLimitResponse = () =>
  jsonProxyResponse({ error: 'Too many requests.' }, 429);
const forbiddenResponse = (message: string) =>
  jsonProxyResponse({ error: message }, 403);
const omdbAuthResponse = (message: string) =>
  jsonProxyResponse({ error: message, code: OMDB_AUTH_FAILURE_CODE }, 502);

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (record && now <= record.resetTime) {
    if (record.count >= MAX_REQUESTS_PER_WINDOW) return true;
    record.count += 1;
    return false;
  }

  // Record is missing or expired
  if (record) ipRequestCounts.delete(ip);

  // Evict if at capacity
  if (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, value] of ipRequestCounts.entries()) {
      if (now > value.resetTime) ipRequestCounts.delete(key);
      else break; // Stop at first unexpired entry
    }
    // Fallback eviction if all entries are unexpired
    if (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) {
      const firstKey = ipRequestCounts.keys().next().value;
      if (firstKey !== undefined) ipRequestCounts.delete(firstKey);
    }
  }

  ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  return false;
};

let allowedOriginCache: Set<string> | null = null;

const validateSameOriginRequest = (req: Request): Response | null => {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return forbiddenResponse('Cross-site requests not allowed.');
  }

  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (!origin) return null;

  if (allowedOriginCache === null) {
    const origins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    allowedOriginCache = new Set(origins.map(o => {
      try { return new URL(o).origin; } catch { return o; }
    }));
  }

  if (allowedOriginCache.size === 0) return null;

  try {
    const originUrl = new URL(origin);
    return allowedOriginCache.has(originUrl.origin) ? null : forbiddenResponse('Origin not allowed.');
  } catch {
    return forbiddenResponse('Invalid origin.');
  }
};

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const lastCommaIndex = forwardedFor.lastIndexOf(',');
    return lastCommaIndex !== -1 
      ? forwardedFor.substring(lastCommaIndex + 1).trim() || 'unknown'
      : forwardedFor.trim() || 'unknown';
  }
  return req.headers.get('x-real-ip') || 'unknown';
};

const isOmdbCredentialFailure = (body: string): boolean =>
  /invalid api key|no api key provided/i.test(body);

async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse();
    }

    const sameOriginError = validateSameOriginRequest(req);
    if (sameOriginError) {
      return sameOriginError;
    }

    const clientIp = getClientIp(req);
    if (clientIp !== 'unknown' && isRateLimited(clientIp)) {
      return rateLimitResponse();
    }

    const omdbApiBaseUrl = getOmdbApiBaseUrl();
    const omdbApiKey = getOmdbApiKey();

    if (!isAbsoluteUrl(omdbApiBaseUrl)) {
      return badConfigResponse('Invalid OMDB_API_URL configuration.');
    }

    if (omdbApiKey.length === 0) {
      return badConfigResponse(
        'OMDb is not configured. Set OMDB_API_KEY or VITE_OMDB_API_KEY for the /api/omdb proxy.'
      );
    }

    // Vercel may pass a relative `req.url` which requires a base.
    const sourceUrl = new URL(req.url, 'http://localhost');
    
    if (sourceUrl.searchParams.size === 0) {
      return badRequestResponse('At least one OMDb lookup parameter is required.');
    }

    const targetUrl = new URL(omdbApiBaseUrl);
    for (const [key, value] of sourceUrl.searchParams) {
      targetUrl.searchParams.set(key, value);
    }

    const incomingApiKey = targetUrl.searchParams.get('apikey')?.trim();
    if ((!incomingApiKey || incomingApiKey.length === 0) && omdbApiKey.length > 0) {
      targetUrl.searchParams.set('apikey', omdbApiKey);
    }

    const cacheKey = targetUrl.toString();
    const cached = omdbCache.get(cacheKey);
    if (cached) {
      return cachedProxyResponse(cached);
    }

    const upstreamResponse = await fetchWithRetry(
      targetUrl,
      {
        headers: { Accept: 'application/json' },
      },
      'omdb',
      { timeoutMs: 5000 }
    );

    const body = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';

    if (
      upstreamResponse.status === 401 ||
      upstreamResponse.status === 403 ||
      isOmdbCredentialFailure(body)
    ) {
      return omdbAuthResponse('OMDb rejected the configured API key.');
    }

    if (upstreamResponse.ok) {
      // Only cache successful OMDb responses (Response: "True").
      // OMDb returns HTTP 200 even for errors like "Movie not found" with Response: "False".
      let isOmdbSuccess = true;
      try {
        const parsed = JSON.parse(body) as { Response?: string };
        if (parsed.Response === "False") {
          isOmdbSuccess = false;
        }
      } catch {
        // If we can't parse, still cache the raw response
      }

      if (isOmdbSuccess) {
        omdbCache.set(cacheKey, {
          body,
          contentType,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
        });
      }
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
