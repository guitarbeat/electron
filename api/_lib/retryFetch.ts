const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;
const DEFAULT_TIMEOUT_MS = 15000;

const isRetryableStatus = (status: number): boolean => {
  return status === 429 || (status >= 500 && status !== 501);
};

const parseRetryAfterMs = (response: Response): number | null => {
  const raw = response.headers.get("Retry-After");
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
 * Returns true when the abort was triggered by the caller's signal (not our
 * internal timeout controller).  Caller-initiated aborts should not be retried.
 */
const isCallerAbort = (
  error: unknown,
  callerSignal: AbortSignal | undefined,
): boolean => {
  if (!callerSignal?.aborted) return false;
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError";
};

/**
 * Retries transient HTTP failures (429, 5xx) and network errors.
 * Returns the last response when retries are exhausted or on non-retryable status.
 * Uses globalThis.fetch (standard in Node 18+).
 *
 * Caller-initiated aborts (via init.signal) propagate immediately without retry.
 */
export const fetchWithRetry = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  context: string,
  options: { timeoutMs?: number } = {},
): Promise<Response> => {
  let lastResponse: Response | undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const callerSignal = init?.signal as AbortSignal | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const signal = callerSignal
        ? AbortSignal.any([callerSignal, controller.signal])
        : controller.signal;

      const response = await fetch(input, {
        ...init,
        signal,
      });
      lastResponse = response;

      if (response.ok) {
        clearTimeout(timeoutId);
        return response;
      }

      if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
        clearTimeout(timeoutId);
        return response;
      }

      const retryAfterMs = parseRetryAfterMs(response);
      const exponential = withJitter(
        Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1)),
      );
      const delayMs =
        response.status === 429 && retryAfterMs != null
          ? Math.min(MAX_DELAY_MS, withJitter(retryAfterMs))
          : exponential;

      await sleep(delayMs);
    } catch (error) {
      // If the caller explicitly aborted, propagate immediately without retrying.
      if (isCallerAbort(error, callerSignal)) {
        clearTimeout(timeoutId);
        throw error instanceof Error ? error : new Error(`${context}: aborted`);
      }

      if (attempt === MAX_ATTEMPTS) {
        throw error instanceof Error
          ? error
          : new Error(`${context}: ${String(error)}`);
      }
      const delayMs = withJitter(
        Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** (attempt - 1)),
      );
      await sleep(delayMs);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new Error(`${context}: no response`);
};
