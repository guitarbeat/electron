import { fetchWithRetry } from './_lib/retryFetch.ts';
import { withWebHandler } from './_lib/webHandler.ts';

const resolveConfig = (value: string | undefined, fallback: string) => {
  const cleanedValue = (value || '').trim();
  return cleanedValue.length > 0 ? cleanedValue : fallback;
};

const OMDB_API_BASE_URL = resolveConfig(
  process.env.OMDB_API_URL || process.env.VITE_OMDB_API_URL,
  'https://www.omdbapi.com'
);
const OMDB_API_KEY = (process.env.OMDB_API_KEY || process.env.VITE_OMDB_API_KEY || '').trim();
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_RATE_LIMIT_ENTRIES = 10_000;

interface CachedResponse {
  body: string;
  contentType: string;
  expiresAt: number;
  status: number;
  statusText: string;
}

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
const omdbCache = new Map<string, CachedResponse>();
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

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
const rateLimitResponse = () =>
  toJsonResponse(JSON.stringify({ error: 'Too many requests.' }), 429);
const forbiddenResponse = (message: string) =>
  toJsonResponse(JSON.stringify({ error: message }), 403);

const getCachedResponse = (cacheKey: string): CachedResponse | null => {
  const cached = omdbCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    omdbCache.delete(cacheKey);
    return null;
  }

  return cached;
};

const trimCache = (cache: Map<string, CachedResponse>) => {
  if (cache.size < MAX_CACHE_ENTRIES) {
    return;
  }

  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }

  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const cacheResponse = (cacheKey: string, response: CachedResponse) => {
  trimCache(omdbCache);
  omdbCache.set(cacheKey, response);
};

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    if (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) {
      for (const [key, value] of ipRequestCounts.entries()) {
        if (now > value.resetTime) {
          ipRequestCounts.delete(key);
        }
      }
      if (ipRequestCounts.size >= MAX_RATE_LIMIT_ENTRIES) {
        ipRequestCounts.clear();
      }
    }

    ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count += 1;
  return false;
};

const validateSameOriginRequest = (req: Request): Response | null => {
  const origin = req.headers.get('origin') || req.headers.get('referer');
  const secFetchSite = req.headers.get('sec-fetch-site');

  if (secFetchSite === 'cross-site') {
    return forbiddenResponse('Cross-site requests not allowed.');
  }

  if (!origin) {
    return null;
  }

  try {
    const originUrl = new URL(origin);
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      return null;
    }

    const isAllowed = allowedOrigins.some((allowed) => {
      try {
        return new URL(allowed).origin === originUrl.origin;
      } catch {
        return false;
      }
    });

    return isAllowed ? null : forbiddenResponse('Origin not allowed.');
  } catch {
    return forbiddenResponse('Invalid origin.');
  }
};

const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers.get('x-real-ip') || 'unknown';
};

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

    if (!isAbsoluteUrl(OMDB_API_BASE_URL)) {
      return badConfigResponse('Invalid OMDB_API_URL configuration.');
    }

    // Vercel may pass a relative `req.url` which requires a base.
    const sourceUrl = new URL(req.url, 'http://localhost');
    if ([...sourceUrl.searchParams.keys()].length === 0) {
      return badRequestResponse('At least one OMDb lookup parameter is required.');
    }

    const targetUrl = new URL(OMDB_API_BASE_URL);
    sourceUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    if (!targetUrl.searchParams.has('apikey') && OMDB_API_KEY.length > 0) {
      targetUrl.searchParams.set('apikey', OMDB_API_KEY);
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
      'omdb',
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
    console.error('Error handling /api/omdb', error);
    return toJsonResponse(JSON.stringify({ error: 'Internal server error.' }), 500);
  }
}

export default withWebHandler(handler);
