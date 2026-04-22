import { useCallback, useMemo, useRef, useState } from 'react';
import { mediaBreakpoints, useMediaQuery } from '../useMediaQuery';
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from '../../services/content/memoryService';
import type { MovieAutocompleteResult } from '../../services/metadata/types';
import { usePolling } from '../../services/polling';
import { Movie, MovieSuggestion, User } from '../../shared/types';
import { useMovies } from './useMovies';
import { useSuggestions } from '../suggestions/useSuggestions';
import { useToast } from '@/app/useProviders';
import { areDeeplyEqual, normalizeMovieTitle, sanitizeInput } from '../../utils';
import { trackMetric } from '../../services/analyticsService';
import { readScope, retryScopeSync } from '../../services/state';

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
  reason?: string;
  suggestedBy?: string;
  selectedResult?: Pick<MovieAutocompleteResult, 'imdbID' | 'type'> | null;
}

export const getMovieSelectionFromSuggestion = (
  suggestion: Pick<MovieSuggestion, 'imdbID' | 'type'>
): Pick<MovieAutocompleteResult, 'imdbID' | 'type'> | undefined => {
  if (!suggestion.imdbID || !suggestion.type) {
    return undefined;
  }

  return {
    imdbID: suggestion.imdbID,
    type: suggestion.type,
  };
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
  const [searchQuery, setSearchQuery] = useState('');
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
    renameMovie: renameMovieService,
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

  let memoryErrorMessage: string | null = null;
  if (memoriesError instanceof Error) {
    memoryErrorMessage = memoriesError.message;
  } else if (memoriesError) {
    memoryErrorMessage = String(memoriesError);
  }

  const submitRecommendation = useCallback(
    async ({
      title,
      reason,
      suggestedBy,
      selectedResult,
    }: SubmitRecommendationInput): Promise<MovieSuggestion> => {
      setIsSubmittingRecommendation(true);

      try {
        const suggestion = await addSuggestion(title, reason, suggestedBy, selectedResult);
        trackMetric('suggestion_submitted');
        return suggestion;
      } finally {
        setIsSubmittingRecommendation(false);
      }
    },
    [addSuggestion]
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
        await addMovie(suggestion.title, getMovieSelectionFromSuggestion(suggestion));
        await acceptSuggestion(suggestionId, currentUser);
        trackMetric('suggestion_accepted');
        return suggestion;
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [acceptSuggestion, addMovie, currentUser, pendingSuggestions]
  );

  const renameMovie = useCallback(
    async (movieId: string, title: string): Promise<void> => {
      const movie = movies.find((entry) => entry.id === movieId);
      if (!movie) {
        throw new Error('Movie not found');
      }

      await renameMovieService(movieId, title);

      const cleanTitle = sanitizeInput(title);
      const previousTitle = normalizeMovieTitle(movie.title);
      const relatedMemories = memories.filter(
        (memory) =>
          memory.movieId === movieId ||
          (!memory.movieId && normalizeMovieTitle(memory.movieTitle) === previousTitle)
      );

      if (relatedMemories.length === 0 || !cleanTitle) {
        return;
      }

      try {
        await Promise.all(
          relatedMemories.map(async (memory) => {
            const nextMovieId = memory.movieId ?? movieId;
            if (memory.movieTitle === cleanTitle && memory.movieId === nextMovieId) {
              return;
            }

            await updateMemoryService(memory.id, {
              movieId: nextMovieId,
              movieTitle: cleanTitle,
            });
          })
        );
        refreshMemories();
      } catch (error) {
        console.warn('Failed to sync related memory titles after rename:', error);
      }
    },
    [memories, movies, refreshMemories, renameMovieService]
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
    searchQuery,
    setSearchQuery,
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
    renameMovie,
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
  };
};
