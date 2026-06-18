import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "@/app/useProviders";
import type {
  Movie,
  MovieSuggestion,
  MoviesViewProps,
} from "@/shared/types";
import ConfirmDialog from "@/ui/ConfirmDialog";
import SyncBanner from "@/components/ui/SyncBanner";
import MovieSectionBody from "@/ui/MovieSectionBody";
import { useMoviesWorkspace } from "@/hooks/movies";
import MoviesTopControls, {
  type MoviesTopControlsHandle,
} from "./MoviesTopControls";
import { buildMovieSections, type MovieSortOrder } from "./lib/movieSections";
import {
  MOVIE_BROWSE_LAYOUTS,
  readMovieBrowseLayout,
  writeMovieBrowseLayout,
  type MovieBrowseLayout,
} from "./lib/movieBrowseLayout";
import { groupMemoriesByMovieId } from "@/components/memories/lib/memoryUtils";
import { getErrorMessage } from "@/utils";
import type { MovieAutocompleteResult } from "@/services/metadata";
import { createPortal } from "react-dom";
import { useBentoSlot } from "@/app/BentoSlotContext";
import { useViewport } from "@/app/ViewportContext";
import { useFocusSearchShortcut } from "@/hooks/useFocusSearchShortcut";
import { useWorkspaceBentoConfig } from "@/hooks/useWorkspaceBentoConfig";
import {
  MOVIE_COLLECTION_SORTS,
  workspaceSectionIds,
} from "@/utils/workspaceConfig";

const MOBILE_MOVIE_VIEW_MODES = MOVIE_BROWSE_LAYOUTS.map(({ value, label }) => ({
  value,
  label: value === "grid" ? "Grid" : "Scroll",
  ariaLabel: label,
}));

const resolveSearchTitle = (
  selectedAutocompleteResult: MovieAutocompleteResult | null,
  searchQuery: string,
) => selectedAutocompleteResult?.title.trim() || searchQuery.trim();

const MoviesView: React.FC<MoviesViewProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const { isMobile } = useViewport();
  const { searchPortalEl } = useBentoSlot();
  const [sortOrder, setSortOrder] = useState<MovieSortOrder>("recent");
  const [browseLayout, setBrowseLayout] = useState<MovieBrowseLayout>(() =>
    readMovieBrowseLayout(),
  );
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] =
    useState(false);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedAutocompleteResult, setSelectedAutocompleteResult] =
    useState<MovieAutocompleteResult | null>(null);
  const moviesTopControlsRef = useRef<MoviesTopControlsHandle | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    toggleWatched,
    renameMovie,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    isSubmittingRecommendation,
    previousMoviesRef,
    movies,
    isLoading,
    addMovie,
    deleteMovie,
    pendingSuggestions,
    submitRecommendation,
    acceptSuggestionToWatchlist,
    rejectPendingSuggestion,
    isSuggestionsLoading,
    memories,
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    retryMoviesWorkspaceSync,
  } = useMoviesWorkspace({ currentUser, isPaused });
  const movieMemories = useMemo(
    () => groupMemoriesByMovieId(movies, memories),
    [memories, movies],
  );
  const sections = useMemo(
    () => buildMovieSections(movies, pendingSuggestions, sortOrder),
    [movies, pendingSuggestions, sortOrder],
  );

  const handleMovieSortChange = useCallback((order: MovieSortOrder) => {
    setSortOrder(order);
  }, []);

  const handleBrowseLayoutChange = useCallback((layout: string) => {
    const nextLayout = layout === "scroll" ? "scroll" : "grid";
    setBrowseLayout(nextLayout);
    writeMovieBrowseLayout(nextLayout);
  }, []);

  useWorkspaceBentoConfig({
    tab: "movies",
    sectionIds: workspaceSectionIds("movies"),
    counts: {
      incoming: sections.suggestions.length,
      queue: sections.queue.length,
      completed: sections.completed.length,
    },
    sortOrder,
    onSortChange: handleMovieSortChange,
    sorts: MOVIE_COLLECTION_SORTS.desktop,
    mobileSorts: MOVIE_COLLECTION_SORTS.mobile,
    ariaLabel: "Movies workspace controls",
    viewModes: isMobile ? MOBILE_MOVIE_VIEW_MODES : MOVIE_BROWSE_LAYOUTS,
    activeViewMode: browseLayout,
    onViewModeChange: handleBrowseLayoutChange,
    viewModeAriaLabel: "Movie browse layout",
    sectionSpyEnabled: !isLoading,
    statsLoading: isLoading,
    sectionAvailability: {
      incoming: isSuggestionsLoading || sections.suggestions.length > 0,
      queue: sections.queue.length > 0,
      completed: sections.completed.length > 0,
    },
  });

  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    // Pre-compute map for O(1) lookups to avoid O(N^2) complexity in the loop
    const prevMoviesMap = new Map(
      previousMoviesRef.current.map((movie) => [movie.id, movie]),
    );

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = prevMoviesMap.get(movie.id);
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
  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationReason("");
    setSuggestionError(null);
  }, []);
  const handleRecommendationReasonChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationReason(value);
  }, []);
  const focusSearchInput = useCallback(() => {
    moviesTopControlsRef.current?.focusSearchInput();
  }, []);
  const handleEmptyStateAction = useCallback(() => {
    focusSearchInput();
    if (!currentUser) {
      setToast({
        message: "Type a movie or show title in search, then press Suggest.",
        type: "info",
      });
    }
  }, [currentUser, focusSearchInput, setToast]);
  useFocusSearchShortcut(focusSearchInput);
  const clearSearchAndRefocus = useCallback(() => {
    setSearchQuery("");
    setSelectedAutocompleteResult(null);
    window.requestAnimationFrame(focusSearchInput);
  }, [focusSearchInput, setSearchQuery, setSelectedAutocompleteResult]);
  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
      setSelectedAutocompleteResult(null);
    }
  }, [resetRecommendationComposer, searchQuery]);
  const openRecommendationComposer = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }
    setSuggestionError(null);
    setIsRecommendationComposerOpen(true);
  }, [searchQuery]);
  const handleAddAction = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) {
      return;
    }
    const title = resolveSearchTitle(selectedAutocompleteResult, searchQuery);
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
        clearSearchAndRefocus();
        setToast({
          message: `"${title}" sent to suggestions as ${suggestion.suggestedBy}.`,
          type: "success",
        });
      } catch (error) {
        setToast({
          message: getErrorMessage(error, "Failed to send suggestion"),
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
      clearSearchAndRefocus();
      setToast({
        message: `"${title}" added to movies!`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to add movie"),
        type: "error",
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    addMovie,
    clearSearchAndRefocus,
    currentUser,
    guestName,
    isAdding,
    isSubmittingRecommendation,
    searchQuery,
    selectedAutocompleteResult,
    setIsAdding,
    setSuccessMovieId,
    setToast,
    submitRecommendation,
  ]);
  const handleSubmitRecommendation = useCallback(async () => {
    if (isAdding || isSubmittingRecommendation) {
      return;
    }
    const title = resolveSearchTitle(selectedAutocompleteResult, searchQuery);
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
      clearSearchAndRefocus();
      setToast({
        message: currentUser
          ? `"${title}" suggested for review!`
          : `"${title}" sent to suggestions${guestName.trim() ? ` as ${guestName.trim()}` : ""}!`,
        type: "success",
      });
    } catch (error) {
      setSuggestionError(
        getErrorMessage(error, "Failed to add suggestion"),
      );
      setToast({ message: "Failed to add suggestion", type: "error" });
    }
  }, [
    clearSearchAndRefocus,
    currentUser,
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
          message: getErrorMessage(error, "Failed to accept suggestion"),
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
          message: getErrorMessage(error, "Failed to reject suggestion"),
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
  return (
    <>
      {searchPortalEl &&
        createPortal(
          <MoviesTopControls
            ref={moviesTopControlsRef}
            currentUser={currentUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedAutocompleteResult={selectedAutocompleteResult}
            setSelectedAutocompleteResult={setSelectedAutocompleteResult}
            guestName={guestName}
            setGuestName={setGuestName}
            onSubmit={handleAddAction}
            onRecommend={openRecommendationComposer}
            onSubmitRecommendation={handleSubmitRecommendation}
            onCancelRecommendation={resetRecommendationComposer}
            recommendationReason={recommendationReason}
            setRecommendationReason={handleRecommendationReasonChange}
            showRecommendationComposer={isRecommendationComposerOpen}
            isAdding={isAdding}
            isSubmittingRecommendation={isSubmittingRecommendation}
            suggestionError={suggestionError}
          />,
          searchPortalEl,
        )}
      <div className="watchlist-container">
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
        processingSuggestionId={processingSuggestionId}
        successMovieId={successMovieId}
        movieMemories={movieMemories}
        onAddMovieFocus={handleEmptyStateAction}
        onAcceptSuggestion={handleAcceptSuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        onDeleteRequest={setMovieToDelete}
        onToggleError={(message) => setToast({ message, type: "error" })}
        actions={{
          toggleWatched,
          renameMovie,
          addMemory,
          updateMemory,
          deleteMemory: deleteMemoryRecord,
          togglePin: toggleMemoryPin,
        }}
        browseLayout={browseLayout}
      />
        {movieToDelete && (
          <ConfirmDialog
            isOpen={Boolean(movieToDelete)}
            title="Remove movie"
            message={`Are you sure you want to remove "${movieToDelete.title}"?`}
            onConfirm={confirmDelete}
            onCancel={() => setMovieToDelete(null)}
            confirmText="Remove"
            variant="danger"
          />
        )}
      </div>
    </>
  );
};
export default memo(MoviesView);
