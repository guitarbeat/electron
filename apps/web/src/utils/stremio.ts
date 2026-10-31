/**
 * Stremio deep links.
 *
 * Formats follow Stremio's deep-link docs (stremio-addon-sdk docs/deep-links.md), which the
 * desktop, Android / Android TV, and web apps share:
 *   stremio:///detail/{type}/{id}/{videoId}   a title's page; for a movie the videoId is the
 *                                             IMDb id again, which opens its streams list
 *   stremio:///detail/series/{id}             a series' page with its episode list
 *   stremio:///search?search={query}          a search, used only when no IMDb id is known
 * On a TV, movie links add `?autoPlay=true`, which only Stremio's Android TV app honours: it
 * starts the first stream instead of stopping on the streams list.
 * The path needs three slashes. `stremio://detail/...` makes "detail" the URI host, so the
 * app opens without navigating anywhere.
 */

export type StremioTarget = "movie" | "series";

export interface StremioMediaObject {
  title: string;
  type?: string;
  mediaType?: string;
  category?: string;
  imdbID?: string;
  imdbId?: string;
}

const IMDB_ID = /^tt\d{5,}$/;

/** A real IMDb title id (tt + digits). Catalog ids such as TVMaze's `tv-123` are not. */
export function normalizeImdbId(value?: string | null): string | null {
  const clean = value?.trim().toLowerCase() ?? "";
  return IMDB_ID.test(clean) ? clean : null;
}

const SERIES_TYPES = new Set(["series", "tv", "show", "tvshow", "tv show", "tv series", "tv-series", "tvseries", "episode"]);

/** Stremio only knows "movie" and "series"; every TV spelling the data uses maps to series. */
export function toStremioType(...values: Array<string | null | undefined>): StremioTarget {
  return values.some((value) => value && SERIES_TYPES.has(value.trim().toLowerCase())) ? "series" : "movie";
}

export function buildStremioSearchUrl(query: string): string {
  const clean = query.trim();
  if (!clean) return "stremio:///";
  return `stremio:///search?search=${encodeURIComponent(clean)}`;
}

export interface StremioLinkOptions {
  /** Running on a TV, where Stremio's Android TV app can start a movie straight away. */
  isTv?: boolean;
}

export function buildStremioDetailUrl(
  type: StremioTarget,
  imdbId?: string | null,
  { isTv = false }: StremioLinkOptions = {},
): string | null {
  const id = normalizeImdbId(imdbId);
  if (!id) return null;
  if (type === "series") return `stremio:///detail/series/${id}`;
  return `stremio:///detail/movie/${id}/${id}${isTv ? "?autoPlay=true" : ""}`;
}

export function getStremioUrls(
  target: string | StremioMediaObject,
  typeArg: StremioTarget = "movie",
  imdbIdArg?: string | null,
  options: StremioLinkOptions = {},
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
    type = toStremioType(target.mediaType || target.type, target.category);
    imdbId = normalizeImdbId(target.imdbID) ?? normalizeImdbId(target.imdbId) ?? imdbIdArg;
  } else {
    title = target;
    type = typeArg;
    imdbId = imdbIdArg;
  }

  const detailUrl = buildStremioDetailUrl(type, imdbId, options);
  const searchUrl = buildStremioSearchUrl(title);
  // Open the title itself when its IMDb id is known; search only as a fallback.
  const appUrl = detailUrl ?? searchUrl;
  const hasDirectImdbMatch = Boolean(detailUrl);

  return { detailUrl, searchUrl, appUrl, hasDirectImdbMatch };
}
