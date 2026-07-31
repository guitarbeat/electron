import { useCallback } from "react";
import type { User, Movie, MovieSuggestion } from "@/shared/types";
import type { MovieAutocompleteResult } from "@/services/metadata";

export interface UseMoviesWorkspaceActionsProps {
  currentUser: User | null;
  guestName: string;
  isAdding: boolean;
  setIsAdding: (value: boolean) => void;
  isSubmittingRecommendation: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedAutocompleteResult: MovieAutocompleteResult | null;
  setSelectedAutocompleteResult: (
    value: MovieAutocompleteResult | null,
  ) => void;
  recommendationReason: string;
  setRecommendationReason: (value: string) => void;
  setIsRecommendationComposerOpen: (value: boolean) => void;
  setSuggestionError: (value: string | null) => void;
  setSuccessMovieId: (value: React.SetStateAction<string | null>) => void;
  setToast: (toast: {
    message: string;
    type: "success" | "error" | "info";
  }) => void;
  addMovie: (
    title: string,
    result?: Pick<MovieAutocompleteResult, "imdbID" | "type">,
  ) => Promise<Movie>;
  submitRecommendation: (input: {
    title: string;
    reason?: string;
    suggestedBy?: string;
    selectedResult?: Pick<MovieAutocompleteResult, "imdbID" | "type"> | null;
  }) => Promise<MovieSuggestion>;
  acceptSuggestionToWatchlist: (
    suggestionId: string,
  ) => Promise<{ suggestion: MovieSuggestion; isDuplicate: boolean }>;
  rejectPendingSuggestion: (suggestionId: string) => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  movieToDelete: Movie | null;
  setMovieToDelete: (value: Movie | null) => void;
  focusSearchInput: () => void;
}

export function useMoviesWorkspaceActions({
  currentUser,
  guestName,
  isAdding,
  setIsAdding,
  isSubmittingRecommendation,
  searchQuery,
  setSearchQuery,
  selectedAutocompleteResult,
  setSelectedAutocompleteResult,
  recommendationReason,
  setRecommendationReason,
  setIsRecommendationComposerOpen,
  setSuggestionError,
  setSuccessMovieId,
  setToast,
  addMovie,
  submitRecommendation,
  acceptSuggestionToWatchlist,
  rejectPendingSuggestion,
  deleteMovie,
  movieToDelete,
  setMovieToDelete,
  focusSearchInput,
}: UseMoviesWorkspaceActionsProps) {
  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationReason("");
    setSuggestionError(null);
  }, [
    setIsRecommendationComposerOpen,
    setRecommendationReason,
    setSuggestionError,
  ]);

  const handleRecommendationReasonChange = useCallback(
    (value: string) => {
      setSuggestionError(null);
      setRecommendationReason(value);
    },
    [setSuggestionError, setRecommendationReason],
  );

  const openRecommendationComposer = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }
    setSuggestionError(null);
    setIsRecommendationComposerOpen(true);
  }, [searchQuery, setSuggestionError, setIsRecommendationComposerOpen]);

  const handleAddAction = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) {
      return;
    }
    const title =
      selectedAutocompleteResult?.title.trim() || searchQuery.trim();
    if (!title) {
      return;
    }
    if (!currentUser) {
      setIsAdding(true);
      try {
        const suggestion = await submitRecommendation({
          title,
          suggestedBy: guestName.trim() || undefined,
          selectedResult: selectedAutocompleteResult,
        });
        setSearchQuery("");
        setSelectedAutocompleteResult(null);
        setToast({
          message: `"${title}" sent to suggestions as ${suggestion.suggestedBy}.`,
          type: "success",
        });
        window.requestAnimationFrame(focusSearchInput);
      } catch (error) {
        setToast({
          message:
            error instanceof Error
              ? error.message
              : "Failed to send suggestion",
          type: "error",
        });
      } finally {
        setIsAdding(false);
      }
      return;
    }
    setIsAdding(true);
    try {
      const addedMovie = await addMovie(
        title,
        selectedAutocompleteResult ?? undefined,
      );
      setSuccessMovieId(addedMovie.id);
      window.setTimeout(
        () =>
          setSuccessMovieId((current) =>
            current === addedMovie.id ? null : current,
          ),
        2400,
      );
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      setToast({
        message: `"${title}" added to movies!`,
        type: "success",
      });
      window.requestAnimationFrame(focusSearchInput);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to add movie",
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    addMovie,
    currentUser,
    guestName,
    focusSearchInput,
    isAdding,
    isSubmittingRecommendation,
    searchQuery,
    selectedAutocompleteResult,
    setIsAdding,
    setSearchQuery,
    setSelectedAutocompleteResult,
    setSuccessMovieId,
    setToast,
    submitRecommendation,
  ]);

  const handleSubmitRecommendation = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) {
      return;
    }
    const title =
      selectedAutocompleteResult?.title.trim() || searchQuery.trim();
    if (!title) {
      return;
    }
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
    setSearchQuery,
    setSelectedAutocompleteResult,
    setSuggestionError,
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
    if (!movieToDelete) {
      return;
    }
    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" removed!`, type: "info" });
    } catch {
      setToast({ message: "Failed to remove movie", type: "error" });
    } finally {
      setMovieToDelete(null);
    }
  }, [deleteMovie, movieToDelete, setMovieToDelete, setToast]);

  return {
    resetRecommendationComposer,
    handleRecommendationReasonChange,
    openRecommendationComposer,
    handleAddAction,
    handleSubmitRecommendation,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
  };
}
