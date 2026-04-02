import * as https from 'node:https';
import * as http from 'node:http';
import { URL } from 'node:url';

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;
const DEFAULT_TIMEOUT_MS = 15000;

interface FetchResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

const nodeFetch = (
  input: string | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<FetchResponse> => {
  return new Promise((resolve, reject) => {
    const url = typeof input === 'string' ? new URL(input) : input;
    const method = (init?.method ?? 'GET').toUpperCase();

    const rawHeaders = init?.headers;
    const headersRecord: Record<string, string> = {};
    if (rawHeaders instanceof Headers) {
      rawHeaders.forEach((value, key) => {
        headersRecord[key] = value;
      });
    } else if (rawHeaders && typeof rawHeaders === 'object') {
      Object.assign(headersRecord, rawHeaders);
    }

    const body = init?.body as string | undefined;
    if (body) {
      headersRecord['Content-Length'] = Buffer.byteLength(body).toString();
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: headersRecord,
    };

    const transport = url.protocol === 'https:' ? https : http;

    let settled = false;
    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    const req = transport.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        settle(() => {
          const bodyText = Buffer.concat(chunks).toString('utf-8');
          const status = res.statusCode ?? 0;
          const rawResponseHeaders = res.headers;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            headers: {
              get(name: string): string | null {
                const val = rawResponseHeaders[name.toLowerCase()];
                if (Array.isArray(val)) return val.join(', ');
                return val ?? null;
              },
            },
            json: async () => JSON.parse(bodyText) as unknown,
            text: async () => bodyText,
          });
        });
      });
      res.on('error', (err) => settle(() => reject(err)));
    });

    const timer = setTimeout(() => {
      settle(() => {
        req.destroy();
        reject(new DOMException('This operation was aborted', 'AbortError'));
      });
    }, timeoutMs);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        settle(() => {
          req.destroy();
          reject(new DOMException('This operation was aborted', 'AbortError'));
        });
      } else {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            settle(() => {
              req.destroy();
              reject(new DOMException('This operation was aborted', 'AbortError'));
            });
          },
          { once: true }
        );
      }
    }

    req.on('error', (err) => {
      clearTimeout(timer);
      settle(() => reject(err));
    });

    if (body) {
      req.write(body);
    }
    req.end();

    req.on('response', () => clearTimeout(timer));
  });
};

const isRetryableStatus = (status: number): boolean => {
  if (status === 429) {
    return true;
  }
  if (status === 502 || status === 503 || status === 504) {
    return true;
  }
  if (status >= 500) {
    return true;
  }
  return false;
};

const parseRetryAfterMs = (response: FetchResponse): number | null => {
  const raw = response.headers.get('Retry-After');
  if (!raw) {
    return null;
  }
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }
  return seconds * 1000;
};

const withJitter = (ms: number): number => {
  const jitter = Math.floor(Math.random() * Math.min(ms * 0.25, 500));
  return ms + jitter;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Retries transient GitHub API failures (429, 5xx) and network errors.
 * Returns the last response when retries are exhausted or on non-retryable status.
 * Uses Node's built-in https module to avoid undici/fetch connectivity issues.
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: string,
  options: { timeoutMs?: number } = {}
): Promise<FetchResponse> => {
  let lastResponse: FetchResponse | undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const signal = init?.signal as AbortSignal | undefined;
      const response = await nodeFetch(
        typeof input === 'string' ? input : input.toString(),
        init,
        timeoutMs,
        signal
      );
      lastResponse = response;

      if (response.ok) {
        return response;
      }

      if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
        return response;
      }

      const retryAfterMs = parseRetryAfterMs(response);
      const exponential = withJitter(
        Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1))
      );
      const delayMs =
        response.status === 429 && retryAfterMs != null
          ? Math.min(MAX_DELAY_MS, withJitter(retryAfterMs))
          : exponential;

      await sleep(delayMs);
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error instanceof Error ? error : new Error(`${context}: ${String(error)}`);
      }
      const delayMs = withJitter(
        Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1))
      );
      await sleep(delayMs);
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new Error(`${context}: no response`);
};
