import { writeFetchResponse, type NodeLikeResponse } from './nodeResponse.ts';

type WebHandler = (req: Request) => Promise<Response> | Response;

type HeaderValue = string | string[] | undefined;

type NodeLikeRequest = {
  method?: string;
  url?: string;
  headers?: Headers | Record<string, HeaderValue>;
  on?: (event: 'data' | 'end' | 'error', listener: (...args: unknown[]) => void) => void;
};

const isWebRequest = (value: unknown): value is Request =>
  typeof Request !== 'undefined' && value instanceof Request;

const toHeaders = (input: NodeLikeRequest['headers']): Headers => {
  const headers = new Headers();

  if (!input) {
    return headers;
  }

  if (input instanceof Headers) {
    input.forEach((value, key) => {
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

const readRequestBody = async (
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

const toWebRequest = async (req: NodeLikeRequest): Promise<Request> => {
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

type DualModeHandler = {
  (req: Request): Promise<Response>;
  (req: NodeLikeRequest, res: NodeLikeResponse): Promise<void>;
};

export function withWebHandler(handler: WebHandler) {
  return (async (
    req: Request | NodeLikeRequest,
    res?: NodeLikeResponse
  ): Promise<Response | void> => {
    try {
      if (isWebRequest(req) && !res) {
        return handler(req);
      }

      const request = isWebRequest(req) ? req : await toWebRequest(req);
      const response = await handler(request);

      if (!res) {
        return response;
      }

      await writeFetchResponse(res, response);
    } catch (error) {
      console.error('[webHandler] Fatal error:', error);
      const response = new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!res) {
        return response;
      }

      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(await response.text());
    }
  }) as DualModeHandler;
}
