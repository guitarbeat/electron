/* eslint-disable */
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
import { useCinematicEntrance } from "@/hooks/useCinematicEntrance";
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
import {
  type BentoSortChipConfig,
  type BentoStatTileConfig,
  type SortOrder,
} from "@/components/ui/BentoWorkspaceController";
import { useBentoSlot } from "@/app/BentoSlotContext";
const MOVIE_SECTION_IDS = {
  incoming: "movies-section-incoming",
  queue: "movies-section-queue",
  completed: "movies-section-watched",
};

const MOVIE_SORTS: BentoSortChipConfig[] = [
  { value: "recent", label: "🕐 Recent" },
  { value: "alpha", label: "A→Z" },
  { value: "rating", label: "★ Rating" },
];

const MoviesView: React.FC<MoviesViewProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const { setConfig, searchPortalEl } = useBentoSlot();
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
    isMobile,
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

  const movieStats = useMemo(
    (): BentoStatTileConfig[] => [
      {
        id: "incoming",
        label: "Incoming",
        count: sections.suggestions.length,
        icon: "💌",
        sectionId: MOVIE_SECTION_IDS.incoming,
        tone: "incoming",
      },
      {
        id: "queue",
        label: "Up Next",
        count: sections.queue.length,
        icon: "🎞",
        sectionId: MOVIE_SECTION_IDS.queue,
        tone: "default",
      },
      {
        id: "watched",
        label: "Watched",
        count: sections.completed.length,
        icon: "✓",
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
  const latestMemory = memories[0] ?? null;
  const upNextSummaryCount =
    sections.queue.length + sections.suggestions.length;

  const handleMovieSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order as MovieSortOrder);
  }, []);

  const handleBrowseLayoutChange = useCallback((layout: string) => {
    const nextLayout = layout === "scroll" ? "scroll" : "grid";
    setBrowseLayout(nextLayout);
    writeMovieBrowseLayout(nextLayout);
  }, []);

  useEffect(() => {
    setConfig({
      stats: movieStats,
      sorts: MOVIE_SORTS,
      activeSortOrder: sortOrder,
      onSortChange: handleMovieSortChange,
      ariaLabel: "Movies workspace controls",
      viewModes: MOVIE_BROWSE_LAYOUTS,
      activeViewMode: browseLayout,
      onViewModeChange: handleBrowseLayoutChange,
      viewModeAriaLabel: "Movie browse layout",
    });
  }, [
    setConfig,
    movieStats,
    sortOrder,
    browseLayout,
    handleMovieSortChange,
    handleBrowseLayoutChange,
  ]);

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
      setSearchQuery("");
      setSelectedAutocompleteResult(null);
      setToast({
        message: `"${title}" added to movies!`,
        type: "success",
      });
      window.requestAnimationFrame(focusSearchInput);
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
        getErrorMessage(error, "Failed to add suggestion"),
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
            upNextCount={upNextSummaryCount}
            watchedCount={sections.completed.length}
            noteCount={memories.length}
            latestNoteMovieTitle={latestMemory?.movieTitle ?? null}
            latestNoteAuthor={latestMemory?.author ?? null}
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
            canRecommend={true}
          />,
          searchPortalEl,
        )}
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
        onAddMovieFocus={focusSearchInput}
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
        sectionIds={MOVIE_SECTION_IDS}
        browseLayout={browseLayout}
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
    </>
  );
};
export default memo(MoviesView);
