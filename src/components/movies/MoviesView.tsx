/* eslint-disable */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/app/useProviders';
import type { Movie, MovieSuggestion, SharedMemory, MoviesViewProps } from '@/shared/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import {
  CollectionEmptyState,
  CollectionGrid,
  CollectionSection,
} from "@/ui/CollectionLayout";
import Button from "@/ui/Button";
import SyncBanner from "@/components/ui/SyncBanner";
import { spacing } from "@/theme/tokens";
import { useMoviesWorkspace } from "@/hooks/movies/useMoviesWorkspace";
import { useCinematicEntrance } from "@/hooks/useCinematicEntrance";
import MoviesTopControls, {
  type MoviesTopControlsHandle,
} from './MoviesTopControls';
import SuggestionCard from './SuggestionCard';
import MovieCard from './MovieCard';
import { buildMovieSections } from './lib/movieSections';
import type { MovieAutocompleteResult } from '@/services/metadata';
import './MoviesPhotoMode.css';
const MoviesView: React.FC<MoviesViewProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
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
    setToast,
    setSuccessMovieId,
    processingSuggestionId,
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
  const skeletonKeys = useMemo(
    () =>
      isMobile
        ? ["mobile-1", "mobile-2", "mobile-3", "mobile-4"]
        : [
            "desktop-1",
            "desktop-2",
            "desktop-3",
            "desktop-4",
            "desktop-5",
            "desktop-6",
            "desktop-7",
            "desktop-8",
          ],
    [isMobile],
  );
  const movieMemories = useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();
    const movieLookupByTitle = new Map<string, string>(); // lowercase title -> movieId

    movies.forEach((movie) => {
      movieLookupByTitle.set(movie.title.trim().toLowerCase(), movie.id);
    });
    memories.forEach((memory) => {
      let targetMovieId: string | undefined;

      if (memory.movieId) {
        targetMovieId = memory.movieId;
      } else {
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
    () => buildMovieSections(movies, pendingSuggestions),
    [movies, pendingSuggestions],
  );
  const latestMemory = memories[0] ?? null;
  const upNextSummaryCount = sections.queue.length + sections.suggestions.length;
  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }
    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current?.find(
          (entry) => entry.id === movie.id,
        );
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
    const title = selectedAutocompleteResult?.title.trim() || searchQuery.trim();
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
    const title = selectedAutocompleteResult?.title.trim() || searchQuery.trim();
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
  const handleToggleError = useCallback(
    (message: string) => {
      setToast({ message, type: "error" });
    },
    [setToast],
  );
  const renderMovieGrid = useCallback(
    (moviesToRender: Movie[], emptyState: string) => (
      <CollectionGrid
        className="watchlist-content"
        minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
      >
        {moviesToRender.length > 0 ? (
          moviesToRender.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              currentUser={currentUser}
              onToggle={() => toggleWatched(movie.id)}
              onToggleError={handleToggleError}
              onRename={(title) => renameMovie(movie.id, title)}
              onDelete={() => setMovieToDelete(movie)}
              isHighlighted={successMovieId === movie.id}
              memories={movieMemories.get(movie.id) ?? []}
              onAddMemory={
                currentUser
                  ? async (note) => {
                      await addMemory(movie.id, movie.title, currentUser, note);
                    }
                  : undefined
              }
              onUpdateMemory={async (memoryId, note) => {
                await updateMemory(memoryId, { note });
              }}
              onDeleteMemory={async (memoryId) => {
                await deleteMemoryRecord(memoryId);
              }}
              onTogglePin={async (memoryId) => {
                await toggleMemoryPin(memoryId);
              }}
            />
          ))
        ) : (
          <CollectionEmptyState
            padding={isMobile ? spacing.md : spacing["2xl"]}
            className={`watchlist-empty-watched-state${isMobile ? " collection-empty-state--tight" : ""}`}
          >
            <span
              className="watchlist-empty-watched-state__icon"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="watchlist-empty-watched-state__text">
              {emptyState}
            </span>
          </CollectionEmptyState>
        )}
      </CollectionGrid>
    ),
    [
      currentUser,
      isMobile,
      handleToggleError,
      movieMemories,
    ]
  );
  const showInitialLoading =
    isLoading &&
    isSuggestionsLoading &&
    movies.length === 0 &&
    pendingSuggestions.length === 0;
  const moviesBody = useMemo(() => {
    if (showInitialLoading) {
      return (
        <CollectionGrid
          className="watchlist-content"
          minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
        >
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              gap: spacing.xl,
            }}
          >
            <CollectionEmptyState
              padding={spacing.xl}
              className="collection-empty-state--tight"
            >
              <span
                style={{ fontSize: "1.75rem", lineHeight: 1, opacity: 0.7 }}
                aria-hidden="true"
              >
                🍿
              </span>
              <strong>Loading your movies</strong>
            </CollectionEmptyState>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "inherit",
                gap: "inherit",
              }}
            >
              {skeletonKeys.map((key) => (
                <MovieCardSkeleton key={key} />
              ))}
            </div>
          </div>
        </CollectionGrid>
      );
    }
    const isQueueEmpty = sections.queue.length === 0 && sections.suggestions.length === 0 && !isSuggestionsLoading;
    const isWatchedEmpty = sections.completed.length === 0;
    const isAllEmpty = isQueueEmpty && isWatchedEmpty;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? spacing.xl : spacing["2xl"],
        }}
      >
        {isAllEmpty ? (
          <CollectionGrid
            className="watchlist-content"
            minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
          >
            <CollectionEmptyState
              padding={isMobile ? spacing.lg : spacing["3xl"]}
              className={`watchlist-empty-queue-state${isMobile ? " collection-empty-state--tight" : ""}`}
            >
              <span
                className="watchlist-empty-queue-state__icon"
                aria-hidden="true"
              >
                🎬
              </span>
              <strong className="watchlist-empty-queue-state__title">
                Your movie list is wide open
              </strong>
              <span className="watchlist-empty-queue-state__copy">
                No movies lined up yet. Add something you both want to watch and
                kick off movie night.
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={focusSearchInput}
                className="watchlist-empty-queue-state__action"
              >
                Add a movie
              </Button>
            </CollectionEmptyState>
          </CollectionGrid>
        ) : (
          <>
            {/* ── Incoming suggestions ── */}
            {(isSuggestionsLoading || sections.suggestions.length > 0) && (
              <CollectionSection heading="Incoming" tone="incoming">
                {isSuggestionsLoading && sections.suggestions.length === 0 ? (
                  <CollectionGrid
                    className="watchlist-content"
                    minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
                  >
                    {skeletonKeys.slice(0, 4).map((key) => (
                      <MovieCardSkeleton key={key} />
                    ))}
                  </CollectionGrid>
                ) : (
                  <CollectionGrid
                    className="watchlist-content"
                    minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
                  >
                    {sections.suggestions.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAccept={() => void handleAcceptSuggestion(suggestion)}
                        onReject={() => void handleRejectSuggestion(suggestion)}
                        canRespond={Boolean(currentUser)}
                        disableActions={!currentUser}
                        isProcessing={processingSuggestionId === suggestion.id}
                      />
                    ))}
                  </CollectionGrid>
                )}
              </CollectionSection>
            )}
            {/* ── Up Next ── */}
            {sections.queue.length > 0 && (
              <CollectionSection heading="Up Next">
                {renderMovieGrid(
                  sections.queue,
                  "Your movie list is wide open",
                )}
              </CollectionSection>
            )}
            {/* ── Watched ── */}
            {sections.completed.length > 0 && (
              <CollectionSection heading="Watched" tone="completed">
                {renderMovieGrid(sections.completed, "No watched movies yet")}
              </CollectionSection>
            )}
          </>
        )}
      </div>
    );

  }, [
    currentUser,
    focusSearchInput,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    isMobile,
    isSuggestionsLoading,
    renderMovieGrid,
    sections,
    showInitialLoading,
    skeletonKeys,
    processingSuggestionId,
  ]);
  return (
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
      />
      {moviesBody}
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
  );
};
export default memo(MoviesView);