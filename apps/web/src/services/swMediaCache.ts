/**
 * Helper to pre-warm media assets (posters, memory images) in the service worker cache
 * for seamless offline display.
 */

export const warmServiceWorkerMedia = (urls: (string | undefined | null)[]): void => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const validUrls = urls.filter((url): url is string => {
    if (!url || typeof url !== "string") return false;
    return (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      (url.startsWith("/") && !url.startsWith("/api/"))
    );
  });

  if (validUrls.length === 0) return;

  if (navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_URLS",
        urls: validUrls,
      });
    } catch {
      // Non-fatal if messaging is unavailable
    }
  } else {
    // Controller might not be ready yet on initial boot; listen on ready
    navigator.serviceWorker.ready
      .then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: "CACHE_URLS",
            urls: validUrls,
          });
        }
      })
      .catch(() => undefined);
  }
};
