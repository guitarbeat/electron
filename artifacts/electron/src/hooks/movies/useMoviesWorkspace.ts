import { useCallback, useRef, useState } from "react";
import { updateMemoriesBatch as updateMemoriesBatchService } from "../../services/content/memoryService.ts";
import type { MovieAutocompleteResult } from "../../services/metadata/types.ts";
import { Movie, MovieSuggestion, User } from "../../shared/types.ts";
import { useMovies } from "./useMovies.ts";
import { useMemories } from "./useMemories.ts";

import { useSuggestions } from "../suggestions/index.ts";
import { useToast } from "../../app/useProviders.ts";
import {
  normalizeMovieTitle,
  sanitizeInput,
} from "../../utils/index.ts";
import { trackMetric } from "../../services/analytics/index.ts";
import { retryScopeSync } from "../../services/state/index.ts";
import { useWorkspaceSyncBanner } from "../useWorkspaceSyncBanner.ts";

interface UseMoviesWorkspaceProps {
  currentUser: User | null;
  isPaused: boolean;
  focusSearchInput: () => void;
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
  focusSearchInput,
}: UseMoviesWorkspaceProps) => {
  const { showToast } = useToast();

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
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] =
    useState(false);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedAutocompleteResult, setSelectedAutocompleteResult] =
    useState<MovieAutocompleteResult | null>(null);

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

  const {
    memories,
    memoriesSnapshot,
    refreshMemoriesQuery,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
  } = useMemories(isPaused);

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

  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationReason("");
    setSuggestionError(null);
  }, []);

  const handleRecommendationReasonChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationReason(value);
  }, []);

  const openRecommendationComposer = useCallback(() => {
    if (!searchQuery.trim()) return;
    setSuggestionError(null);
    setIsRecommendationComposerOpen(true);
  }, [searchQuery]);

  const handleAddAction = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) return;
    const title =
      selectedAutocompleteResult?.title.trim() || searchQuery.trim();
    if (!title) return;

    setIsAdding(true);
    try {
      if (!currentUser) {
        const suggestion = await submitRecommendation({
          title,
          suggestedBy: guestName.trim() || undefined,
          selectedResult: selectedAutocompleteResult,
        });
        setToast({
          message: `"${title}" sent to suggestions as ${suggestion.suggestedBy}.`,
          type: "success",
        });
      } else {
        const addedMovie = await addMovie(
          title,
          selectedAutocompleteResult ?? undefined,
        );
        setSuccessMovieId(addedMovie.id);
        window.setTimeout(
          () =>
            setSuccessMovieId((value) =>
              value === addedMovie.id ? null : value,
            ),
          2400,
        );
        setToast({ message: `"${title}" added to movies!`, type: "success" });
      }
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      window.requestAnimationFrame(focusSearchInput);
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : currentUser
              ? "Failed to add movie"
              : "Failed to send suggestion",
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    addMovie,
    currentUser,
    focusSearchInput,
    guestName,
    isAdding,
    isSubmittingRecommendation,
    searchQuery,
    selectedAutocompleteResult,
    setToast,
    submitRecommendation,
  ]);

  const handleSubmitRecommendation = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) return;
    const title =
      selectedAutocompleteResult?.title.trim() || searchQuery.trim();
    if (!title) return;

    setSuggestionError(null);
    try {
      await submitRecommendation({
        title,
        reason: recommendationReason,
        suggestedBy: guestName.trim() || undefined,
        selectedResult: selectedAutocompleteResult,
      });
      resetRecommendationComposer();
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      setToast({
        message: currentUser
          ? `"${title}" suggested for review!`
          : `"${title}" sent to suggestions${guestName.trim() ? ` as ${guestName.trim()}` : ""}!`,
        type: "success",
      });
      window.requestAnimationFrame(focusSearchInput);
    } catch (error) {
      setSuggestionError(
        error instanceof Error ? error.message : "Failed to add suggestion",
      );
      setToast({ message: "Failed to add suggestion", type: "error" });
    }
  }, [
    currentUser,
    focusSearchInput,
    guestName,
    isAdding,
    isSubmittingRecommendation,
    recommendationReason,
    resetRecommendationComposer,
    searchQuery,
    selectedAutocompleteResult,
    setToast,
    submitRecommendation,
  ]);

  const handleAcceptSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      try {
        await acceptSuggestionToWatchlist(suggestion.id);
        setToast({
          message: `"${suggestion.title}" added to movies!`,
          type: "success",
        });
      } catch (error) {
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to accept suggestion",
          type: "error",
        });
      }
    },
    [acceptSuggestionToWatchlist, setToast],
  );

  const handleRejectSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      try {
        await rejectPendingSuggestion(suggestion.id);
        setToast({ message: `"${suggestion.title}" rejected.`, type: "info" });
      } catch (error) {
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to reject suggestion",
          type: "error",
        });
      }
    },
    [rejectPendingSuggestion, setToast],
  );

  const confirmDelete = useCallback(async () => {
    if (!movieToDelete) return;
    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" removed!`, type: "info" });
    } catch {
      setToast({ message: "Failed to remove movie", type: "error" });
    } finally {
      setMovieToDelete(null);
    }
  }, [deleteMovie, movieToDelete, setToast]);

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
    suggestionError,
    isRecommendationComposerOpen,
    recommendationReason,
    guestName,
    setGuestName,
    selectedAutocompleteResult,
    setSelectedAutocompleteResult,
    resetRecommendationComposer,
    handleRecommendationReasonChange,
    openRecommendationComposer,
    handleAddAction,
    handleSubmitRecommendation,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
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
