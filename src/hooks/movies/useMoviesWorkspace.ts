import { useCallback, useMemo, useRef, useState } from "react";
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
  updateMemoriesBatch as updateMemoriesBatchService,
} from "../../services/content/memoryService";
import type { MovieAutocompleteResult } from "../../services/metadata/types";
import { usePolling } from "../../services/polling";
import { Movie, MovieSuggestion, User } from "../../shared/types";
import { useMovies } from "./useMovies";
import { useSuggestions } from "../suggestions";
import { useToast } from "@/app/useProviders";
import {
  areDeeplyEqual,
  compareCreatedAtDesc,
  normalizeMovieTitle,
  sanitizeInput,
} from "../../utils";
import { trackMetric } from "@/services/analytics";
import { readScope, retryScopeSync } from "../../services/state";

const POLLING_INTERVAL = 30000;

interface UseMoviesWorkspaceProps {
  currentUser: User | null;
  isPaused: boolean;
}

interface MoviesWorkspaceToast {
  message: string;
  type: "success" | "error" | "info";
  onUndo?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

interface SubmitRecommendationInput {
  title: string;
  reason?: string;
  suggestedBy?: string;
  selectedResult?: Pick<MovieAutocompleteResult, "imdbID" | "type"> | null;
}

export const getMovieSelectionFromSuggestion = (
  suggestion: Pick<MovieSuggestion, "imdbID" | "type">,
): Pick<MovieAutocompleteResult, "imdbID" | "type"> | undefined => {
  if (!suggestion.imdbID || !suggestion.type) {
    return undefined;
  }

  return {
    imdbID: suggestion.imdbID,
    type: suggestion.type,
  };
};

export const useMoviesWorkspace = ({
  currentUser,
  isPaused,
}: UseMoviesWorkspaceProps) => {
  const { showToast } = useToast();
  const readMemories = useCallback(() => readScope("memories"), []);

  // Local view state
  const [isAdding, setIsAdding] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<
    string | null
  >(null);
  const [isSubmittingRecommendation, setIsSubmittingRecommendation] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const previousMoviesRef = useRef<Movie[] | null>(null);

  const setToast = useCallback(
    (toast: MoviesWorkspaceToast | null) => {
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
    [showToast],
  );

  // Data sources
  const {
    movies,
    isLoading,
    isDegraded: isMoviesDegraded,
    isSyncBlocked: isMoviesSyncBlocked,
    syncWarning: moviesSyncWarning,
    addMovie,
    renameMovie: renameMovieService,
    toggleWatched,
    deleteMovie,
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

  const { data: memoriesSnapshot, refresh: refreshMemories } = usePolling(
    readMemories,
    POLLING_INTERVAL,
    areDeeplyEqual,
    {
      key: "memories",
      isPaused,
    },
  );
  const memories = useMemo(() => {
    return [...(memoriesSnapshot?.data || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return compareCreatedAtDesc(a, b);
    });
  }, [memoriesSnapshot]);

  const withMemoryRefresh = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const result = await operation();
      refreshMemories();
      return result;
    },
    [refreshMemories],
  );

  const addMemory = useCallback(
    async (
      movieId: string | undefined,
      movieTitle: string,
      author: string,
      note: string,
    ) =>
      withMemoryRefresh(() =>
        addMemoryService(movieId, movieTitle, author, note),
      ),
    [withMemoryRefresh],
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      updates: { note?: string; movieId?: string; movieTitle?: string },
    ) => withMemoryRefresh(() => updateMemoryService(memoryId, updates)),
    [withMemoryRefresh],
  );

  const deleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await withMemoryRefresh(() => deleteMemoryService(memoryId));
    },
    [withMemoryRefresh],
  );

  const toggleMemoryPin = useCallback(
    async (memoryId: string) =>
      withMemoryRefresh(() => toggleMemoryPinService(memoryId)),
    [withMemoryRefresh],
  );

  const withProcessingSuggestion = useCallback(
    async <T,>(suggestionId: string, operation: () => Promise<T>): Promise<T> => {
      setProcessingSuggestionId(suggestionId);
      try {
        return await operation();
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [],
  );

  const submitRecommendation = useCallback(
    async ({
      title,
      reason,
      suggestedBy,
      selectedResult,
    }: SubmitRecommendationInput): Promise<MovieSuggestion> => {
      setIsSubmittingRecommendation(true);

      try {
        const suggestion = await addSuggestion(
          title,
          reason,
          suggestedBy,
          selectedResult,
        );
        trackMetric("suggestion_submitted");
        return suggestion;
      } finally {
        setIsSubmittingRecommendation(false);
      }
    },
    [addSuggestion],
  );

  const acceptSuggestionToWatchlist = useCallback(
    async (suggestionId: string): Promise<MovieSuggestion> => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      const suggestion = pendingSuggestions.find(
        (entry) => entry.id === suggestionId,
      );
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      return withProcessingSuggestion(suggestionId, async () => {
        await addMovie(
          suggestion.title,
          getMovieSelectionFromSuggestion(suggestion),
        );
        await acceptSuggestion(suggestionId, currentUser);
        trackMetric("suggestion_accepted");
        return suggestion;
      });
    },
    [
      acceptSuggestion,
      addMovie,
      currentUser,
      pendingSuggestions,
      withProcessingSuggestion,
    ],
  );

  const renameMovie = useCallback(
    async (movieId: string, title: string): Promise<void> => {
      const movie = movies.find((entry) => entry.id === movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      await renameMovieService(movieId, title);

      const cleanTitle = sanitizeInput(title);
      const previousTitle = normalizeMovieTitle(movie.title);
      const relatedMemories = memories.filter(
        (memory) =>
          memory.movieId === movieId ||
          (!memory.movieId &&
            normalizeMovieTitle(memory.movieTitle) === previousTitle),
      );

      if (relatedMemories.length === 0 || !cleanTitle) {
        return;
      }

      try {
        const batchUpdates = relatedMemories
          .map((memory) => {
            const nextMovieId = memory.movieId ?? movieId;
            if (
              memory.movieTitle === cleanTitle &&
              memory.movieId === nextMovieId
            ) {
              return null;
            }
            return {
              memoryId: memory.id,
              updates: {
                movieId: nextMovieId,
                movieTitle: cleanTitle,
              },
            };
          })
          .filter(Boolean) as Array<{
          memoryId: string;
          updates: { movieId: string; movieTitle: string };
        }>;

        if (batchUpdates.length > 0) {
          await updateMemoriesBatchService(batchUpdates);
          refreshMemories();
        }
      } catch (error) {
        console.warn(
          "Failed to sync related memory titles after rename:",
          error,
        );
      }
    },
    [memories, movies, refreshMemories, renameMovieService],
  );

  const rejectPendingSuggestion = useCallback(
    async (suggestionId: string): Promise<void> => {
      if (!currentUser) {
        throw new Error("Profile required");
      }

      const suggestion = pendingSuggestions.find(
        (entry) => entry.id === suggestionId,
      );
      if (!suggestion) {
        throw new Error("Suggestion not found");
      }

      await withProcessingSuggestion(suggestionId, () =>
        rejectSuggestion(suggestionId, currentUser),
      );
    },
    [currentUser, pendingSuggestions, rejectSuggestion, withProcessingSuggestion],
  );

  const retryMoviesWorkspaceSync = useCallback(async () => {
    await Promise.all([
      retryMoviesSync(),
      retrySuggestionsSync(),
      retryScopeSync("memories"),
    ]);
    refreshMemories();
  }, [refreshMemories, retryMoviesSync, retrySuggestionsSync]);

  const isMoviesWorkspaceDegraded =
    isMoviesDegraded ||
    isSuggestionsDegraded ||
    (memoriesSnapshot?.degraded ?? false);
  const isMoviesWorkspaceSyncBlocked =
    isMoviesSyncBlocked ||
    isSuggestionsSyncBlocked ||
    (memoriesSnapshot?.blocked ?? false);
  const moviesWorkspaceSyncWarning =
    moviesSyncWarning ?? suggestionsSyncWarning ?? memoriesSnapshot?.warning;

  return {
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
    previousMoviesRef,
    movies,
    isLoading,
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    addMovie,
    renameMovie,
    toggleWatched,
    deleteMovie,
    retryMoviesWorkspaceSync,
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
  };
};
