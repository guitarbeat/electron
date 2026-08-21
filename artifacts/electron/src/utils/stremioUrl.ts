/**
 * Stremio deep linking helper functions.
 * Formats custom stremio:// protocol URLs for native app launching,
 * as well as web.stremio.com web app fallbacks.
 */

export interface StremioTarget {
  title: string;
  imdbID?: string;
  mediaType?: "movie" | "series";
}

export interface StremioUrls {
  /** Deep link protocol to open the Stremio desktop/mobile/TV application */
  appUrl: string;
  /** HTTPS web app fallback URL for web.stremio.com */
  webUrl: string;
  /** Human-readable description of the link target */
  hasDirectImdbMatch: boolean;
}

export function getStremioUrls(target: StremioTarget): StremioUrls {
  const { title, imdbID, mediaType } = target;
  const isSeries = mediaType === "series";
  const contentType = isSeries ? "series" : "movie";

  const cleanImdb = imdbID?.trim();
  const isValidImdb = cleanImdb && /^tt\d+/i.test(cleanImdb);

  if (isValidImdb) {
    return {
      appUrl: `stremio://detail/${contentType}/${cleanImdb}`,
      webUrl: `https://web.stremio.com/#/detail/${contentType}/${cleanImdb}`,
      hasDirectImdbMatch: true,
    };
  }

  const encodedQuery = encodeURIComponent(title.trim());
  return {
    appUrl: `stremio://search?search=${encodedQuery}`,
    webUrl: `https://web.stremio.com/#/search?search=${encodedQuery}`,
    hasDirectImdbMatch: false,
  };
}
