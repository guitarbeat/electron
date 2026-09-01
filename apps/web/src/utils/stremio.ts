/**
 * Stremio Deep-Linking and URL Construction Utilities
 */

export type StremioTarget = "movie" | "series";

export interface StremioMediaObject {
  title: string;
  type?: string;
  mediaType?: string;
  imdbID?: string;
  imdbId?: string;
}

export function buildStremioSearchUrl(query: string): string {
  const clean = query.trim();
  if (!clean) return "stremio://";
  return `stremio://search?search=${encodeURIComponent(clean)}`;
}

export function buildStremioDetailUrl(
  type: StremioTarget,
  imdbId?: string | null,
): string | null {
  if (!imdbId) return null;
  const cleanId = imdbId.trim();
  if (!cleanId) return null;
  return `stremio://detail/${type}/${cleanId}`;
}

export function getStremioUrls(
  target: string | StremioMediaObject,
  typeArg: StremioTarget = "movie",
  imdbIdArg?: string | null,
): {
  detailUrl: string | null;
  searchUrl: string;
  appUrl: string;
  hasDirectImdbMatch: boolean;
} {
  let title = "";
  let type: StremioTarget = "movie";
  let imdbId: string | null | undefined = undefined;

  if (typeof target === "object" && target !== null) {
    title = target.title;
    const mediaType = target.mediaType || target.type;
    type = mediaType === "series" ? "series" : "movie";
    imdbId = target.imdbID || target.imdbId;
  } else {
    title = target;
    type = typeArg;
    imdbId = imdbIdArg;
  }

  const detailUrl = buildStremioDetailUrl(type, imdbId);
  const searchUrl = buildStremioSearchUrl(title);
  const appUrl = detailUrl || searchUrl;
  const hasDirectImdbMatch = Boolean(detailUrl);

  return { detailUrl, searchUrl, appUrl, hasDirectImdbMatch };
}
