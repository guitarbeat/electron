/* eslint-disable react-refresh/only-export-components */
import {
  buildCollectionSections,
  compareCreatedAtDesc,
  compareStringsAlpha,
  type CollectionSections,
} from "@/utils/shared";
import {
  getListEnterSelectionIndex,
  getNextListIndex,
} from "@/components/ui/lib/workspaceListAutocomplete";

export const MAX_MOVIE_NOTE_LENGTH = 500;
export const MAX_RECOMMENDATION_REASON_LENGTH = 150;
export const MAX_GUEST_SUGGESTER_NAME_LENGTH = 30;
export interface MovieActionState {
  isGuest: boolean;
  watchedByCurrentUser: boolean;
  showActionRail: boolean;
  showWatchedAction: boolean;
  primaryActionLabel: string;
  primaryActionCompactLabel: string;
  primaryActionAriaLabel: string | null;
}

interface GetMovieActionStateParams {
  movie: Movie;
  currentUser: User | null;
}

export const getMovieActionState = ({
  movie,
  currentUser,
}: GetMovieActionStateParams): MovieActionState => {
  const isGuest = !currentUser;
  const watchedByCurrentUser = currentUser
    ? movie.watchedBy.includes(currentUser)
    : false;
  const showWatchedAction = Boolean(currentUser);
  const showActionRail = showWatchedAction;

  let primaryActionAriaLabel: string | null = null;
  if (showWatchedAction) {
    primaryActionAriaLabel = watchedByCurrentUser
      ? `Mark "${movie.title}" as unwatched`
      : `Mark "${movie.title}" as watched`;
  }

  return {
    isGuest,
    watchedByCurrentUser,
    showActionRail,
    showWatchedAction,
    primaryActionLabel: watchedByCurrentUser ? "Watched" : "Mark watched",
    primaryActionCompactLabel: watchedByCurrentUser ? "Watched" : "Watch",
    primaryActionAriaLabel,
  };
};

export const MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
export const MOVIE_AUTOCOMPLETE_DEBOUNCE_MS = 75;

export const normalizeMovieAutocompleteQuery = (value: string): string =>
  value.trim().toLowerCase();

export const shouldFetchMovieAutocomplete = (
  query: string,
  selectedResult: MovieAutocompleteResult | null,
): boolean => {
  const normalizedQuery = normalizeMovieAutocompleteQuery(query);
  if (normalizedQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return false;
  }

  if (!selectedResult) {
    return true;
  }

  return (
    normalizeMovieAutocompleteQuery(selectedResult.title) !== normalizedQuery
  );
};

export const shouldClearSelectedMovieResult = (
  query: string,
  selectedResult: MovieAutocompleteResult | null,
): boolean => {
  if (!selectedResult) {
    return false;
  }

  return (
    normalizeMovieAutocompleteQuery(query) !==
    normalizeMovieAutocompleteQuery(selectedResult.title)
  );
};

export const hasStoredMovieAutocompleteFeedback = (
  query: string,
  cachedQuery: string,
  resultCount: number,
  error: string | null,
): boolean => {
  const normalizedQuery = normalizeMovieAutocompleteQuery(query);
  if (normalizedQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
    return false;
  }

  return normalizedQuery === cachedQuery && (resultCount > 0 || error !== null);
};

export const getMovieAutocompleteEnterSelectionIndex =
  getListEnterSelectionIndex;

export const getNextMovieAutocompleteIndex = getNextListIndex;
export type MovieBrowseLayout = "grid" | "scroll";

const STORAGE_KEY = "movie-watch.movies.browseLayout";

/** Scroll deck fans one card per movie — keep this bounded for mobile performance. */
export const MOVIE_SCROLL_DECK_MAX_DESKTOP = 24;
export const MOVIE_SCROLL_DECK_MAX_MOBILE = 16;

export const movieScrollDeckMax = (isMobile: boolean): number =>
  isMobile ? MOVIE_SCROLL_DECK_MAX_MOBILE : MOVIE_SCROLL_DECK_MAX_DESKTOP;

export const shouldUseMovieScrollDeck = (
  movieCount: number,
  browseLayout: MovieBrowseLayout,
  isMobile: boolean,
): boolean =>
  browseLayout === "scroll" &&
  movieCount >= 2 &&
  movieCount <= movieScrollDeckMax(isMobile);

export const MOVIE_BROWSE_LAYOUTS: Array<{
  value: MovieBrowseLayout;
  label: string;
}> = [
  { value: "grid", label: "⊞ Grid" },
  { value: "scroll", label: "↕ Scroll" },
];

export const readMovieBrowseLayout = (): MovieBrowseLayout => {
  if (typeof window === "undefined") {
    return "grid";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "scroll" || stored === "grid") {
    return stored;
  }

  return "grid";
};

export const writeMovieBrowseLayout = (layout: MovieBrowseLayout): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, layout);
};

const USERS: User[] = ["Aaron", "Electra"];
const _CINEMATIC_FALLBACKS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop",
];

export const clampMovieTransitionOrigin = (
  origin: MovieTransitionOrigin | null,
) =>
  origin
    ? {
        top: `${origin.top}px`,
        left: `${origin.left}px`,
        width: `${origin.width}px`,
        height: `${origin.height}px`,
      }
    : { top: "50dvh", left: "50vw", width: "18rem", height: "27rem" };

export const getMovieDialogMetrics = (isMobile: boolean) => {
  const viewportWidth =
    typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight =
    typeof window === "undefined" ? 800 : window.innerHeight;
  return {
    targetWidth: Math.min(viewportWidth - 32, isMobile ? 544 : 1440),
    targetHeight: Math.min(viewportHeight - 32, isMobile ? 768 : 900),
  };
};

export const getMovieWatchStatus = (movie: Movie) => {
  if (movie.watchedBy.length === USERS.length) {
    return {
      label: "Seen together",
      title: "Already a shared watch",
      detail: "You both marked this watched already.",
    };
  }
  if (movie.watchedBy.length === 1) {
    const watcher = movie.watchedBy[0];
    const remaining = USERS.find((user) => !movie.watchedBy.includes(user));
    return {
      label: `${watcher} watched`,
      title: `${watcher} is ahead on this one`,
      detail: remaining
        ? `${remaining} still has this waiting in the queue.`
        : "One watch logged so far.",
    };
  }
  return {
    label: "Still queued",
    title: "Still sitting in the lineup",
    detail: `${movie.addedBy} queued it for a future night.`,
  };
};

export type MovieSortOrder = "recent" | "alpha" | "rating";

export type MovieSections = CollectionSections<Movie, MovieSuggestion>;

export const getAllMovies = (sections: MovieSections): Movie[] => [
  ...sections.queue,
  ...sections.completed,
];

function parseImdbRating(rating: string | undefined): number {
  return parseFloat(rating ?? "0") || 0;
}

function sortMovies(movies: Movie[], sortOrder: MovieSortOrder): Movie[] {
  const sorted = [...movies];
  switch (sortOrder) {
    case "alpha":
      return sorted.sort((a, b) => compareStringsAlpha(a.title, b.title));
    case "rating":
      return sorted.sort(
        (a, b) => parseImdbRating(b.imdbRating) - parseImdbRating(a.imdbRating),
      );
    case "recent":
    default:
      return sorted.sort(compareCreatedAtDesc);
  }
}

export const buildMovieSections = (
  movies: Movie[],
  pendingSuggestions: MovieSuggestion[],
  sortOrder: MovieSortOrder = "recent",
): MovieSections => {
  const sorted = sortMovies(movies, sortOrder);
  return buildCollectionSections(
    sorted,
    pendingSuggestions,
    (movie) => movie.watchedBy.length === 2,
  );
};

export type MediaTypeFilter = "all" | "movie" | "series";

/**
 * Robustly detects whether a movie record is a TV Series.
 * Checks mediaType, category, runtime (seasons/episodes), and year ranges (e.g. 2020–2024).
 */
export const isTvSeries = (movie: Partial<Movie>): boolean => {
  if (movie.mediaType === "series") return true;
  if (movie.mediaType === "movie") return false;

  const cat = movie.category?.toLowerCase() ?? "";
  if (cat.includes("series") || cat.includes("tv")) return true;

  const runtime = movie.runtime?.toLowerCase() ?? "";
  if (runtime.includes("season") || runtime.includes("ep")) return true;

  if (movie.year && /\d{4}\s*[–-]\s*(\d{4})?/.test(movie.year)) return true;

  return false;
};

export const getMediaType = (movie: Partial<Movie>): "movie" | "series" =>
  isTvSeries(movie) ? "series" : "movie";

export const filterMoviesByMediaType = (
  movies: Movie[],
  filter: MediaTypeFilter,
): Movie[] => {
  if (filter === "all") return movies;
  return movies.filter((m) =>
    filter === "series" ? isTvSeries(m) : !isTvSeries(m),
  );
};

/* eslint-disable react-refresh/only-export-components */
import React from "react";
import type {
  Movie,
  User,
  MovieSuggestion,
  MoviesViewProps,
} from "@/shared/types";


import {
  StremioButton,
  YoutubeButton,
  CardActionButton,
  PageFlip,
  type PageFlipLeaf,
  type BentoSortChipConfig,
} from "@/components/ui";
import {
  CheckIcon,
  FilmIcon,
  EditIcon,
  PlayIcon,
  StarIcon,
  TvIcon,
} from "@/common/Icons";
import {
  formatMemoryTimestamp,
  resolvePosterUrl,
} from "@/utils";
import {
  type MovieAutocompleteResult,
} from "@/services/metadata";





export const MOVIE_SECTION_IDS = {
  incoming: "movies-section-incoming",
  queue: "movies-section-queue",
  completed: "movies-section-watched",
};

export const MOVIE_SORTS: BentoSortChipConfig[] = [
  { value: "recent", label: "🕐 Recent" },
  { value: "alpha", label: "A→Z" },
  { value: "rating", label: "★ Rating" },
];

export type MoviesWorkspaceViewProps = MoviesViewProps & {
  posterPlaceCards?: React.ReactNode[];
  isInteractionStatic?: boolean;
};
/* -------------------------------------------------------------------------- */
/* Sub-component: PosterHero                                                   */
/* -------------------------------------------------------------------------- */

interface PosterHeroProps {
  movie: Movie;
  watchStatusLabel: string;
  hasPosterError: boolean;
  onPosterError: () => void;
  isMobile?: boolean;
}

export const PosterHero: React.FC<PosterHeroProps> = ({
  movie,
  watchStatusLabel,
  hasPosterError,
  onPosterError,
  isMobile = false,
}) => {
  const resolvedPosterUrl = movie.customPosterUrl || movie.posterUrl;
  const isCustomOrValid = Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = isCustomOrValid
    ? (resolvedPosterUrl as string)
    : resolvePosterUrl(undefined, movie.id || movie.title);

  const [isBookletMode, setIsBookletMode] = React.useState(!isMobile);
  const [isMobileBookletOpen, setIsMobileBookletOpen] = React.useState(false);

  const pages: PageFlipLeaf[] = React.useMemo(() => {
    return [
      {
        id: "cover",
        front: activePosterUrl,
        frontAlt: `${movie.title} cover`,
        back: (
          <div className="flex h-full w-full flex-col justify-between p-4 bg-[#0b101b] text-white border-l border-white/10 select-none">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                  Film Dossier
                </span>
                <span className="text-[11px] text-white/50">{movie.year || ""}</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 mb-2">
                {movie.title}
              </h4>
              {movie.director && (
                <div className="text-[11px] text-slate-300 mb-1">
                  <span className="text-white/50">Director:</span> {movie.director}
                </div>
              )}
              {movie.genre && (
                <div className="text-[11px] text-slate-300 mb-1">
                  <span className="text-white/50">Genre:</span> {movie.genre}
                </div>
              )}
              {movie.runtime && (
                <div className="text-[11px] text-slate-300 mb-1">
                  <span className="text-white/50">Runtime:</span> {movie.runtime}
                </div>
              )}
              {movie.imdbRating && movie.imdbRating !== "N/A" && (
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/30">
                  <StarIcon size={10} fill style={{ color: "#fbbf24" }} />
                  <span>IMDb {movie.imdbRating}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-white/40 border-t border-white/10 pt-2 flex justify-between">
              <span>Page 1 of 2</span>
              <span>Flip →</span>
            </div>
          </div>
        ),
      },
      {
        id: "details",
        front: (
          <div className="flex h-full w-full flex-col justify-between p-4 bg-[#080d17] text-white border-r border-white/10 select-none">
            <div>
              <span className="text-[11px] font-bold text-sky-400 tracking-wider uppercase block mb-1.5">
                Overview
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-6">
                {movie.plot || "No overview recorded for this title."}
              </p>
              {movie.category && (
                <div className="mt-2 text-[11px] text-slate-400">
                  <span className="text-white/60 font-semibold block text-[10px] uppercase">Mood / Category:</span>
                  <span className="line-clamp-2">{movie.category}</span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-white/40 border-t border-white/10 pt-2 flex justify-between">
              <span>Page 2 of 2</span>
              <span>← Flip</span>
            </div>
          </div>
        ),
        back: (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-4 bg-slate-900 text-center select-none overflow-hidden">
            <img
              src={activePosterUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs scale-110"
            />
            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Viewing Status
              </span>
              <h4 className="text-sm font-bold text-white mb-1.5">
                {watchStatusLabel}
              </h4>
              <p className="text-[11px] text-slate-300 max-w-[170px] mx-auto leading-tight">
                {movie.watchedBy.length === 2
                  ? "Watched together by Aaron & Electra ❤️"
                  : movie.watchedBy.length === 1
                    ? `Watched by ${movie.watchedBy[0]}`
                    : "On the movie night watchlist"}
              </p>
            </div>
          </div>
        ),
      },
    ];
  }, [movie, activePosterUrl, watchStatusLabel]);

  return (
    <figure
      className="movie-details-modal__poster-shell"
      aria-label={`Poster for ${movie.title}`}
    >
      <img
        src={activePosterUrl}
        alt=""
        aria-hidden="true"
        className="movie-details-modal__poster-bg"
        loading="lazy"
        decoding="async"
      />

      {/* Desktop/Tablet inline booklet mode */}
      {!isMobile && isBookletMode ? (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 pt-14">
          <PageFlip
            pages={pages}
            pageWidth={200}
            pageHeight={300}
            spineShift={95}
            pageRadius={8}
            turnAngle={180}
            peekAngle={14}
            shadow={0.4}
          />
          <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
            <span className="text-[11px] text-white/80 font-medium">
              📖 Drag or click to flip pages
            </span>
          </div>
        </div>
      ) : (
        <>
          <img
            src={activePosterUrl}
            alt={`${movie.title} poster`}
            className="movie-details-modal__poster"
            loading="lazy"
            decoding="async"
            fetchPriority="high"
            onError={onPosterError}
          />
          <div
            className="movie-details-modal__poster-gradient"
            aria-hidden="true"
          />
        </>
      )}

      {/* Mobile dedicated 3D Flipbook overlay */}
      {isMobile && isMobileBookletOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b14]/95 backdrop-blur-xl p-4 select-none"
          role="dialog"
          aria-modal="true"
          aria-label={`${movie.title} 3D Flipbook`}
        >
          <button
            type="button"
            onClick={() => setIsMobileBookletOpen(false)}
            className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 text-lg transition cursor-pointer"
            aria-label="Close 3D booklet"
          >
            ✕
          </button>
          <PageFlip
            pages={pages}
            pageWidth={170}
            pageHeight={255}
            spineShift={75}
            pageRadius={8}
            turnAngle={180}
            peekAngle={14}
            shadow={0.45}
          />
          <div className="flex items-center gap-1.5 mt-5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="text-xs text-white/90 font-medium">
              📖 Swipe or tap to flip pages
            </span>
          </div>
        </div>
      )}

      {/* Badges Overlay */}
      <div className="movie-details-modal__poster-badges z-20" role="status">
        <span
          className={`movie-details-modal__poster-pill ${movie.watchedBy.length > 0 ? "movie-details-modal__poster-pill--status" : ""}`}
        >
          {movie.watchedBy.length > 0 && (
            <CheckIcon size={12} style={{ marginRight: "0.25rem" }} />
          )}
          {watchStatusLabel}
        </span>
        {movie.imdbRating && movie.imdbRating !== "N/A" && (
          <span className="movie-details-modal__poster-pill movie-details-modal__poster-pill--rating">
            <StarIcon
              size={11}
              fill
              style={{ color: "#fbbf24", marginRight: "0.2rem" }}
            />
            {movie.imdbRating}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              setIsMobileBookletOpen(true);
            } else {
              setIsBookletMode((prev) => !prev);
            }
          }}
          className="movie-details-modal__poster-pill cursor-pointer transition hover:bg-white/30"
          aria-label={
            isMobile
              ? "Open 3D page flip booklet"
              : isBookletMode
                ? "Switch to standard poster view"
                : "Switch to 3D page flip booklet"
          }
        >
          {isMobile ? "📖 3D Flip" : isBookletMode ? "🖼️ Poster" : "📖 3D Flip"}
        </button>
      </div>

      {/* Footer Details */}
      <figcaption className="movie-details-modal__poster-footer">
        <span className="movie-details-modal__poster-caption">
          Queued by <strong>{movie.addedBy}</strong>
        </span>
        {movie.watchedBy.length > 0 && (
          <span className="movie-details-modal__poster-caption">
            Watched by <strong>{movie.watchedBy.join(" & ")}</strong>
          </span>
        )}
      </figcaption>
    </figure>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-component: MetadataHeader                                               */
/* -------------------------------------------------------------------------- */

interface MetadataHeaderProps {
  movie: Movie;
  metadataItems: string[];
  watchStatus: { title: string; detail: string; label: string };
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onEdit?: () => void;
}

export const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  movie,
  metadataItems,
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onEdit,
}) => {
  const isSeries = isTvSeries(movie);

  return (
    <header className="movie-details-modal__header">
      {/* Clean Eyebrow Category */}
      <div className="movie-details-modal__eyebrow">
        <span className="movie-details-modal__type-badge">
          {isSeries ? (
            <TvIcon size={12} style={{ marginRight: "0.3rem" }} />
          ) : (
            <FilmIcon size={12} style={{ marginRight: "0.3rem" }} />
          )}
          {isSeries ? "TV SERIES" : "FEATURE FILM"}
        </span>
        {movie.category && movie.category !== "TV Series" && (
          <span className="movie-details-modal__category-tag">
            {movie.category}
          </span>
        )}
      </div>

      <div className="movie-details-modal__title-row">
        <h2 id="movie-details-title" className="movie-details-modal__title">
          {movie.title}
        </h2>
      </div>

      {/* Clean Specs Fact Pills */}
      {metadataItems.length > 0 && (
        <div
          className="movie-details-modal__fact-row"
          role="list"
          aria-label="Movie specs"
        >
          {metadataItems.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="movie-details-modal__fact-pill"
              role="listitem"
            >
              {item}
            </span>
          ))}
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <span
              className="movie-details-modal__fact-pill movie-details-modal__fact-pill--imdb"
              role="listitem"
            >
              <StarIcon
                size={12}
                fill
                style={{ color: "#fbbf24", marginRight: "0.25rem" }}
              />
              {movie.imdbRating} IMDb
            </span>
          )}
        </div>
      )}

      {/* Primary Action Buttons */}
      <div
        className="movie-details-modal__actions"
        role="toolbar"
        aria-label="Movie actions"
      >
        {movie.mediaType === "youtube" && movie.youtubeUrl ? (
          <YoutubeButton url={movie.youtubeUrl} movieTitle={movie.title} variant="full" />
        ) : (
          <StremioButton movie={movie} variant="full" />
        )}
        {onToggleWatched && (
          <CardActionButton
            variant={isWatchedByCurrentUser ? "primary" : "outline"}
            onClick={() => void onToggleWatched()}
            aria-pressed={isWatchedByCurrentUser}
            disabled={isUpdatingWatchStatus}
            leftIcon={isWatchedByCurrentUser ? <CheckIcon /> : <PlayIcon />}
          >
            {isWatchedByCurrentUser ? "Watched" : "Mark as Watched"}
          </CardActionButton>
        )}
        {onEdit && (
          <CardActionButton
            variant="outline"
            onClick={onEdit}
            leftIcon={<EditIcon />}
          >
            Edit
          </CardActionButton>
        )}
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-component: SummaryBand                                                  */
/* -------------------------------------------------------------------------- */

interface SummaryBandProps {
  movie: Movie;
  addedBy: string;
  watchStatusLabel: string;
}

export const SummaryBand: React.FC<SummaryBandProps> = ({
  movie,
  addedBy,
  watchStatusLabel,
}) => (
  <div
    className="movie-details-modal__summary-band"
    role="region"
    aria-label="Movie details summary"
  >
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Queued By</span>
      <span className="movie-details-modal__summary-value">{addedBy}</span>
      <span className="movie-details-modal__summary-sub">
        {formatMemoryTimestamp(movie.createdAt)}
      </span>
    </div>
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Watch Status</span>
      <span className="movie-details-modal__summary-value movie-details-modal__summary-value--accent">
        {watchStatusLabel}
      </span>
      <span className="movie-details-modal__summary-sub">
        {movie.watchedBy.length > 0 ? movie.watchedBy.join(" & ") : "In queue"}
      </span>
    </div>
  </div>
);

export interface MovieTransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface MovieBodyActions {
  toggleWatched: (id: string) => void | unknown;
  editMovie: (
    id: string,
    updates: { title: string; customPosterUrl?: string },
  ) => void | unknown;
}

export interface MovieSectionIds {
  incoming?: string;
  queue?: string;
  completed?: string;
}
