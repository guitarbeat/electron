import { getListEnterSelectionIndex, getNextListIndex } from '../../ui/lib/workspaceListAutocomplete.ts';
import { buildCollectionSections, compareCreatedAtDesc, compareStringsAlpha, type CollectionSections } from '../../../utils/workspace.ts';
import { type Movie, type User, type SharedMemory, type MovieSuggestion } from '@/shared/types';
import { type MovieAutocompleteResult } from '../../../services/metadata/index.ts';
import { type GalleryPhoto } from '@/components/ui/interactive-folder-gallery';
import { type MovieTransitionOrigin } from '../MovieCard';


















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
  const memoryCountText = `${memoriesCount} note${memoriesCount === 1 ? "" : "s"}`;

  let notesButtonAriaLabel: string | null = null;
  if (showNotesAction) {
    notesButtonAriaLabel = hasMemories
      ? `View notes for "${movie.title}"`
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
    notesButtonLabel: hasMemories ? memoryCountText : "Add note",
    notesButtonCompactLabel: hasMemories ? "Notes" : "Note",
    notesButtonAriaLabel,
    notesBadgeText: hasMemories ? String(memoriesCount) : null,
    primaryActionLabel: watchedByCurrentUser ? "Watched" : "Mark watched",
    primaryActionCompactLabel: watchedByCurrentUser ? "Watched" : "Watch",
    primaryActionAriaLabel,
  };
};




export const MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
export const MOVIE_AUTOCOMPLETE_DEBOUNCE_MS = 160;

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

export const getMovieAutocompleteEnterSelectionIndex = getListEnterSelectionIndex;

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

export function buildGalleryPhotos(memories: SharedMemory[], movie: Movie): GalleryPhoto[] {
  const photos = memories
    .filter((memory) => Boolean(memory.imageUrl))
    .slice(0, 5)
    .map((memory) => ({ id: `memory-${memory.id}`, image: memory.imageUrl! }));
  if (movie.posterUrl && movie.posterUrl !== "N/A" && photos.length < 3) {
    photos.push({ id: `poster-${movie.id}`, image: movie.posterUrl });
  }
  for (let index = 0; photos.length < 5 && index < CINEMATIC_FALLBACKS.length; index += 1) {
    photos.push({ id: `fb-${index}`, image: CINEMATIC_FALLBACKS[index] });
  }
  return photos.slice(0, 5);
}

export const clampMovieTransitionOrigin = (origin: MovieTransitionOrigin | null) =>
  origin
    ? {
        top: `${origin.top}px`,
        left: `${origin.left}px`,
        width: `${origin.width}px`,
        height: `${origin.height}px`,
      }
    : { top: "50dvh", left: "50vw", width: "18rem", height: "27rem" };

export const getMovieDialogMetrics = (isMobile: boolean) => {
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
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
      detail: memoryCount > 0
        ? "You both finished this one, and the poster is already carrying your notes."
        : "You both marked this watched already.",
    };
  }
  if (movie.watchedBy.length === 1) {
    const watcher = movie.watchedBy[0];
    const remaining = USERS.find((user) => !movie.watchedBy.includes(user));
    return {
      label: `${watcher} watched`,
      title: `${watcher} is ahead on this one`,
      detail: remaining ? `${remaining} still has this waiting in the queue.` : "One watch logged so far.",
    };
  }
  return {
    label: "Still queued",
    title: "Still sitting in the lineup",
    detail: memoryCount > 0
      ? `${movie.addedBy} queued it, and there is already a note attached to the poster.`
      : `${movie.addedBy} queued it for a future night.`,
  };
};

export const getMovieNotePreview = (note: string): string => {
  const trimmed = note.trim();
  return trimmed.length <= 96 ? trimmed : `${trimmed.slice(0, 93).trimEnd()}...`;
};

export const getSecondaryMovieMemories = (
  memories: SharedMemory[],
  featuredId: string | undefined,
  canManage: boolean,
): SharedMemory[] =>
  canManage ? [] : memories.filter((memory) => memory.id !== featuredId).slice(0, 2);







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
export type PosterClickAction = "reveal-title" | "open-details";

/** First click shows the title; a second click on the same poster opens details. */
export const nextPosterClickAction = (
  isTitleVisible: boolean,
): PosterClickAction => (isTitleVisible ? "open-details" : "reveal-title");
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
