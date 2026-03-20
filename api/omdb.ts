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


// Simple in-memory rate limiter with bounded size to prevent OOM
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_MAP_SIZE = 10000;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    if (ipRequestCounts.size >= MAX_MAP_SIZE) {
      // Evict old entries to prevent memory leak
      for (const [key, val] of ipRequestCounts.entries()) {
        if (now > val.resetTime) {
          ipRequestCounts.delete(key);
        }
      }
      // If still too large, clear everything as a fallback
      if (ipRequestCounts.size >= MAX_MAP_SIZE) {
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

const rateLimitResponse = () => toJsonResponse(JSON.stringify({ error: 'Too many requests.' }), 429);
const forbiddenResponse = (message: string) => toJsonResponse(JSON.stringify({ error: message }), 403);

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowedResponse();
    }

    const origin = req.headers.get('origin') || req.headers.get('referer');
    // Ensure the request comes from our own application.
    // If running in development (localhost) or production, we want to restrict abuse.
    // Since we don't know the exact production domain ahead of time without env vars,
    // we require the frontend to pass a specific custom header, or we strictly check allowed origins.
    // Actually, `fetch` from browser sets `Sec-Fetch-Site`. If it's cross-site, we can block it unless explicitly allowed.
    const secFetchSite = req.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') {
       return forbiddenResponse('Cross-site requests not allowed.');
    }

    // Fallback origin check if Sec-Fetch-Site is not supported by older browsers
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

        if (allowedOrigins.length > 0) {
          const isAllowed = allowedOrigins.some(allowed => {
            try {
              return new URL(allowed).origin === originUrl.origin;
            } catch {
              return false;
            }
          });
          if (!isAllowed) {
            return forbiddenResponse('Origin not allowed.');
          }
        }
      } catch (e) {
        return forbiddenResponse('Invalid origin.');
      }
    } else if (secFetchSite === null && process.env.NODE_ENV === 'production') {
       // If no origin and no sec-fetch-site in production, might be a direct cURL or script.
       // We can't strictly block if we are not sure, but let's rely on rate limiting mostly.
    }

    // Rate limiting based on IP
    // Extract real IP correctly from Vercel/proxies
    const forwardedFor = req.headers.get('x-forwarded-for');
    let clientIp = req.headers.get('x-real-ip') || 'unknown';

    if (forwardedFor) {
      clientIp = forwardedFor.split(',')[0].trim();
    }

    if (clientIp !== 'unknown' && isRateLimited(clientIp)) {
      return rateLimitResponse();
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
