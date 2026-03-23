import { useCallback, useMemo, useRef, useState } from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from '@/services/memoryService';
import { usePolling } from '@/services/polling';
import { SortMode, ContentTab, Movie, MovieSuggestion, User } from '@/shared/types';
import { useMovies } from '@/hooks/useMovies';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useToast } from '@/app/providers';
import { areDeeplyEqual, sanitizeInput } from '@/utils';
import { trackMetric } from '@/services/analyticsService';
import { readScope, retryScopeSync } from '@/services/stateClient';

const POLLING_INTERVAL = 30000;
interface UseWatchlistProps {
  currentUser: User | null;
  isPaused: boolean;
}

interface WatchlistToast {
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

interface SubmitRecommendationInput {
  title: string;
  suggestedBy?: string;
  reason?: string;
  preserveSuggestedBy?: boolean;
}

const normalizeRecommendationAuthor = (
  currentUser: User | null,
  suggestedBy?: string,
  preserveSuggestedBy = false
): string => {
  if (preserveSuggestedBy) {
    return sanitizeInput(suggestedBy || '') || currentUser || 'Anonymous';
  }

  if (currentUser) {
    return currentUser;
  }

  return sanitizeInput(suggestedBy || '') || 'Anonymous';
};

export const useWatchlist = ({ currentUser, isPaused }: UseWatchlistProps) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const { showToast } = useToast();
  const readMemories = useCallback(() => readScope('memories'), []);

  // State (from useWatchlistState)
  const [isAdding, setIsAdding] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [isSubmittingRecommendation, setIsSubmittingRecommendation] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs
  const previousMoviesRef = useRef<Movie[] | null>(null);

  const setToast = useCallback(
    (toast: WatchlistToast | null) => {
      if (!toast) return;
      showToast({
        message: toast.message,
        type: toast.type,
        actionLabel: toast.actionLabel,
        onAction: toast.onAction,
        onUndo: toast.onUndo,
        duration: toast.onUndo ? 6000 : 3500,
      });
    },
    [showToast]
  );

  // Data (from useWatchlistData)
  const {
    movies,
    isLoading,
    isSubmitting,
    error: moviesError,
    isDegraded: isMoviesDegraded,
    isSyncBlocked: isMoviesSyncBlocked,
    syncWarning: moviesSyncWarning,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    retrySync: retryMoviesSync,
  } = useMovies(currentUser, isPaused);

  const {
    pendingSuggestions,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    isLoading: isSuggestionsLoading,
    isDegraded: isSuggestionsDegraded,
    isSyncBlocked: isSuggestionsSyncBlocked,
    syncWarning: suggestionsSyncWarning,
    retrySync: retrySuggestionsSync,
  } = useSuggestions(isPaused);

  const {
    data: memoriesSnapshot,
    isLoading: isMemoriesLoading,
    error: memoriesError,
    refresh: refreshMemories,
  } = usePolling(readMemories, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'memories',
    isPaused,
  });
  const memories = useMemo(() => {
    return [...(memoriesSnapshot?.data || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [memoriesSnapshot]);
  const addMemory = useCallback(
    async (movieId: string | undefined, movieTitle: string, author: string, note: string) => {
      const result = await addMemoryService(movieId, movieTitle, author, note);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );
  const updateMemory = useCallback(
    async (memoryId: string, updates: { note?: string; movieId?: string; movieTitle?: string }) => {
      const result = await updateMemoryService(memoryId, updates);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );
  const deleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await deleteMemoryService(memoryId);
      refreshMemories();
    },
    [refreshMemories]
  );
  const toggleMemoryPin = useCallback(
    async (memoryId: string) => {
      const result = await toggleMemoryPinService(memoryId);
      refreshMemories();
      return result;
    },
    [refreshMemories]
  );

  const [unwatchedMovies, watchedMovies] = useMemo(() => {
    if (!movies) {
      return [[], []] as [Movie[], Movie[]];
    }

    const unwatched: Movie[] = [];
    const watched: Movie[] = [];

    movies.forEach((movie) => {
      if (movie.watchedBy.length < 2) {
        unwatched.push(movie);
      } else {
        watched.push(movie);
      }
    });

    return [unwatched, watched];
  }, [movies]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  let memoryErrorMessage: string | null = null;
  if (memoriesError instanceof Error) {
    memoryErrorMessage = memoriesError.message;
  } else if (memoriesError) {
    memoryErrorMessage = String(memoriesError);
  }

  const sortedMovies = useMemo(() => {
    if (!movies) return [];
    const next = [...movies];
    switch (sortMode) {
      case 'title':
        next.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'year':
        next.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
        break;
      case 'recent':
      default:
        break;
    }
    return next;
  }, [movies, sortMode]);

  const filteredMovies = useMemo(() => {
    return sortedMovies.filter((movie) => {
      const inTab =
        contentTab === 'all' ||
        (contentTab === 'queue' && movie.watchedBy.length < 2) ||
        (contentTab === 'watched' && movie.watchedBy.length === 2);
      if (!inTab) return false;
      if (!normalizedSearch) return true;
      return `${movie.title} ${movie.year || ''} ${movie.category || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [sortedMovies, contentTab, normalizedSearch]);

  const filteredSuggestions = useMemo(() => {
    if (contentTab !== 'all' && contentTab !== 'suggestions') {
      return [];
    }
    return pendingSuggestions.filter((suggestion) => {
      if (!normalizedSearch) return true;
      return `${suggestion.title} ${suggestion.suggestedBy} ${suggestion.reason || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [pendingSuggestions, contentTab, normalizedSearch]);

  const tabCounts = useMemo(() => {
    const counts = sortedMovies.reduce(
      (acc, movie) => {
        if (movie.watchedBy.length < 2) {
          acc.queue += 1;
        } else if (movie.watchedBy.length === 2) {
          acc.watched += 1;
        }

        return acc;
      },
      { queue: 0, watched: 0 }
    );

    return {
      all: sortedMovies.length,
      queue: counts.queue,
      watched: counts.watched,
      suggestions: pendingSuggestions.length,
    };
  }, [sortedMovies, pendingSuggestions]);

  const submitRecommendation = useCallback(
    async ({
      title,
      suggestedBy,
      reason,
      preserveSuggestedBy = false,
    }: SubmitRecommendationInput): Promise<MovieSuggestion> => {
      setIsSubmittingRecommendation(true);

      try {
        const suggestion = await addSuggestion(
          title,
          normalizeRecommendationAuthor(currentUser, suggestedBy, preserveSuggestedBy),
          reason
        );
        trackMetric('suggestion_submitted');
        setContentTab('suggestions');
        return suggestion;
      } finally {
        setIsSubmittingRecommendation(false);
      }
    },
    [addSuggestion, currentUser]
  );

  const acceptSuggestionToWatchlist = useCallback(
    async (suggestionId: string): Promise<MovieSuggestion> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const suggestion = pendingSuggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      setProcessingSuggestionId(suggestionId);

      try {
        await addMovie(suggestion.title);
        await acceptSuggestion(suggestionId, currentUser);
        trackMetric('suggestion_accepted');
        return suggestion;
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [acceptSuggestion, addMovie, currentUser, pendingSuggestions]
  );

  const rejectPendingSuggestion = useCallback(
    async (suggestionId: string): Promise<void> => {
      if (!currentUser) {
        throw new Error('Profile required');
      }

      const suggestion = pendingSuggestions.find((entry) => entry.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      setProcessingSuggestionId(suggestionId);

      try {
        await rejectSuggestion(suggestionId, currentUser);
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, pendingSuggestions, rejectSuggestion]
  );

  const retryWatchlistSync = useCallback(async () => {
    await Promise.all([
      retryMoviesSync(),
      retrySuggestionsSync(),
      retryScopeSync('memories'),
    ]);
    refreshMemories();
  }, [refreshMemories, retryMoviesSync, retrySuggestionsSync]);

  const isWatchlistDegraded =
    isMoviesDegraded || isSuggestionsDegraded || (memoriesSnapshot?.degraded ?? false);
  const isWatchlistSyncBlocked =
    isMoviesSyncBlocked ||
    isSuggestionsSyncBlocked ||
    (memoriesSnapshot?.blocked ?? false);
  const watchlistSyncWarning =
    moviesSyncWarning ?? suggestionsSyncWarning ?? memoriesSnapshot?.warning;

  return {
    // State returns
    isMobile,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    isSubmittingRecommendation,
    contentTab,
    setContentTab,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    showConfetti,
    setShowConfetti,
    previousMoviesRef,

    // Data returns
    movies,
    isLoading,
    isSubmitting,
    moviesError,
    isWatchlistDegraded,
    isWatchlistSyncBlocked,
    watchlistSyncWarning,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    retryWatchlistSync,
    pendingSuggestions,
    submitRecommendation,
    acceptSuggestionToWatchlist,
    rejectPendingSuggestion,
    isSuggestionsLoading,
    memories,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    isMemoriesLoading,
    memoriesError: memoryErrorMessage,
    unwatchedMovies,
    watchedMovies,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
  };
};
