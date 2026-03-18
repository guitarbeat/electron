const GIST_API_BASE_URL = 'https://api.github.com/gists';
const DEFAULT_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'movie-watchlist-proxy',
};

const getGistId = (): string => process.env.GIST_ID || process.env.VITE_GIST_ID || '';
const getGitHubToken = (): string | undefined => process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;

const buildHeaders = (ifNoneMatch?: string | null) => {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  const token = getGitHubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (ifNoneMatch) {
    headers['If-None-Match'] = ifNoneMatch;
  }

  return headers;
};

const toJsonResponse = (body: string, init: ResponseInit = {}): Response =>
  new Response(body, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    },
  });

const notFoundResponse = () => toJsonResponse(JSON.stringify({ error: 'GIST_ID not configured.' }), { status: 500 });
const methodNotAllowedResponse = () =>
  toJsonResponse(JSON.stringify({ error: 'Method not allowed.' }), { status: 405 });

const handleGet = async (req: Request): Promise<Response> => {
  const gistId = getGistId();
  if (!gistId) return notFoundResponse();

  const upstreamUrl = `${GIST_API_BASE_URL}/${encodeURIComponent(gistId)}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'GET',
    headers: buildHeaders(req.headers.get('if-none-match')),
  });

  const body = upstreamResponse.status === 304 ? null : await upstreamResponse.text();
  const responseHeaders: Record<string, string> = {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
    'cache-control': 'no-store',
  };

  const etag = upstreamResponse.headers.get('etag');
  if (etag) {
    responseHeaders.ETag = etag;
  }

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

const handlePatch = async (req: Request): Promise<Response> => {
  const gistId = getGistId();
  if (!gistId) return notFoundResponse();

  const token = getGitHubToken();
  if (!token) {
    return toJsonResponse(
      JSON.stringify({
        error: 'Server-side write requires GITHUB_TOKEN.',
      }),
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return toJsonResponse(JSON.stringify({ error: 'Invalid JSON payload.' }), { status: 400 });
  }

  const hasFiles = payload && typeof payload === 'object' && 'files' in (payload as Record<string, unknown>);
  if (!hasFiles) {
    return toJsonResponse(JSON.stringify({ error: 'PATCH payload must include files.' }), { status: 400 });
  }

  const upstreamUrl = `${GIST_API_BASE_URL}/${encodeURIComponent(gistId)}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: 'PATCH',
    headers: {
      ...buildHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = await upstreamResponse.text();
  const responseHeaders: Record<string, string> = {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
    'cache-control': 'no-store',
  };

  const etag = upstreamResponse.headers.get('etag');
  if (etag) {
    responseHeaders.ETag = etag;
  }

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === 'GET') {
      return await handleGet(req);
    }
    if (req.method === 'PATCH') {
      return await handlePatch(req);
    }

    return methodNotAllowedResponse();
  } catch (error) {
    console.error('Error handling /api/gist', error);
    return toJsonResponse(JSON.stringify({ error: 'Internal server error.' }), { status: 500 });
  }
}
