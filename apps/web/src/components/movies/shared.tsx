import DriftWall from "@/components/ui/DriftWall";
import { interleaveCollectionItems } from "@/components/ui/lib/posterMatrix";
/* eslint-disable react-refresh/only-export-components */
import type { GalleryPhoto } from "@/components/ui";
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
  hasMemories: boolean;
  watchedByCurrentUser: boolean;
  showActionRail: boolean;
  showWatchedAction: boolean;
  showNotesAction: boolean;
  memoryCountText: string;
  notesButtonLabel: string;
  notesButtonCompactLabel: string;
  notesButtonAriaLabel: string | null;
  notesBadgeText: string | null;
  primaryActionLabel: string;
  primaryActionCompactLabel: string;
  primaryActionAriaLabel: string | null;
}

interface GetMovieActionStateParams {
  movie: Movie;
  currentUser: User | null;
  memoriesCount: number;
}

export const getMovieActionState = ({
  movie,
  currentUser,
  memoriesCount,
}: GetMovieActionStateParams): MovieActionState => {
  const isGuest = !currentUser;
  const hasMemories = memoriesCount > 0;
  const watchedByCurrentUser = currentUser
    ? movie.watchedBy.includes(currentUser)
    : false;
  const showWatchedAction = Boolean(currentUser);
  const showNotesAction = hasMemories || Boolean(currentUser);
  const showActionRail = showWatchedAction || showNotesAction;
  const memoryCountText = `${memoriesCount} comment${memoriesCount === 1 ? "" : "s"}`;

  let notesButtonAriaLabel: string | null = null;
  if (showNotesAction) {
    notesButtonAriaLabel = hasMemories
      ? `View comments for "${movie.title}"`
      : `Add note to "${movie.title}"`;
  }

  let primaryActionAriaLabel: string | null = null;
  if (showWatchedAction) {
    primaryActionAriaLabel = watchedByCurrentUser
      ? `Mark "${movie.title}" as unwatched`
      : `Mark "${movie.title}" as watched`;
  }

  return {
    isGuest,
    hasMemories,
    watchedByCurrentUser,
    showActionRail,
    showWatchedAction,
    showNotesAction,
    memoryCountText,
    notesButtonLabel: hasMemories ? memoryCountText : "Add comment",
    notesButtonCompactLabel: hasMemories ? "Comments" : "Comment",
    notesButtonAriaLabel,
    notesBadgeText: hasMemories ? String(memoriesCount) : null,
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
const CINEMATIC_FALLBACKS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop",
];

export function buildGalleryPhotos(
  memories: SharedMemory[],
  movie: Movie,
): GalleryPhoto[] {
  const photos = memories
    .filter((memory) => Boolean(memory.imageUrl))
    .slice(0, 5)
    .map((memory) => ({ id: `memory-${memory.id}`, image: memory.imageUrl! }));
  const poster = movie.customPosterUrl || movie.posterUrl;
  if (poster && poster !== "N/A" && photos.length < 3) {
    photos.push({ id: `poster-${movie.id}`, image: poster });
  }
  for (
    let index = 0;
    photos.length < 5 && index < CINEMATIC_FALLBACKS.length;
    index += 1
  ) {
    photos.push({ id: `fb-${index}`, image: CINEMATIC_FALLBACKS[index] });
  }
  return photos.slice(0, 5);
}

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

export const getMovieWatchStatus = (movie: Movie, memoryCount: number) => {
  if (movie.watchedBy.length === USERS.length) {
    return {
      label: "Seen together",
      title: "Already a shared watch",
      detail:
        memoryCount > 0
          ? "You both finished this one, and its comments are part of the story."
          : "You both marked this watched already.",
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
    detail:
      memoryCount > 0
        ? `${movie.addedBy} queued it, and there is already a note attached to the poster.`
        : `${movie.addedBy} queued it for a future night.`,
  };
};

export const getMovieNotePreview = (note: string): string => {
  const trimmed = note.trim();
  return trimmed.length <= 96
    ? trimmed
    : `${trimmed.slice(0, 93).trimEnd()}...`;
};

export const getSecondaryMovieMemories = (
  memories: SharedMemory[],
  featuredId: string | undefined,
  canManage: boolean,
): SharedMemory[] =>
  canManage
    ? []
    : memories.filter((memory) => memory.id !== featuredId).slice(0, 2);

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
export const submitMemory = async (
  note: string,
  onAddMemory: (note: string) => Promise<void>,
  callbacks: {
    setIsSubmittingMemory: (isSubmitting: boolean) => void;
    setDraftNote: (note: string) => void;
    setSubmitSuccess: (success: boolean) => void;
    setSubmitError: (error: string | null) => void;
    clearSuccessTimeout: () => void;
    setSuccessTimeout: (callback: () => void, delay: number) => void;
  },
) => {
  const trimmedNote = note.trim();
  if (!trimmedNote) {
    return;
  }

  callbacks.setSubmitError(null);
  callbacks.setIsSubmittingMemory(true);
  try {
    await onAddMemory(trimmedNote);
    callbacks.setDraftNote("");
    callbacks.setSubmitSuccess(true);
    callbacks.clearSuccessTimeout();
    callbacks.setSuccessTimeout(() => {
      callbacks.setSubmitSuccess(false);
    }, 1200);
  } catch {
    callbacks.setSubmitError("Failed to save note. Please try again.");
  } finally {
    callbacks.setIsSubmittingMemory(false);
  }
};

/* eslint-disable react-refresh/only-export-components */
import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  Movie,
  SharedMemory,
  User,
  MovieSuggestion,
  MoviesViewProps,
} from "@/shared/types";
import {
  useAutocompleteFocusBoundary,
  useWorkspaceAutocompleteDismiss,
  useWorkspaceAutocompleteNavigation,
  useWorkspaceSearchInputHandle,
} from "@/components/ui/lib/workspaceListAutocomplete";
import {
  SyncBanner,
  StremioButton,
  YoutubeButton,
  ConfirmDialog,
  Modal,
  Input,
  Textarea,
  SuggestionCardBase,
  WorkspaceSearchShell,
  WorkspaceSearchActions,
  WorkspaceSearchField,
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompleteLoading,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompletePanel,
  WorkspaceAutocompletePoster,
  WorkspaceAutocompleteStatus,
  Button,
  MediaPoster,
  MediaCardPosterWrap,
  MediaCardTitle,
  MediaCardWatcherStack,
  DriftWallLoading,
  CollectionEmptyState,
  MoviesEmptyIllustration,
  useModalBase,
  CardTiltShell,
  CardTiltSheen,
  MagicToggle,
  CardActionButton,
  Card,
  type BentoStatTileConfig,
  type BentoSortChipConfig,
  type SortOrder,
} from "@/components/ui";
import {
  CheckIcon,
  FilmIcon,
  MessageIcon,
  PlusIcon,
  BookmarkIcon,
  EditIcon,
  PlayIcon,
  StarIcon,
  TvIcon,
} from "@/common/Icons";
import { useViewport, useUser, useBentoSlot } from "@/app/providerContexts";
import { useFeatureFonts, mediaBreakpoints, useMediaQuery } from "@/hooks";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import {
  formatMemoryTimestamp,
  getWorkspaceCollectionState,
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
  getErrorMessage,
  consoleError,
  resolvePosterUrl,
} from "@/utils";
import {
  searchMovieAutocomplete,
  getCachedMovieAutocomplete,
  type MovieAutocompleteResult,
  fetchOmdbMetadataCached,
} from "@/services/metadata";
import {
  MemoryComposer,
  MemoryList,
  INITIAL_VISIBLE_COUNT,
} from "@/components/memories/shared";
import { useMoviesWorkspace } from "@/hooks/movies";

export interface MoviesTopControlsProps {
  currentUser: User | null;
  upNextCount?: number;
  watchedCount?: number;
  noteCount?: number;
  latestNoteMovieTitle?: string | null;
  latestNoteAuthor?: string | null;
  canRecommend?: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedAutocompleteResult: MovieAutocompleteResult | null;
  setSelectedAutocompleteResult: (
    value: MovieAutocompleteResult | null,
  ) => void;
  guestName: string;
  setGuestName: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onRecommend: () => void;
  onSubmitRecommendation: () => Promise<void> | void;
  onCancelRecommendation: () => void;
  recommendationReason: string;
  setRecommendationReason: (value: string) => void;
  showRecommendationComposer: boolean;
  isAdding: boolean;
  isSubmittingRecommendation: boolean;
  suggestionError: string | null;
}



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
  memoriesCount: number;
  watchStatusLabel: string;
  hasPosterError: boolean;
  onPosterError: () => void;
}

export const PosterHero: React.FC<PosterHeroProps> = ({
  movie,
  memoriesCount,
  watchStatusLabel,
  hasPosterError,
  onPosterError,
}) => {
  const resolvedPosterUrl = movie.customPosterUrl || movie.posterUrl;
  const isCustomOrValid = Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = isCustomOrValid
    ? (resolvedPosterUrl as string)
    : resolvePosterUrl(undefined, movie.id || movie.title);

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

      {/* Badges Overlay */}
      <div className="movie-details-modal__poster-badges" role="status">
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
        {memoriesCount > 0 && (
          <span className="movie-details-modal__poster-pill">
            <MessageIcon size={11} style={{ marginRight: "0.25rem" }} />
            {memoriesCount} {memoriesCount === 1 ? "note" : "notes"}
          </span>
        )}
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
  memoriesCount: number;
  metadataItems: string[];
  watchStatus: { title: string; detail: string; label: string };
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onEdit?: () => void;
  onShowNotes: () => void;
}

export const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  movie,
  memoriesCount,
  metadataItems,
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onEdit,
  onShowNotes,
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
          {metadataItems.map((item) => (
            <span
              key={item}
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
        <CardActionButton
          variant="outline"
          onClick={onShowNotes}
          leftIcon={<BookmarkIcon />}
        >
          {memoriesCount > 0 ? `Notes (${memoriesCount})` : "Add Note"}
        </CardActionButton>
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
  memoriesCount: number;
}

export const SummaryBand: React.FC<SummaryBandProps> = ({
  movie,
  addedBy,
  watchStatusLabel,
  memoriesCount,
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
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Shared Notes</span>
      <span className="movie-details-modal__summary-value">
        {memoriesCount > 0 ? `${memoriesCount} saved` : "No notes yet"}
      </span>
      <span className="movie-details-modal__summary-sub">
        {memoriesCount > 0 ? "Attached to poster" : "Add thoughts below"}
      </span>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Sub-component: NotesAndMemoriesSection                                      */
/* -------------------------------------------------------------------------- */

interface NotesAndMemoriesSectionProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  canManageMemories: boolean;
  visibleCount: number;
  isMobile: boolean;
  draftNote: string;
  isSubmittingMemory: boolean;
  canSubmitNote: boolean;
  remainingChars: number;
  submitError: string | null;
  submitSuccess: boolean;
  notesSectionRef: React.RefObject<HTMLDivElement | null>;
  noteInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNoteChange: (note: string) => void;
  onMemorySubmit: (event: React.FormEvent) => Promise<void>;
  onShowMore: () => void;
  onShowLess: () => void;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  onAddMemory?: (note: string) => Promise<void>;
}

export const NotesAndMemoriesSection: React.FC<
  NotesAndMemoriesSectionProps
> = ({
  movie,
  memories,
  currentUser,
  canManageMemories,
  visibleCount,
  isMobile,
  draftNote,
  isSubmittingMemory,
  canSubmitNote,
  remainingChars,
  submitError,
  submitSuccess,
  notesSectionRef,
  noteInputRef,
  onNoteChange,
  onMemorySubmit,
  onShowMore,
  onShowLess,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  onAddMemory,
}) => {
  const featuredMemory =
    memories.find((memory) => memory.isPinned) ?? memories[0] ?? null;
  const secondaryMemories = getSecondaryMovieMemories(
    memories,
    featuredMemory?.id,
    canManageMemories,
  );

  return (
    <section
      ref={notesSectionRef}
      className="movie-details-modal__section"
      aria-labelledby="poster-comments-heading"
    >
      <div className="movie-details-modal__section-head">
        <h3
          id="poster-comments-heading"
          className="movie-details-modal__section-label"
        >
          Shared Notes & Memories
        </h3>
        {memories.length > 0 && (
          <span className="movie-details-modal__section-caption">
            {memories.length} {memories.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {currentUser && onAddMemory && (
        <div className="movie-details-modal__composer-shell">
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={onMemorySubmit}
            isSubmitting={isSubmittingMemory}
            canSubmit={canSubmitNote}
            isMobile={isMobile}
            note={draftNote}
            onNoteChange={onNoteChange}
            isComposerOpen
            onComposerToggle={() => {}}
            remainingChars={remainingChars}
            error={submitError}
            successMessage={submitSuccess ? "Saved to poster!" : null}
            noteInputRef={noteInputRef}
          />
        </div>
      )}

      {canManageMemories ? (
        memories.length > 0 ? (
          <div className="movie-details-modal__memory-manager">
            <MemoryList
              memories={memories}
              visibleMemories={memories.slice(0, visibleCount)}
              sortedMemories={memories}
              contextMovieTitle={movie.title}
              currentUser={currentUser}
              isMobile={isMobile}
              onEditMemory={async (memory, note) => {
                await onUpdateMemory?.(memory.id, note);
              }}
              onDeleteMemory={async (memory) => {
                await onDeleteMemory?.(memory.id);
              }}
              onTogglePin={async (memory) => {
                await onTogglePin?.(memory.id);
              }}
              movieFilterOptions={[]}
              activeMovieFilter={movie.id}
              onActiveMovieFilterChange={() => {}}
              sortMode="newest"
              onSortModeChange={() => {}}
              onShowMore={onShowMore}
              onShowLess={onShowLess}
              visibleCount={visibleCount}
              isLoading={false}
              memoriesError={null}
              onJumpToMovie={() => {}}
            />
          </div>
        ) : (
          <div className="movie-details-modal__memory-empty">
            No notes on this title yet. Share what you thought or why you added
            it.
          </div>
        )
      ) : featuredMemory ? (
        <>
          <article className="movie-details-modal__memory-card">
            <header className="movie-details-modal__memory-card-header">
              <span className="movie-details-modal__memory-author">
                {featuredMemory.author}
              </span>
              <time
                className="movie-details-modal__memory-date"
                dateTime={featuredMemory.updatedAt || featuredMemory.createdAt}
              >
                {formatMemoryTimestamp(
                  featuredMemory.updatedAt || featuredMemory.createdAt,
                )}
              </time>
            </header>
            <p className="movie-details-modal__memory-note">
              {featuredMemory.note}
            </p>
          </article>

          {secondaryMemories.length > 0 && (
            <div className="movie-details-modal__memory-list">
              {secondaryMemories.map((memory) => (
                <div
                  key={memory.id}
                  className="movie-details-modal__memory-row"
                >
                  <div className="movie-details-modal__memory-row-copy">
                    <span className="movie-details-modal__memory-row-author">
                      {memory.author}
                    </span>
                    <p className="movie-details-modal__memory-row-note">
                      {getMovieNotePreview(memory.note)}
                    </p>
                  </div>
                  <time
                    className="movie-details-modal__memory-row-date"
                    dateTime={memory.updatedAt || memory.createdAt}
                  >
                    {formatMemoryTimestamp(
                      memory.updatedAt || memory.createdAt,
                    )}
                  </time>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="movie-details-modal__memory-empty">
          No notes on this title yet. Share what you thought or why you added
          it.
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */

export interface MovieTransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

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
  addMemory: (
    movieId: string | undefined,
    movieTitle: string,
    author: string,
    note: string,
  ) => Promise<unknown>;
  updateMemory: (
    memoryId: string,
    updates: { note?: string; movieId?: string; movieTitle?: string },
  ) => Promise<unknown>;
  deleteMemory: (memoryId: string) => Promise<void>;
  togglePin: (memoryId: string) => Promise<unknown>;
}

export interface MovieSectionIds {
  incoming?: string;
  queue?: string;
  completed?: string;
}
