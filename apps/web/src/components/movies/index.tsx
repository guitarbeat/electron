/* eslint-disable react-refresh/only-export-components */
import type { GalleryPhoto } from "@/components/ui";
import { buildCollectionSections, compareCreatedAtDesc, compareStringsAlpha, type CollectionSections } from "@/utils/shared";
import { getListEnterSelectionIndex, getNextListIndex } from "@/components/ui/lib/workspaceListAutocomplete";



















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
  const poster = movie.customPosterUrl || movie.posterUrl;
  if (poster && poster !== "N/A" && photos.length < 3) {
    photos.push({ id: `poster-${movie.id}`, image: poster });
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
import type { Movie, SharedMemory, User, MovieSuggestion, MoviesViewProps } from "@/shared/types";
import {
  useAutocompleteFocusBoundary,
  useWorkspaceAutocompleteDismiss,
  useWorkspaceAutocompleteNavigation,
  useWorkspaceSearchInputHandle,
} from "@/components/ui/lib/workspaceListAutocomplete";
import {
  SyncBanner,
  StremioButton,
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
  MovieSectionBody,
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
import { CheckIcon, FilmIcon, MessageIcon, PlusIcon, BookmarkIcon, EditIcon, PlayIcon, StarIcon, TvIcon } from "@/common/Icons";
import { useViewport, useUser, useBentoSlot } from "@/app/providerContexts";
import { useFeatureFonts, mediaBreakpoints, useMediaQuery } from "@/hooks";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { formatMemoryTimestamp, MAX_MOVIE_TITLE_LENGTH, sanitizeInput, getErrorMessage, consoleError } from "@/utils";
import { searchMovieAutocomplete, getCachedMovieAutocomplete, type MovieAutocompleteResult, fetchOmdbMetadataCached } from "@/services/metadata";
import { MemoryComposer, MemoryList, INITIAL_VISIBLE_COUNT } from "@/components/memories/shared";
import { useMoviesWorkspace } from "@/hooks/movies";






interface MoviesTopControlsProps {
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
  setSelectedAutocompleteResult: (value: MovieAutocompleteResult | null) => void;
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

export interface MoviesTopControlsHandle {
  focusSearchInput: () => void;
}

export const MoviesTopControls = React.forwardRef<
  MoviesTopControlsHandle,
  MoviesTopControlsProps
>(({
  currentUser,
  searchQuery,
  setSearchQuery,
  selectedAutocompleteResult,
  setSelectedAutocompleteResult,
  guestName,
  setGuestName,
  onSubmit,
  onRecommend,
  onSubmitRecommendation,
  onCancelRecommendation,
  recommendationReason,
  setRecommendationReason,
  showRecommendationComposer,
  isAdding,
  isSubmittingRecommendation,
  suggestionError,
}, forwardedRef) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;
  const autocompleteRegionRef = useRef<HTMLDivElement | null>(null);
  const internalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  const dropdownInteractionPendingRef = useRef(false);
  const autocompleteListId = useId();

  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState<MovieAutocompleteResult[]>([]);
  const {
    activeIndex: activeAutocompleteIndex,
    setActiveIndex: setActiveAutocompleteIndex,
    resetActiveIndex,
    moveActiveIndex,
    getEnterSelectionIndex,
  } = useWorkspaceAutocompleteNavigation();
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [isAutocompleteMounted, setIsAutocompleteMounted] = useState(false);
  const autocompleteCloseTimerRef = useRef<number | null>(null);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);
  const [isAutocompleteRegionFocused, setIsAutocompleteRegionFocused] = useState(false);
  const [autocompleteTypeFilter, setAutocompleteTypeFilter] = useState<'all' | 'movie' | 'series'>('all');

  const trimmedSearchQuery = searchQuery.trim();
  const normalizedSearchQuery = normalizeMovieAutocompleteQuery(searchQuery);
  const isGuest = !currentUser;
  const { isMobile } = useViewport();
  const primaryActionLabel = isGuest ? 'Suggest' : 'Add';
  const primaryActionTitle = isGuest ? 'Send title to suggestions' : 'Add title to movies';
  const noteActionLabel = isGuest
    ? isMobile
      ? "Note"
      : "Add a note"
    : "Recommend";

  const hideAutocomplete = useCallback(() => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteOpen(false);
    resetActiveIndex();
    setIsAutocompleteLoading(false);
    setAutocompleteTypeFilter('all');
    setIsAutocompleteMounted(false);
  }, [resetActiveIndex]);

  const { onFocusCapture, onBlurCapture, clearFocusBoundaryCheck } =
    useAutocompleteFocusBoundary(autocompleteRegionRef, hideAutocomplete, {
      shouldSkipClose: () => dropdownInteractionPendingRef.current,
      onFocusStateChange: setIsAutocompleteRegionFocused,
    });

  const focusSearchInput = useWorkspaceSearchInputHandle(internalSearchInputRef);

  useImperativeHandle(
    forwardedRef,
    () => ({
      focusSearchInput,
    }),
    [focusSearchInput],
  );

  const openAutocomplete = useCallback(() => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteMounted(true);
    setIsAutocompleteOpen(true);
    resetActiveIndex();
  }, [resetActiveIndex]);

  const resetAutocomplete = useCallback(() => {
    autocompleteRequestIdRef.current += 1;
    setAutocompleteQuery('');
    setAutocompleteResults([]);
    resetActiveIndex();
    setIsAutocompleteOpen(false);
    setIsAutocompleteMounted(false);
    setAutocompleteTypeFilter('all');
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteLoading(false);
    setAutocompleteError(null);
  }, [resetActiveIndex]);

  const selectAutocompleteResult = useCallback(
    (result: MovieAutocompleteResult) => {
      setSelectedAutocompleteResult(result);
      setSearchQuery(result.title);
      hideAutocomplete();
    },
    [hideAutocomplete, setSearchQuery, setSelectedAutocompleteResult]
  );

  useWorkspaceAutocompleteDismiss(autocompleteRegionRef, () => {
    setIsAutocompleteRegionFocused(false);
    hideAutocomplete();
  });

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }

    const keepSearchVisible = () => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) {
        return;
      }
      if (!autocompleteRegionRef.current?.contains(active)) {
        return;
      }

      const panel = autocompleteRegionRef.current.closest(
        ".workspace-search__search-form",
      );
      if (!panel) {
        return;
      }

      const panelRect = panel.getBoundingClientRect();
      const viewportBottom = viewport.offsetTop + viewport.height;
      if (panelRect.bottom > viewportBottom - 8) {
        panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    viewport.addEventListener("resize", keepSearchVisible);
    viewport.addEventListener("scroll", keepSearchVisible);
    return () => {
      viewport.removeEventListener("resize", keepSearchVisible);
      viewport.removeEventListener("scroll", keepSearchVisible);
    };
  }, [isMobile]);

  useEffect(() => () => {
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!isAutocompleteRegionFocused) {
      hideAutocomplete();
      return;
    }
    if (normalizedSearchQuery.length < MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      resetAutocomplete();
      return;
    }
    if (!shouldFetchMovieAutocomplete(trimmedSearchQuery, selectedAutocompleteResult)) return;

    const abortController = new AbortController();
    const requestId = autocompleteRequestIdRef.current + 1;
    autocompleteRequestIdRef.current = requestId;
    setAutocompleteQuery(normalizedSearchQuery);
    resetActiveIndex();
    if (autocompleteCloseTimerRef.current !== null) {
      window.clearTimeout(autocompleteCloseTimerRef.current);
      autocompleteCloseTimerRef.current = null;
    }
    setIsAutocompleteMounted(true);
    setIsAutocompleteOpen(true);

    const cachedResults = getCachedMovieAutocomplete(trimmedSearchQuery);
    if (cachedResults) {
      setAutocompleteResults(cachedResults);
      setIsAutocompleteLoading(false);
      setAutocompleteError(null);
    } else {
      setIsAutocompleteLoading(true);
      setAutocompleteError(null);
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await searchMovieAutocomplete(trimmedSearchQuery, {
          signal: abortController.signal,
        });
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) return;
        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults(nextResults);
        resetActiveIndex();
      } catch (error) {
        if (autocompleteRequestIdRef.current !== requestId || abortController.signal.aborted) return;
        setAutocompleteQuery(normalizedSearchQuery);
        setAutocompleteResults([]);
        resetActiveIndex();
        setAutocompleteError(
          error instanceof Error && error.message
            ? error.message
            : 'Movie suggestions are unavailable right now.'
        );
      } finally {
        if (autocompleteRequestIdRef.current === requestId && !abortController.signal.aborted) {
          setIsAutocompleteLoading(false);
        }
      }
    }, MOVIE_AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    hideAutocomplete,
    isAutocompleteRegionFocused,
    normalizedSearchQuery,
    resetAutocomplete,
    resetActiveIndex,
    selectedAutocompleteResult,
    trimmedSearchQuery,
  ]);

  const hasAutocompleteFeedback = useMemo(
    () =>
      isAutocompleteLoading ||
      hasStoredMovieAutocompleteFeedback(
        trimmedSearchQuery,
        autocompleteQuery,
        autocompleteResults.length,
        autocompleteError,
      ),
    [autocompleteError, autocompleteQuery, autocompleteResults.length, isAutocompleteLoading, trimmedSearchQuery]
  );
  const isAutocompleteElevated = isAutocompleteMounted && hasAutocompleteFeedback;

  const categoryCounts = useMemo(() => {
    let movieCount = 0;
    let seriesCount = 0;
    for (let i = 0; i < autocompleteResults.length; i++) {
      const type = autocompleteResults[i].type;
      if (type === 'movie') movieCount++;
      else if (type === 'series') seriesCount++;
    }
    return { all: autocompleteResults.length, movie: movieCount, series: seriesCount };
  }, [autocompleteResults]);

  const filteredAutocompleteResults = useMemo(
    () =>
      autocompleteTypeFilter === 'all'
        ? autocompleteResults
        : autocompleteResults.filter((result) => result.type === autocompleteTypeFilter),
    [autocompleteResults, autocompleteTypeFilter]
  );

  useEffect(() => {
    setActiveAutocompleteIndex((currentIndex) => {
      if (filteredAutocompleteResults.length === 0) return -1;
      return currentIndex >= 0 && currentIndex < filteredAutocompleteResults.length ? currentIndex : -1;
    });
  }, [filteredAutocompleteResults.length, setActiveAutocompleteIndex]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isBusy) return;
      clearFocusBoundaryCheck();
      hideAutocomplete();
      internalSearchInputRef.current?.blur();
      void onSubmit();
    },
    [clearFocusBoundaryCheck, hideAutocomplete, isBusy, onSubmit],
  );

  return (
    <>
      <WorkspaceSearchShell
        isAutocompleteActive={isAutocompleteElevated}
        onSubmit={handleFormSubmit}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
        shellRef={autocompleteRegionRef}
        onShellFocusCapture={() => {
          onFocusCapture();
        }}
        onShellBlurCapture={onBlurCapture}
        error={suggestionError && !showRecommendationComposer ? suggestionError : null}
        input={
          <WorkspaceSearchField
            inputRef={internalSearchInputRef}
            value={searchQuery}
            onChange={(nextValue: string) => {
              setSearchQuery(nextValue);
              if (shouldClearSelectedMovieResult(nextValue, selectedAutocompleteResult)) {
                setSelectedAutocompleteResult(null);
              }
            }}
            onFocus={() => {
              setIsAutocompleteRegionFocused(true);
              if (hasAutocompleteFeedback) openAutocomplete();
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.nativeEvent.isComposing) return;

              if (event.key === 'ArrowDown') {
                if (filteredAutocompleteResults.length === 0) return;
                event.preventDefault();
                setIsAutocompleteOpen(true);
                moveActiveIndex('next', filteredAutocompleteResults.length);
                return;
              }
              if (event.key === 'ArrowUp') {
                if (filteredAutocompleteResults.length === 0) return;
                event.preventDefault();
                setIsAutocompleteOpen(true);
                moveActiveIndex('previous', filteredAutocompleteResults.length);
                return;
              }
              if (event.key === 'Escape') {
                if (isAutocompleteOpen) { event.preventDefault(); hideAutocomplete(); }
                return;
              }
              if (event.key === 'Enter' && isAutocompleteOpen) {
                const selectedIndex = getEnterSelectionIndex(filteredAutocompleteResults.length);
                if (selectedIndex < 0 || !filteredAutocompleteResults[selectedIndex]) return;
                event.preventDefault();
                selectAutocompleteResult(filteredAutocompleteResults[selectedIndex]);
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                clearFocusBoundaryCheck();
                hideAutocomplete();
                internalSearchInputRef.current?.blur();
                void onSubmit();
              }
            }}
            placeholder="What's on tonight? Search a movie or show to add."
            ariaLabel="Search movies and shows to add"
            combobox={{
              expanded: isAutocompleteOpen,
              controlsId: autocompleteListId,
              activeDescendantId:
                isAutocompleteOpen && activeAutocompleteIndex >= 0
                  ? `${autocompleteListId}-option-${activeAutocompleteIndex}`
                  : undefined,
            }}
            onClear={() => {
              setSearchQuery("");
              setSelectedAutocompleteResult(null);
              resetAutocomplete();
              internalSearchInputRef.current?.focus();
            }}
          />
        }
        autocomplete={
          isAutocompleteMounted && hasAutocompleteFeedback ? (
            <WorkspaceAutocompletePanel
              id={autocompleteListId}
              isOpen={isAutocompleteOpen}
              ariaLabel="Movie and show suggestions"
              onPointerDown={() => {
                dropdownInteractionPendingRef.current = true;
                window.setTimeout(() => {
                  dropdownInteractionPendingRef.current = false;
                }, 300);
              }}
            >
              {isAutocompleteLoading ? <WorkspaceAutocompleteLoading /> : null}
              {!isAutocompleteLoading && autocompleteResults.length > 0 && (
                <div className="workspace-search__autocomplete-filters">
                  <MagicToggle
                    options={(
                      [
                        { value: 'all', label: 'All' },
                        { value: 'movie', label: 'Movies' },
                        { value: 'series', label: 'TV Series' },
                      ] as const
                    ).map(({ value, label }) => {
                      const count = categoryCounts[value];
                      const isDisabled = count === 0 && value !== 'all';
                      return {
                        value,
                        label: (
                          <span className="workspace-search__autocomplete-filter-label">
                            {label}
                            <span className="workspace-search__autocomplete-filter-count">
                              {count}
                            </span>
                          </span>
                        ),
                        disabled: isDisabled,
                      };
                    })}
                    activeValue={autocompleteTypeFilter}
                    onChange={(v) => setAutocompleteTypeFilter(v as 'all' | 'movie' | 'series')}
                    ariaLabel="Filter by type"
                  />
                </div>
              )}
              {autocompleteError ? (
                <WorkspaceAutocompleteStatus role="alert">
                  {autocompleteError}
                </WorkspaceAutocompleteStatus>
              ) : autocompleteResults.length > 0 ? (() => {
                if (filteredAutocompleteResults.length === 0) {
                  return (
                    <WorkspaceAutocompleteStatus>
                      No {autocompleteTypeFilter === 'series' ? 'TV series' : 'movies'} found
                    </WorkspaceAutocompleteStatus>
                  );
                }
                return filteredAutocompleteResults.map((result, index) => (
                  <WorkspaceAutocompleteOption
                    key={result.imdbID ?? `${result.title}-${index}`}
                    id={`${autocompleteListId}-option-${index}`}
                    isActive={index === activeAutocompleteIndex}
                    onSelect={() => selectAutocompleteResult(result)}
                    onHover={() => setActiveAutocompleteIndex(index)}
                  >
                    <WorkspaceAutocompletePoster
                      src={result.poster}
                      fallbackLetter={result.title.charAt(0).toUpperCase()}
                    />
                    <WorkspaceAutocompleteCopy
                      title={result.title}
                      meta={`${result.type === "series" ? "TV series" : "Movie"}${result.year ? ` • ${result.year}` : ""}`}
                    />
                  </WorkspaceAutocompleteOption>
                ));
              })() : !isAutocompleteLoading ? (
                <WorkspaceAutocompleteStatus>
                  No titles found for &quot;{trimmedSearchQuery}&quot;
                </WorkspaceAutocompleteStatus>
              ) : null}
            </WorkspaceAutocompletePanel>
          ) : null
        }
        actions={
          hasSearchQuery ? (
            <WorkspaceSearchActions>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAdding}
                loadingText={isGuest ? 'Suggesting' : 'Adding'}
                disabled={isBusy}
                title={primaryActionTitle}
                aria-label={primaryActionTitle}
                className="workspace-search__search-button"
              >
                {primaryActionLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => {
                  hideAutocomplete();
                  onRecommend();
                }}
                disabled={isBusy}
                title={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                aria-label={isGuest ? 'Add a note for this suggestion' : 'Recommend movie'}
                leftIcon={<PlusIcon />}
              >
                {noteActionLabel}
              </Button>
            </WorkspaceSearchActions>
          ) : null
        }
      />

      {showRecommendationComposer && hasSearchQuery && (
        <MovieRecommendationComposer
          currentUser={currentUser}
          movieTitle={searchQuery.trim()}
          guestName={guestName}
          reason={recommendationReason}
          error={suggestionError}
          isSubmitting={isSubmittingRecommendation}
          onGuestNameChange={setGuestName}
          onReasonChange={setRecommendationReason}
          onSubmit={onSubmitRecommendation}
          onCancel={onCancelRecommendation}
        />
      )}

    </>
  );
});

MoviesTopControls.displayName = 'MoviesTopControls';




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

type MoviesWorkspaceViewProps = MoviesViewProps & {
  posterPlaceCards?: React.ReactNode[];
  isInteractionStatic?: boolean;
};

export const MoviesView: React.FC<MoviesWorkspaceViewProps> = ({
  isPaused = false,
  hideSearch: _hideSearch = false,
  posterPlaceCards = [],
  isInteractionStatic = false,
}) => {
  const { currentUser } = useUser();
  const { registerTabConfig } = useBentoSlot();
  const { isMobile } = useViewport();
  const setConfig = React.useCallback(
    (config: Parameters<typeof registerTabConfig>[1]) =>
      registerTabConfig("movies", config),
    [registerTabConfig],
  );
  const [sortOrder, setSortOrder] = useState<MovieSortOrder>("recent");
  const moviesTopControlsRef = useRef<MoviesTopControlsHandle | null>(null);
  const focusSearchInput = useCallback(() => {
    moviesTopControlsRef.current?.focusSearchInput();
  }, []);
  const {
    searchQuery,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    setSelectedAutocompleteResult,
    resetRecommendationComposer,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
    processingSuggestionId,
    previousMoviesRef,
    movies,
    isLoading,
    pendingSuggestions,
    isSuggestionsLoading,
    memories,
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    retryMoviesWorkspaceSync,
    toggleWatched,
    editMovie,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
  } = useMoviesWorkspace({ currentUser, isPaused, focusSearchInput });
  const movieMemories = useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();
    const movieLookupByTitle = new Map<string, string>(); // lowercase title -> movieId

    const safeMovies = Array.isArray(movies) ? movies : [];
    const safeMemories = Array.isArray(memories) ? memories : [];

    safeMovies.forEach((movie) => {
      if (movie && movie.title) {
        movieLookupByTitle.set(movie.title.trim().toLowerCase(), movie.id);
      }
    });
    safeMemories.forEach((memory) => {
      if (!memory) return;
      let targetMovieId: string | undefined;

      if (memory.movieId) {
        targetMovieId = memory.movieId;
      } else if (memory.movieTitle) {
        targetMovieId = movieLookupByTitle.get(
          memory.movieTitle.trim().toLowerCase(),
        );
      }

      if (targetMovieId) {
        let movieGroup = memoriesByMovieId.get(targetMovieId);
        if (!movieGroup) {
          movieGroup = [];
          memoriesByMovieId.set(targetMovieId, movieGroup);
        }
        movieGroup.push(memory);
      }
    });
    return memoriesByMovieId;
  }, [memories, movies]);
  const sections = useMemo(
    () => buildMovieSections(movies, pendingSuggestions, sortOrder),
    [movies, pendingSuggestions, sortOrder],
  );

  const movieStats = useMemo(
    (): BentoStatTileConfig[] => [
      {
        id: "incoming",
        label: "Incoming",
        count: sections.suggestions.length,
        icon: <MessageIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.incoming,
        tone: "incoming",
      },
      {
        id: "queue",
        label: "Up Next",
        count: sections.queue.length,
        icon: <FilmIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.queue,
        tone: "default",
      },
      {
        id: "watched",
        label: "Watched",
        count: sections.completed.length,
        icon: <CheckIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.completed,
        tone: "completed",
      },
    ],
    [
      sections.suggestions.length,
      sections.queue.length,
      sections.completed.length,
    ],
  );

  const handleMovieSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order as MovieSortOrder);
  }, []);

  useEffect(() => {
    setConfig({
      stats: [],
      sorts: MOVIE_SORTS,
      activeSortOrder: sortOrder,
      onSortChange: handleMovieSortChange,
      ariaLabel: "Movies workspace controls",
    });
  }, [setConfig, movieStats, sortOrder, handleMovieSortChange]);

  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    const previousMoviesMap = new Map<string, Movie>();
    for (const entry of previousMoviesRef.current) {
      previousMoviesMap.set(entry.id, entry);
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesMap.get(movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          setSuccessMovieId(movie.id);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: "success",
          });
        }
      }
    });
    previousMoviesRef.current = movies;
  }, [movies, previousMoviesRef, setSuccessMovieId, setToast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
      setSelectedAutocompleteResult(null);
    }
  }, [
    resetRecommendationComposer,
    searchQuery,
    setSelectedAutocompleteResult,
  ]);

  return (
    <section className="library-movies" aria-label="Movies and places">
      <h2 className="workspace-section-heading library-movies-heading">
        <span className="workspace-section-heading__content">
          <span className="workspace-section-heading__label">
            Movies & Places
          </span>
        </span>
      </h2>
      
      <div className="watchlist-container places-container">
        {isMoviesWorkspaceDegraded && (
          <SyncBanner
            isBlocked={isMoviesWorkspaceSyncBlocked}
            onRetry={() => void retryMoviesWorkspaceSync()}
            label={
              isMoviesWorkspaceSyncBlocked
                ? "A shared movies change conflicted with local edits. Refresh and retry."
                : moviesWorkspaceSyncWarning ||
                  "Movie changes are being kept locally until shared sync recovers."
            }
          />
        )}
        <MovieSectionBody
          sections={sections}
          isLoading={isLoading}
          isSuggestionsLoading={isSuggestionsLoading}
          currentUser={currentUser}
          isMobile={isMobile}
          processingSuggestionId={processingSuggestionId}
          successMovieId={successMovieId}
          movieMemories={movieMemories}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onDeleteRequest={setMovieToDelete}
          onToggleError={(message) => setToast({ message, type: "error" })}
          actions={{
            toggleWatched,
            editMovie,
            addMemory,
            updateMemory,
            deleteMemory: deleteMemoryRecord,
            togglePin: toggleMemoryPin,
          }}
          posterPlaceCards={posterPlaceCards}
          isInteractionStatic={isInteractionStatic}
        />
        {movieToDelete && (
          <ConfirmDialog
            isOpen={Boolean(movieToDelete)}
            title="Remove Movie"
            message={`Are you sure you want to remove "${movieToDelete.title}"?`}
            onConfirm={confirmDelete}
            onCancel={() => setMovieToDelete(null)}
            confirmText="Remove"
            variant="danger"
          />
        )}
      </div>
    </section>
  );
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
  

  const shouldShowPoster =
    Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = resolvedPosterUrl;

  return (
    <figure className="movie-details-modal__poster-shell" aria-label={`Poster for ${movie.title}`}>
      {shouldShowPoster ? (
        <>
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
        </>
      ) : (
        <div className="movie-details-modal__poster movie-details-modal__poster--fallback">
          <FilmIcon size={32} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
          <span>No Poster Available</span>
        </div>
      )}
      <div className="movie-details-modal__poster-gradient" aria-hidden="true" />

      {/* Badges Overlay */}
      <div className="movie-details-modal__poster-badges" role="status">
        <span className={`movie-details-modal__poster-pill ${movie.watchedBy.length > 0 ? "movie-details-modal__poster-pill--status" : ""}`}>
          {movie.watchedBy.length > 0 && <CheckIcon size={12} style={{ marginRight: "0.25rem" }} />}
          {watchStatusLabel}
        </span>
        {movie.imdbRating && movie.imdbRating !== "N/A" && (
          <span className="movie-details-modal__poster-pill movie-details-modal__poster-pill--rating">
            <StarIcon size={11} fill style={{ color: "#fbbf24", marginRight: "0.2rem" }} />
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
          {isSeries ? <TvIcon size={12} style={{ marginRight: "0.3rem" }} /> : <FilmIcon size={12} style={{ marginRight: "0.3rem" }} />}
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
        <div className="movie-details-modal__fact-row" role="list" aria-label="Movie specs">
          {metadataItems.map((item) => (
            <span key={item} className="movie-details-modal__fact-pill" role="listitem">
              {item}
            </span>
          ))}
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <span className="movie-details-modal__fact-pill movie-details-modal__fact-pill--imdb" role="listitem">
              <StarIcon size={12} fill style={{ color: "#fbbf24", marginRight: "0.25rem" }} />
              {movie.imdbRating} IMDb
            </span>
          )}
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="movie-details-modal__actions" role="toolbar" aria-label="Movie actions">
        <StremioButton movie={movie} variant="full" />
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
  <div className="movie-details-modal__summary-band" role="region" aria-label="Movie details summary">
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Queued By</span>
      <span className="movie-details-modal__summary-value">{addedBy}</span>
      <span className="movie-details-modal__summary-sub">{formatMemoryTimestamp(movie.createdAt)}</span>
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

export const NotesAndMemoriesSection: React.FC<NotesAndMemoriesSectionProps> = ({
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
    <section ref={notesSectionRef} className="movie-details-modal__section" aria-labelledby="poster-comments-heading">
      <div className="movie-details-modal__section-head">
        <h3 id="poster-comments-heading" className="movie-details-modal__section-label">
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
            No notes on this title yet. Share what you thought or why you added it.
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
                <div key={memory.id} className="movie-details-modal__memory-row">
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
          No notes on this title yet. Share what you thought or why you added it.
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */






interface MovieRecommendationComposerProps {
  currentUser: User | null;
  movieTitle: string;
  guestName: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onGuestNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
}

export const MovieRecommendationComposer: React.FC<
  MovieRecommendationComposerProps
> = ({
  currentUser,
  movieTitle,
  guestName,
  reason,
  error,
  isSubmitting,
  onGuestNameChange,
  onReasonChange,
  onSubmit,
  onCancel,
}) => {
  const remainingChars = MAX_RECOMMENDATION_REASON_LENGTH - reason.length;

  return (
    <Card
      variant="default"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.borderSubtle}`,
        background: `radial-gradient(circle at top right, ${colors.accentMuted} 0%, transparent 54%), linear-gradient(180deg, ${colors.surface2}, ${colors.surface1})`,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}
      >
        <p
          style={{
            margin: 0,
            ...typography.presets.eyebrow,
            color: colors.accentLight,
          }}
        >
          Recommendation
        </p>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(", "),
            fontSize: typography.fontSize.lg,
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {movieTitle}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {currentUser
            ? `Send this to Suggestions as ${currentUser}.`
            : "Guests can send titles to Suggestions too. Add your name if you want credit."}
        </p>
      </div>

      {!currentUser ? (
        <Input
          label="Your Name (Optional)"
          value={guestName}
          onChange={(event) =>
            onGuestNameChange(
              event.target.value.slice(0, MAX_GUEST_SUGGESTER_NAME_LENGTH),
            )
          }
          placeholder="Guest"
          maxLength={MAX_GUEST_SUGGESTER_NAME_LENGTH}
        />
      ) : null}

      <Textarea
        label="Why This One? (Optional)"
        value={reason}
        onChange={(event) =>
          onReasonChange(
            event.target.value.slice(0, MAX_RECOMMENDATION_REASON_LENGTH),
          )
        }
        placeholder="A quick reason, vibe, or inside joke."
        maxLength={MAX_RECOMMENDATION_REASON_LENGTH}
        rows={3}
        style={{ minHeight: "88px" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
          }}
        >
          {remainingChars} characters left
        </span>

        <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void onSubmit()}
            isLoading={isSubmitting}
          >
            Send recommendation
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: colors.error,
            fontSize: typography.fontSize.xs,
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}30`,
            borderRadius: radius.md,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
};




interface MovieEditModalProps {
  movie: Movie;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (updates: { title: string; customPosterUrl?: string }) => Promise<void>;
  onDelete?: () => void;
}

export const MovieEditModal: React.FC<MovieEditModalProps> = ({
  movie,
  isOpen,
  isMobile,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [draftTitle, setDraftTitle] = React.useState(movie.title);
  const [draftPosterUrl, setDraftPosterUrl] = React.useState(movie.customPosterUrl || "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftTitle(movie.title);
    setDraftPosterUrl(movie.customPosterUrl || "");
    setError(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, movie.title, movie.customPosterUrl]);

  const cleanTitle = sanitizeInput(draftTitle);
  const cleanPosterUrl = draftPosterUrl.trim();
  const isUnchanged = cleanTitle === movie.title && cleanPosterUrl === (movie.customPosterUrl || "");
  
  const canSubmit =
    !isSaving &&
    Boolean(cleanTitle) &&
    cleanTitle.length <= MAX_MOVIE_TITLE_LENGTH &&
    !isUnchanged;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({ 
        title: cleanTitle, 
        customPosterUrl: cleanPosterUrl || undefined 
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update movie",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Movie"
      ariaLabel={`Edit details for ${movie.title}`}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving changes"
      variant={isMobile ? "bottom-sheet" : "centered"}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textSecondary,
              ...typography.presets.bodySm,
            }}
          >
            Update the shared movie title or provide a custom poster image URL.
          </p>

          <Input
            ref={inputRef}
            label="Movie title"
            value={draftTitle}
            onChange={(event) => {
              setDraftTitle(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            maxLength={MAX_MOVIE_TITLE_LENGTH}
            placeholder="Enter movie title"
            error={error ?? undefined}
          />

          <Input
            label="Custom poster URL (optional)"
            value={draftPosterUrl}
            onChange={(event) => {
              setDraftPosterUrl(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="https://example.com/poster.jpg"
          />

          <div
            aria-live="polite"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.sm,
              color: colors.textTertiary,
              ...typography.presets.caption,
            }}
          >
            <span>
              {isUnchanged
                ? "Make a change to save."
                : "Changes are shared immediately."}
            </span>
            <span>
              {draftTitle.length}/{MAX_MOVIE_TITLE_LENGTH}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onDelete();
                onClose();
              }}
              disabled={isSaving}
              style={{ color: colors.error ?? "#c0392b" }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}

          <div style={{ display: "flex", gap: spacing.sm }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              disabled={!canSubmit}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};





export interface MovieTransitionOrigin {

  top: number;
  left: number;
  width: number;
  height: number;
}

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onToggleError?: (message: string) => void;
  onDelete: () => void;
  onEditMetadata?: (updates: { title: string; customPosterUrl?: string }) => Promise<void>;
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
  isCompact?: boolean;
  priorityPoster?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  currentUser,
  onToggle,
  onToggleError,
  onDelete,
  onEditMetadata,
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
  isCompact = false,
  priorityPoster = false,
}) => {
  const [isTitleEditorOpen, setIsTitleEditorOpen] = React.useState(false);
  const [isTitleVisible, setIsTitleVisible] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [detailsOrigin, setDetailsOrigin] =
    React.useState<MovieTransitionOrigin | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const posterRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = isCompact;
  const isGuest = !currentUser;
  const watchedByBoth = movie.watchedBy.length === 2;
  const handleOpenDetails = () => {
    const rect =
      posterRef.current?.getBoundingClientRect() ??
      cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDetailsOrigin({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
    setIsTitleVisible(true);
    setIsDetailsOpen(true);
  };

  const handlePosterClick = () => {
    handleOpenDetails();
  };

  React.useEffect(() => {
    if (!isTitleVisible || isDetailsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) {
        setIsTitleVisible(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isDetailsOpen, isTitleVisible]);

  const handleToggle = async () => {
    if (isGuest) {
      return;
    }

    setIsUpdating(true);
    try {
      await onToggle();
    } catch (error) {
      consoleError("Failed to toggle watched status", error);
      onToggleError?.(
        getErrorMessage(error, "Failed to update watched status."),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`movie-item-container ${watchedByBoth ? "movie-item-container--watched" : ""} ${isHighlighted ? "movie-item-container--highlighted" : ""} ${isTitleVisible ? "movie-item-container--title-visible" : ""} ${isDetailsOpen ? "movie-item-container--details-open" : ""}`}
        data-movie-id={movie.id}
      >
        <CardTiltShell disabled={isCompact}>
          <Card
            ref={cardRef}
            variant="default"
            className="movie-item-card chroma-card"
            data-added-by={movie.addedBy}
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            <CardTiltSheen />
            <MediaCardPosterWrap
              ref={posterRef}
              className="movie-item-poster-wrap"
            >
              <MediaPoster
                title={movie.title}
                posterUrl={movie.customPosterUrl || movie.posterUrl}
                year={movie.year}
                id={movie.id}
                priority={priorityPoster}
              />

              <MediaCardWatcherStack
                watchers={movie.watchedBy}
                className="movie-item-watchers"
              />

              <div className="movie-item-title-overlay" aria-hidden="true">
                <MediaCardTitle className="movie-item-title-overlay__title">
                  {movie.title}
                </MediaCardTitle>
                {movie.year && (
                  <div className="movie-item-title-overlay__meta">
                    <span className="movie-item-meta__year">{movie.year}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="movie-item-details-hit-area"
                onClick={handlePosterClick}
                aria-expanded={isDetailsOpen}
                aria-label={`View details for "${movie.title}"`}
              />
            </MediaCardPosterWrap>
          </Card>
        </CardTiltShell>
      </div>

      {onEditMetadata ? (
        <MovieEditModal
          movie={movie}
          isOpen={isTitleEditorOpen}
          isMobile={isMobile}
          onClose={() => setIsTitleEditorOpen(false)}
          onSubmit={onEditMetadata}
          onDelete={onDelete}
        />
      ) : null}

      <React.Suspense fallback={null}>
        <MovieDetailsModal
          movie={movie}
          memories={memories}
          isOpen={isDetailsOpen}
          origin={detailsOrigin}
          currentUser={currentUser}
          onToggleWatched={currentUser ? handleToggle : undefined}
          isWatchedByCurrentUser={Boolean(
            currentUser && movie.watchedBy.includes(currentUser),
          )}
          isUpdatingWatchStatus={isUpdating}
          onEdit={
            onEditMetadata
              ? () => {
                  setIsDetailsOpen(false);
                  setIsTitleEditorOpen(true);
                }
              : undefined
          }
          onAddMemory={onAddMemory}
          onUpdateMemory={onUpdateMemory}
          onDeleteMemory={onDeleteMemory}
          onTogglePin={onTogglePin}
          onClose={() => setIsDetailsOpen(false)}
        />
      </React.Suspense>
    </>
  );
};




interface SuggestionCardProps {

  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  className?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  className,
}) => {
  const [posterUrl, setPosterUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [year, setYear] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetchOmdbMetadataCached(
      suggestion.title,
      suggestion.type,
      suggestion.imdbID,
      controller.signal,
    )
      .then((meta) => {
        if (cancelled) return;
        setPosterUrl(meta.poster);
        setYear(meta.year);
      })
      .catch(() => {
        // Silent fail — fallback chain handles missing posters
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [suggestion.title, suggestion.type, suggestion.imdbID]);

  return (
    <SuggestionCardBase
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.title}
      subtitle={suggestion.reason}
      year={year}
      imdbRating={undefined} // We don't fetch imdbRating yet in SuggestionMovieCard, but we can if we extend the fetcher.
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      className={[`movie-item-card suggestion-item-card`, className]
        .filter(Boolean)
        .join(" ")}
      media={
        <MediaPoster
          title={suggestion.title}
          posterUrl={posterUrl}
          year={year}
          id={suggestion.id}
        />
      }
      details={
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          {/* We remove year from here since it's now in the overlay */}
          <StremioButton
            movie={{
              title: suggestion.title,
              imdbID: suggestion.imdbID,
              mediaType: suggestion.type,
            }}
            variant="pill"
          />
        </div>
      }
    />
  );
};

export interface MovieTransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface MovieDetailsModalProps {
  movie: Movie;
  memories?: SharedMemory[];
  isOpen: boolean;
  origin?: MovieTransitionOrigin | null;
  currentUser?: User | null;
  onToggleWatched?: () => void | Promise<void>;
  isWatchedByCurrentUser?: boolean;
  isUpdatingWatchStatus?: boolean;
  onEdit?: () => void;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  onClose: () => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  memories = [],
  isOpen,
  origin,
  currentUser = null,
  onToggleWatched,
  isWatchedByCurrentUser = false,
  isUpdatingWatchStatus = false,
  onEdit,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [hasPosterError, setHasPosterError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(() =>
    Math.min(INITIAL_VISIBLE_COUNT, memories.length),
  );
  const closeTimeoutRef = React.useRef<number | null>(null);
  const successTimeoutRef = React.useRef<number | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const notesSectionRef = React.useRef<HTMLDivElement>(null);
  const { dialogRef, closeButtonRef, playPop } = useModalBase(
    isVisible,
    onClose,
  );

  useFeatureFonts();

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    setHasPosterError(false);
  }, [movie.posterUrl, movie.customPosterUrl]);

  React.useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
  }, [memories.length, movie.id]);

  React.useEffect(() => {
    setDraftNote("");
    setSubmitSuccess(false);
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, [movie.id, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setIsVisible(true);
      setIsEntering(false);
      const frame = window.requestAnimationFrame(() => {
        setIsEntering(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!isVisible) return undefined;

    setIsEntering(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 260);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isVisible]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [closeButtonRef, dialogRef, isOpen]);

  React.useEffect(
    () => () => {
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current);
      }
    },
    [],
  );

  if (!isVisible) {
    return null;
  }

  const metadataItems = [
    isTvSeries(movie) ? "TV Series" : "Movie",
    movie.year,
    movie.runtime,
    movie.genre?.split(",")[0]?.trim(),
    movie.category && movie.category !== "TV Series" ? movie.category : null,
    movie.director ? `Dir. ${movie.director}` : null,
  ].filter(Boolean) as string[];

  const canManageMemories = Boolean(
    onUpdateMemory && onDeleteMemory && onTogglePin,
  );
  const watchStatus = getMovieWatchStatus(movie, memories.length);
  const source = clampMovieTransitionOrigin(origin ?? null);
  const { targetWidth, targetHeight } = getMovieDialogMetrics(isMobile);
  const remainingChars = MAX_MOVIE_NOTE_LENGTH - draftNote.length;
  const canSubmitNote =
    !isSubmittingMemory && draftNote.trim().length > 0 && remainingChars >= 0;

  const scaleX =
    origin && targetWidth > 0
      ? Math.min(Math.max(origin.width / targetWidth, 0.18), 1)
      : 0.32;
  const scaleY =
    origin && targetHeight > 0
      ? Math.min(Math.max(origin.height / targetHeight, 0.18), 1)
      : 0.32;

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) return;

    await submitMemory(draftNote, onAddMemory, {
      setIsSubmittingMemory,
      setDraftNote,
      setSubmitSuccess,
      setSubmitError,
      clearSuccessTimeout: () => {
        if (successTimeoutRef.current !== null) {
          window.clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = null;
        }
      },
      setSuccessTimeout: (callback, delay) => {
        successTimeoutRef.current = window.setTimeout(callback, delay);
      },
    });
  };

  const handleShowNotes = () => {
    notesSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.requestAnimationFrame(() => noteInputRef.current?.focus());
  };

  return createPortal(
    <div
      className={`movie-details-modal${isEntering ? " is-open" : ""}`}
      style={
        {
          "--movie-origin-top": source.top,
          "--movie-origin-left": source.left,
          "--movie-origin-width": source.width,
          "--movie-origin-height": source.height,
          "--movie-origin-scale-x": String(scaleX),
          "--movie-origin-scale-y": String(scaleY),
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
    >
      <button
        type="button"
        className="movie-details-modal__backdrop"
        onClick={onClose}
        aria-label={`Close details for ${movie.title}`}
      />

      <div
        ref={dialogRef}
        className={`movie-details-modal__dialog${isMobile ? " movie-details-modal__dialog--mobile" : ""}`}
      >
        <div className="movie-details-modal__surface">
          <button
            ref={closeButtonRef}
            type="button"
            className="movie-details-modal__close"
            onClick={() => {
              playPop();
              onClose();
            }}
            aria-label="Close movie details"
          >
            ×
          </button>

          {/* Poster Hero Side */}
          <PosterHero
            movie={movie}
            memoriesCount={memories.length}
            watchStatusLabel={watchStatus.label}
            hasPosterError={hasPosterError}
            onPosterError={() => setHasPosterError(true)}
          />

          {/* Main Details Body */}
          <div className="movie-details-modal__content">
            <MetadataHeader
              movie={movie}
              memoriesCount={memories.length}
              metadataItems={metadataItems}
              watchStatus={watchStatus}
              isWatchedByCurrentUser={isWatchedByCurrentUser}
              isUpdatingWatchStatus={isUpdatingWatchStatus}
              onToggleWatched={onToggleWatched}
              onEdit={onEdit}
              onShowNotes={handleShowNotes}
            />

            {/* Overview / Plot Section */}
            {movie.plot && (
              <section className="movie-details-modal__section" aria-labelledby="movie-overview-heading">
                <h3 id="movie-overview-heading" className="movie-details-modal__section-label">
                  Overview
                </h3>
                <p className="movie-details-modal__plot">{movie.plot}</p>
              </section>
            )}

            {/* Clean Details Summary Band */}
            <SummaryBand
              movie={movie}
              addedBy={movie.addedBy}
              watchStatusLabel={watchStatus.label}
              memoriesCount={memories.length}
            />

            {/* Notes & Memories Section */}
            <NotesAndMemoriesSection
              movie={movie}
              memories={memories}
              currentUser={currentUser}
              canManageMemories={canManageMemories}
              visibleCount={visibleCount}
              isMobile={isMobile}
              draftNote={draftNote}
              isSubmittingMemory={isSubmittingMemory}
              canSubmitNote={canSubmitNote}
              remainingChars={remainingChars}
              submitError={submitError}
              submitSuccess={submitSuccess}
              notesSectionRef={notesSectionRef}
              noteInputRef={noteInputRef}
              onNoteChange={(nextNote) =>
                setDraftNote(nextNote.slice(0, MAX_MOVIE_NOTE_LENGTH))
              }
              onMemorySubmit={handleMemorySubmit}
              onShowMore={() => {
                setVisibleCount((current) =>
                  Math.min(current + INITIAL_VISIBLE_COUNT, memories.length),
                );
              }}
              onShowLess={() => {
                setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
              }}
              onUpdateMemory={onUpdateMemory}
              onDeleteMemory={onDeleteMemory}
              onTogglePin={onTogglePin}
              onAddMemory={onAddMemory}
            />

            {/* Footer Status Metadata */}
            <footer className="movie-details-modal__footer">
              <span>Catalog item added {formatMemoryTimestamp(movie.createdAt)}</span>
              <span>
                {movie.watchedBy.length === 2
                  ? "Watched by Aaron & Electra"
                  : movie.watchedBy.length === 1
                  ? `Watched by ${movie.watchedBy[0]}`
                  : "Not watched yet"}
              </span>
            </footer>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
