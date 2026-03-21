const GIST_API_BASE_URL = "https://api.github.com/gists";
const ALLOWED_METHODS = "GET, PATCH, OPTIONS";
const DEFAULT_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "movie-watchlist-proxy",
};

const cleanConfig = (value: string | undefined): string =>
  (value || "").trim().replace(/^["']|["']$/g, "");

const getGistId = (): string =>
  cleanConfig(process.env.GIST_ID || process.env.VITE_GIST_ID);
const getGitHubToken = (): string | undefined => {
  const token = cleanConfig(
    process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN,
  );
  return token || undefined;
};
const getApiSecret = (): string | undefined => {
  const apiSecret = cleanConfig(
    process.env.API_SECRET || process.env.VITE_API_SECRET,
  );
  return apiSecret || undefined;
};

const appendVary = (headers: Headers, value: string) => {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", value);
    return;
  }

  const values = new Set(
    existing
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
  values.add(value);
  headers.set("Vary", Array.from(values).join(", "));
};

const mergeHeaders = (...sources: Array<HeadersInit | undefined>): Headers => {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const nextHeaders = new Headers(source);
    nextHeaders.forEach((value, key) => {
      if (key.toLowerCase() === "vary") {
        value
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .forEach((entry) => appendVary(headers, entry));
        return;
      }

      headers.set(key, value);
    });
  }

  return headers;
};

const buildCorsHeaders = (req: Request): Headers => {
  const origin = req.headers.get("origin");
  const requestedHeaders =
    req.headers.get("access-control-request-headers") ||
    "authorization, content-type, if-none-match";

  const headers = new Headers({
    "Access-Control-Allow-Headers": requestedHeaders,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Expose-Headers": "ETag, Content-Type",
    "Access-Control-Max-Age": "86400",
    Allow: ALLOWED_METHODS,
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    appendVary(headers, "Origin");
  } else {
    headers.set("Access-Control-Allow-Origin", "*");
  }

  return headers;
};

const buildUpstreamHeaders = (ifNoneMatch?: string | null): Headers => {
  const headers = new Headers(DEFAULT_HEADERS);
  const token = getGitHubToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (ifNoneMatch) {
    headers.set("If-None-Match", ifNoneMatch);
  }

  return headers;
};

const toJsonResponse = (
  req: Request,
  body: string,
  init: ResponseInit = {},
): Response =>
  new Response(body, {
    ...init,
    headers: mergeHeaders(
      buildCorsHeaders(req),
      {
        "Content-Type": "application/json",
      },
      init.headers,
    ),
  });

const notFoundResponse = (req: Request) =>
  toJsonResponse(req, JSON.stringify({ error: "GIST_ID not configured." }), {
    status: 500,
  });
const methodNotAllowedResponse = (req: Request) =>
  toJsonResponse(req, JSON.stringify({ error: "Method not allowed." }), {
    status: 405,
  });

const handleOptions = (req: Request): Response =>
  new Response(null, {
    status: 204,
    headers: buildCorsHeaders(req),
  });

const handleGet = async (req: Request): Promise<Response> => {
  const gistId = getGistId();
  if (!gistId) return notFoundResponse(req);

  const upstreamUrl = `${GIST_API_BASE_URL}/${encodeURIComponent(gistId)}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: "GET",
    headers: buildUpstreamHeaders(req.headers.get("if-none-match")),
  });

  const body = upstreamResponse.status === 304 ? null : await upstreamResponse.text();
  const responseHeaders = mergeHeaders(buildCorsHeaders(req), {
    "Content-Type":
      upstreamResponse.headers.get("content-type") || "application/json",
    "cache-control": "no-store",
  });

  const etag = upstreamResponse.headers.get("etag");
  if (etag) {
    responseHeaders.set("ETag", etag);
  }

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

const handlePatch = async (req: Request): Promise<Response> => {
  const gistId = getGistId();
  if (!gistId) return notFoundResponse(req);

  const token = getGitHubToken();
  if (!token) {
    return toJsonResponse(
      req,
      JSON.stringify({
        error: "Server-side write requires GITHUB_TOKEN.",
      }),
      { status: 401 },
    );
  }

  const apiSecret = getApiSecret();
  if (!apiSecret) {
    return toJsonResponse(
      req,
      JSON.stringify({
        error: "Server-side write requires API_SECRET.",
      }),
      { status: 401 },
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const clientToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (clientToken !== apiSecret) {
    return toJsonResponse(
      req,
      JSON.stringify({
        error: "Unauthorized.",
      }),
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return toJsonResponse(
      req,
      JSON.stringify({ error: "Invalid JSON payload." }),
      {
        status: 400,
      },
    );
  }

  const hasFiles =
    payload &&
    typeof payload === "object" &&
    "files" in (payload as Record<string, unknown>);
  if (!hasFiles) {
    return toJsonResponse(
      req,
      JSON.stringify({ error: "PATCH payload must include files." }),
      { status: 400 },
    );
  }

  const upstreamUrl = `${GIST_API_BASE_URL}/${encodeURIComponent(gistId)}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    method: "PATCH",
    headers: mergeHeaders(buildUpstreamHeaders(), {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  const body = await upstreamResponse.text();
  const responseHeaders = mergeHeaders(buildCorsHeaders(req), {
    "Content-Type":
      upstreamResponse.headers.get("content-type") || "application/json",
    "cache-control": "no-store",
  });

  const etag = upstreamResponse.headers.get("etag");
  if (etag) {
    responseHeaders.set("ETag", etag);
  }

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === "OPTIONS") {
      return handleOptions(req);
    }
    if (req.method === "GET") {
      return await handleGet(req);
    }
    if (req.method === "PATCH") {
      return await handlePatch(req);
    }

    return methodNotAllowedResponse(req);
  } catch (error) {
    console.error("Error handling /api/gist", error);
    return toJsonResponse(
      req,
      JSON.stringify({ error: "Internal server error." }),
      {
        status: 500,
      },
    );
  }
}
