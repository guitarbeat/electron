const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;
const DEFAULT_TIMEOUT_MS = 15000;

interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

const isRetryableStatus = (status: number): boolean => {
  return status === 429 || status === 502 || status === 503 || status === 504 || status >= 500;
};

const parseRetryAfterMs = (response: Response): number | null => {
  const raw = response.headers.get('Retry-After');
  if (!raw) return null;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
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
 * Uses globalThis.fetch (standard in Node 18+).
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: string,
  options: { timeoutMs?: number } = {}
): Promise<FetchResponse> => {
  let lastResponse: Response | undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const signal = init?.signal 
        ? AbortSignal.any([init.signal, controller.signal]) 
        : controller.signal;

      const response = await fetch(input, {
        ...init,
        signal,
      });
      lastResponse = response;

      if (response.ok) {
        clearTimeout(timeoutId);
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          json: () => response.json(),
          text: () => response.text(),
        };
      }

      if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
        clearTimeout(timeoutId);
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          json: () => response.json(),
          text: () => response.text(),
        };
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
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastResponse) {
    return {
      ok: lastResponse.ok,
      status: lastResponse.status,
      statusText: lastResponse.statusText,
      headers: lastResponse.headers,
      json: () => lastResponse.json(),
      text: () => lastResponse.text(),
    };
  }

  throw new Error(`${context}: no response`);
};
