/**
 * Concurrency & Timing Utilities
 */

/**
 * Helper to control concurrency when processing array items
 * @param items The array of items to process
 * @param concurrency The maximum number of concurrent operations
 * @param fn The async function to execute for each item
 * @returns A promise that resolves to an array of results in the same order as the input items
 */
export const concurrentMap = async <T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let currentIndex = 0;
  let hasError = false;

  const worker = async () => {
    while (!hasError) {
      const index = currentIndex++;
      if (index >= items.length) {
        break;
      }
      try {
        results[index] = await fn(items[index]);
      } catch (error) {
        hasError = true;
        throw error;
      }
    }
  };

  // Start workers
  const workers = Array.from(
    { length: Math.min(items.length, concurrency) },
    worker,
  );

  await Promise.all(workers);
  return results;
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false,
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
};

export const scheduleIdleWork = (
  work: () => void,
  timeoutMs = 2000,
): (() => void) => {
  if (typeof window === "undefined") return () => undefined;

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(work, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(idleId);
  }

  const timerId = globalThis.setTimeout(work, Math.min(timeoutMs, 400));
  return () => globalThis.clearTimeout(timerId);
};
