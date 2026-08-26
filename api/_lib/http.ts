export const mergeHeaders = (
  ...sources: Array<HeadersInit | undefined>
): Headers => {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) {
      continue;
    }

    const next = new Headers(source);
    next.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append(key, value);
        return;
      }

      headers.set(key, value);
    });
  }

  return headers;
};

export const jsonResponse = (
  body: unknown,
  init: ResponseInit = {},
): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: mergeHeaders(
      {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      init.headers,
    ),
  });

export const emptyResponse = (init: ResponseInit = {}): Response =>
  new Response(null, {
    ...init,
    headers: mergeHeaders(
      {
        "Cache-Control": "no-store",
      },
      init.headers,
    ),
  });

export const unauthorizedResponse = (
  message: string = "Unauthorized.",
): Response => jsonResponse({ error: message }, { status: 401 });

export const forbiddenResponse = (message: string = "Forbidden."): Response =>
  jsonResponse({ error: message }, { status: 403 });

export const conflictResponse = (
  body: unknown,
  init: ResponseInit = {},
): Response =>
  jsonResponse(body, {
    status: 409,
    ...init,
  });

export const methodNotAllowedResponse = (
  allow: string,
  message: string = "Method not allowed.",
): Response =>
  jsonResponse(
    { error: message },
    {
      status: 405,
      headers: {
        Allow: allow,
      },
    },
  );

export const badRequestResponse = (message: string): Response =>
  jsonResponse({ error: message }, { status: 400 });

export const serverErrorResponse = (
  error: unknown = "Internal server error.",
): Response => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return jsonResponse(
    {
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? message
          : "Internal server error.",
      stack: process.env.NODE_ENV === "development" ? stack : undefined,
    },
    { status: 500 },
  );
};

export const normalizeEtag = (value: string | null): string =>
  (value || "").trim().replace(/^W\//, "").replace(/^"|"$/g, "");

export const toQuotedEtag = (value: string): string =>
  `"${normalizeEtag(value)}"`;
