/** Run work during browser idle time, with a timeout fallback. */
export const scheduleIdleWork = (
  work: () => void,
  timeoutMs = 2000,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(work, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(idleId);
  }

  const timerId = globalThis.setTimeout(work, Math.min(timeoutMs, 400));
  return () => globalThis.clearTimeout(timerId);
};
