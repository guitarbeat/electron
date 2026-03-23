const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;
const DEFAULT_TIMEOUT_MS = 5000;

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

const parseRetryAfterMs = (response: Response): number | null => {
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
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: string,
  options: { timeoutMs?: number } = {}
): Promise<Response> => {
  let lastResponse: Response | undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const signal = init?.signal;
      if (signal) {
        if (signal.aborted) {
          controller.abort();
        } else {
          signal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }

      let response: Response | undefined;
      try {
        response = await fetch(input, {
          ...(init || {}),
          signal: controller.signal,
        });
        lastResponse = response;
      } finally {
        clearTimeout(timeoutId);
      }

      // If `fetch()` didn't throw, `response` must be set.
      if (!response) {
        throw new Error(`${context}: no response`);
      }

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
