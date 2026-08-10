import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
  updateMemoriesBatch as updateMemoriesBatchService,
} from "../../services/content/memoryService.ts";
import type { MovieAutocompleteResult } from "../../services/metadata/types.ts";
import { Movie, MovieSuggestion, User } from "../../shared/types.ts";
import { useMovies } from "./useMovies.ts";
import { useSuggestions } from "../suggestions/index.ts";
import { useToast } from "../../app/useProviders.ts";
import {
  compareCreatedAtDesc,
  normalizeMovieTitle,
  sanitizeInput,
} from "../../utils/index.ts";
import { areScopeSnapshotsEqual } from "../../services/state/stateCompare.ts";
import { trackMetric } from "../../services/analytics.ts";
import { readScope, retryScopeSync } from "../../services/state/index.ts";
import { useWorkspaceSyncBanner } from "../useWorkspaceSyncBanner.ts";

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
  const queryClient = useQueryClient();
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

  const { data: memoriesSnapshot, refetch: refreshMemoriesQuery } = useQuery({
    queryKey: ["memories"],
    queryFn: readMemories,
    refetchInterval: isPaused ? false : POLLING_INTERVAL,
    refetchOnWindowFocus: !isPaused,
    structuralSharing: false,
  });
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
      // Invalidate so all subscribers (MovieDetailsModal, MemoryList) pick up fresh data.
      void queryClient.invalidateQueries({ queryKey: ["memories"] });
      return result;
    },
    [queryClient],
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
    async (
      suggestionId: string,
    ): Promise<{ suggestion: MovieSuggestion; isDuplicate: boolean }> => {
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
        return { suggestion, isDuplicate: false };
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
        const batchUpdates = relatedMemories.flatMap((memory) => {
          const nextMovieId = memory.movieId ?? movieId;
          if (
            memory.movieTitle === cleanTitle &&
            memory.movieId === nextMovieId
          ) {
            return [];
          }
          return [
            {
              memoryId: memory.id,
              updates: {
                movieId: nextMovieId,
                movieTitle: cleanTitle,
              },
            },
          ];
        });

        if (batchUpdates.length > 0) {
          await updateMemoriesBatchService(batchUpdates);
          refreshMemoriesQuery();
        }
      } catch (error) {
        console.warn(
          "Failed to sync related memory titles after rename:",
          error,
        );
      }
    },
    [memories, movies, refreshMemoriesQuery, renameMovieService],
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
    refreshMemoriesQuery();
  }, [refreshMemoriesQuery, retryMoviesSync, retrySuggestionsSync]);

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

  const moviesSyncBanner = useWorkspaceSyncBanner({
    sources: [
      {
        isDegraded: isMoviesDegraded,
        isSyncBlocked: isMoviesSyncBlocked,
        syncWarning: moviesSyncWarning,
        retrySync: retryMoviesSync,
      },
      {
        isDegraded: isSuggestionsDegraded,
        isSyncBlocked: isSuggestionsSyncBlocked,
        syncWarning: suggestionsSyncWarning,
        retrySync: retrySuggestionsSync,
      },
    ],
    combinedBlockedLabel:
      "Shared movies and suggestions conflicted with local edits. Refresh and retry.",
    combinedDegradedLabel:
      "Movies and suggestions are being kept locally until shared sync recovers.",
    blockedLabels: [
      "A shared movies change conflicted with local edits. Refresh and retry.",
      suggestionsSyncWarning ||
        "Movie suggestion changes conflicted with local edits. Refresh and retry.",
    ],
    degradedLabels: [
      moviesSyncWarning ||
        "Movie changes are being kept locally until shared sync recovers.",
      suggestionsSyncWarning ||
        "Movie suggestion changes are being kept locally.",
    ],
    defaultDegradedLabel:
      moviesWorkspaceSyncWarning ||
      "Movie changes are being kept locally until shared sync recovers.",
  });

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
    moviesSyncBanner,
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
