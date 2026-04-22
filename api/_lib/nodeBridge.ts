export type HeaderValue = string | string[] | undefined;

export type NodeLikeRequest = {
  method?: string;
  url?: string;
  headers?: Headers | Record<string, HeaderValue>;
  on?: (event: 'data' | 'end' | 'error', listener: (...args: unknown[]) => void) => void;
};

export type NodeLikeResponse = {
  statusCode: number;
  setHeader: (name: string, value: string | string[]) => void;
  end: (chunk?: Uint8Array | Buffer | string | null) => void;
};

export const isWebRequest = (value: unknown): value is Request =>
  typeof Request !== 'undefined' &&
  (value instanceof Request ||
    (value !== null &&
      typeof value === 'object' &&
      'url' in value &&
      'method' in value &&
      'headers' in value &&
      typeof (value as Request).headers?.get === 'function' &&
      typeof (value as Request).arrayBuffer === 'function'));

export const toHeaders = (input: NodeLikeRequest['headers']): Headers => {
  const headers = new Headers();

  if (!input) {
    return headers;
  }

  if (input instanceof Headers) {
    input.forEach((value: string, key: string) => {
      headers.append(key, value);
    });
    return headers;
  }

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      continue;
    }

    headers.set(key, value);
  }

  return headers;
};

export const readRequestBody = async (
  req: NodeLikeRequest,
  method: string
): Promise<string | undefined> => {
  if (method === 'GET' || method === 'HEAD' || typeof req.on !== 'function') {
    return undefined;
  }

  const body = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on?.('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on?.('end', () => resolve(Buffer.concat(chunks)));
    req.on?.('error', (error) => reject(error));
  });

  return body.byteLength > 0 ? body.toString('utf8') : undefined;
};

export const toWebRequest = async (req: NodeLikeRequest): Promise<Request> => {
  const method = (req.method || 'GET').toUpperCase();
  const headers = toHeaders(req.headers);
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost';
  const protocol = headers.get('x-forwarded-proto') || 'https';
  const url = new URL(req.url || '/', `${protocol}://${host}`);
  const body = await readRequestBody(req, method);

  const init: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = body;
  }

  return new Request(url, init);
};

export const applyFetchResponseHeaders = (
  res: Pick<NodeLikeResponse, 'setHeader'>,
  response: Response
): void => {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  const setCookies = responseHeaders.getSetCookie?.() || [];
  if (setCookies.length > 0) {
    res.setHeader('set-cookie', setCookies);
  } else {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('set-cookie', setCookie);
    }
  }

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }

    res.setHeader(key, value);
  });
};

export const writeFetchResponse = async (
  res: NodeLikeResponse,
  response: Response
): Promise<void> => {
  res.statusCode = response.status;
  applyFetchResponseHeaders(res, response);

  if (response.status === 204 || response.status === 304) {
    res.end();
    return;
  }

  if (typeof response.arrayBuffer !== 'function') {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error', message: 'Response object is missing arrayBuffer() method.' }));
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
};
