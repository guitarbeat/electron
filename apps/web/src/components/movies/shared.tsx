/* eslint-disable react-refresh/only-export-components */
import { motion } from "motion/react";
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

export interface PosterHeroProps {
  movie: Movie;
  watchStatusLabel: string;
  hasPosterError: boolean;
  onPosterError: () => void;
  isMobile?: boolean;
  metadataItems: string[];
  watchStatus: ReturnType<typeof getMovieWatchStatus>;
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onToggleUserWatched?: (user: User) => void | Promise<void>;
  activeUsers?: User[];
  onEdit?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const PosterHero: React.FC<PosterHeroProps> = ({
  movie,
  watchStatusLabel,
  hasPosterError,
  onPosterError,
  isMobile = false,
  metadataItems,
  watchStatus,
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onToggleUserWatched,
  activeUsers = [],
  onEdit,
  onClose,
  isOpen = true,
}) => {
  const resolvedPosterUrl = movie.customPosterUrl || movie.posterUrl;
  const isCustomOrValid = Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = isCustomOrValid
    ? (resolvedPosterUrl as string)
    : resolvePosterUrl(undefined, movie.id || movie.title);

  const [isMobileBookletOpen, setIsMobileBookletOpen] = React.useState(false);

  const pages: PageFlipLeaf[] = React.useMemo(() => {
    return [
      {
        id: "cover",
        front: activePosterUrl,
        frontAlt: `${movie.title} cover`,
        back: (
          <div className="flex h-full w-full flex-col p-4 bg-[#0d111a] text-white border-l border-white/10 select-none overflow-y-auto custom-scrollbar relative z-10">
            <MetadataHeader
              movie={movie}
              metadataItems={metadataItems}
              watchStatus={watchStatus}
              isWatchedByCurrentUser={isWatchedByCurrentUser}
              isUpdatingWatchStatus={isUpdatingWatchStatus}
              onToggleWatched={onToggleWatched}
              onToggleUserWatched={onToggleUserWatched}
              activeUsers={activeUsers}
              onEdit={onEdit}
            />
          </div>
        ),
      },
      {
        id: "details",
        front: (
          <div className="flex h-full w-full flex-col p-4 bg-[#0d111a] text-white border-r border-white/10 select-none overflow-y-auto custom-scrollbar">
            {movie.plot ? (
              <section aria-labelledby="movie-overview-heading" className="movie-details-modal__section" style={{ padding: 0 }}>
                <h3 id="movie-overview-heading" className="movie-details-modal__section-label">
                  Overview
                </h3>
                <p className="movie-details-modal__plot" style={{ marginBottom: 0 }}>
                  {movie.plot}
                </p>
              </section>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                No overview recorded for this title.
              </div>
            )}
            <footer className="movie-details-modal__footer mt-auto pt-4 border-t border-white/5" style={{ padding: '1rem 0 0' }}>
              <span>
                Catalog item added {new Date(movie.createdAt).toLocaleDateString()}
              </span>
              <span>
                {movie.watchedBy.length === 2
                  ? "Watched by Aaron & Electra"
                  : movie.watchedBy.length === 1
                    ? `Watched by ${movie.watchedBy[0]}`
                    : "Not watched yet"}
              </span>
            </footer>
          </div>
        ),
        back: (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-4 bg-slate-900 text-center select-none overflow-hidden">
            <img
              src={activePosterUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs scale-110 pointer-events-none"
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Viewing Status
              </span>
              <h4 className="text-sm font-bold text-white mb-2">
                {watchStatusLabel}
              </h4>
              <p className="text-[11px] text-slate-300 max-w-[170px] mx-auto leading-tight mb-6">
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
  }, [
    movie,
    activePosterUrl,
    watchStatusLabel,
    metadataItems,
    watchStatus,
    isWatchedByCurrentUser,
    isUpdatingWatchStatus,
    onToggleWatched,
    onToggleUserWatched,
    activeUsers,
    onEdit,
  ]);

  return (
    <figure
      className="movie-details-modal__poster-shell !flex-1 !bg-transparent"
      aria-label={`Poster for ${movie.title}`}
    >
      {/* Desktop/Tablet inline booklet mode */}
      {!isMobile ? (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 pt-10">
          <motion.div layoutId={`book-${movie.id}`} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <PageFlip
              pages={pages}
              pageWidth={280}
              pageHeight={420}
              spineShift={130}
              pageRadius={8}
              turnAngle={180}
              peekAngle={14}
              shadow={0.4}
              onBackgroundClick={onClose}
              forceClose={!isOpen}
            />
          </motion.div>
          <div className="flex items-center gap-1.5 mt-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm pointer-events-none">
            <span className="text-xs text-white/60 font-medium">
              📖 Click, drag, or use arrow keys to flip pages
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="w-full h-full p-0 border-0 bg-transparent cursor-pointer block text-left"
          onClick={() => setIsMobileBookletOpen(true)}
          aria-label={`Open 3D booklet for ${movie.title}`}
        >
          <motion.img
            layoutId={!isMobileBookletOpen ? `book-${movie.id}` : undefined}
            src={activePosterUrl}
            alt={`${movie.title} poster`}
            className="movie-details-modal__poster"
            loading="lazy"
            decoding="async"
            fetchPriority="high"
            onError={onPosterError}
          />
        </button>
      )}

      {/* Mobile dedicated 3D Flipbook overlay */}
      {isMobile && isMobileBookletOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#070b14]/95 backdrop-blur-xl p-4 select-none"
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
          <motion.div layoutId={isMobileBookletOpen ? `book-${movie.id}` : undefined} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <PageFlip
              pages={pages}
              pageWidth={170}
              pageHeight={255}
              spineShift={80}
              pageRadius={6}
              turnAngle={180}
              peekAngle={14}
              shadow={0.5}
              forceClose={!isOpen}
              onBackgroundClick={() => setIsMobileBookletOpen(false)}
            />
          </motion.div>
          <div className="flex items-center gap-1.5 mt-5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="text-xs text-white/90 font-medium">
              📖 Swipe, tap, or arrow keys to flip
            </span>
          </div>
        </div>
      )}
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
  onToggleUserWatched?: (user: User) => void | Promise<void>;
  activeUsers?: User[];
  onEdit?: () => void;
}

export const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  movie,
  metadataItems,
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onToggleUserWatched,
  activeUsers = [],
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
        style={{ flexWrap: "wrap" }}
      >
        {movie.mediaType === "youtube" && movie.youtubeUrl ? (
          <YoutubeButton url={movie.youtubeUrl} movieTitle={movie.title} variant="full" />
        ) : (
          <StremioButton movie={movie} variant="full" />
        )}
        
        {activeUsers.length > 1 && onToggleUserWatched ? (
          activeUsers.map((user) => {
            const isWatched = movie.watchedBy.includes(user);
            return (
              <CardActionButton
                key={user}
                variant={isWatched ? "primary" : "outline"}
                onClick={() => void onToggleUserWatched(user)}
                aria-pressed={isWatched}
                disabled={isUpdatingWatchStatus}
                leftIcon={isWatched ? <CheckIcon /> : <PlayIcon />}
                style={{ flex: 1, minWidth: "140px", whiteSpace: "nowrap" }}
              >
                {isWatched ? `${user} Watched` : `Mark ${user}`}
              </CardActionButton>
            );
          })
        ) : onToggleWatched ? (
          <CardActionButton
            variant={isWatchedByCurrentUser ? "primary" : "outline"}
            onClick={() => void onToggleWatched()}
            aria-pressed={isWatchedByCurrentUser}
            disabled={isUpdatingWatchStatus}
            leftIcon={isWatchedByCurrentUser ? <CheckIcon /> : <PlayIcon />}
          >
            {isWatchedByCurrentUser ? "Watched" : "Mark as Watched"}
          </CardActionButton>
        ) : null}

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
  toggleWatched: (id: string, targetUser?: User) => void | unknown;
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
