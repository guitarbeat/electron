import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@/app/providers';
import type { Movie, MovieSuggestion, SharedMemory, WatchlistProps } from '@/shared/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid } from '@/ui/CollectionLayout';
import Button from '@/ui/Button';
import SyncBanner from '@/components/ui/SyncBanner';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import { useWatchlist } from './useWatchlist';
import WatchlistTopControls, {
  type WatchlistTopControlsHandle,
} from './WatchlistTopControls';
import SuggestionCard from './SuggestionCard';
import MovieCard from './MovieCard';
import { buildWatchlistSections } from './watchlistSections';
import type { MovieAutocompleteResult } from '@/services/metadataService';

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] = useState(false);
  const [recommendationReason, setRecommendationReason] = useState('');
  const [guestName, setGuestName] = useState('');
  const [selectedAutocompleteResult, setSelectedAutocompleteResult] =
    useState<MovieAutocompleteResult | null>(null);
  const watchlistTopControlsRef = useRef<WatchlistTopControlsHandle | null>(null);

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
    isSubmittingRecommendation,
    showConfetti,
    setShowConfetti,
    previousMoviesRef,
    movies,
    isLoading,
    addMovie,
    renameMovie,
    toggleWatched,
    deleteMovie,
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
    isWatchlistDegraded,
    isWatchlistSyncBlocked,
    watchlistSyncWarning,
    retryWatchlistSync,
  } = useWatchlist({ currentUser, isPaused });

  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : ['desktop-1', 'desktop-2', 'desktop-3', 'desktop-4', 'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8'];

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
        targetMovieId = movieLookupByTitle.get(memory.movieTitle.trim().toLowerCase());
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
    () => buildWatchlistSections(movies, pendingSuggestions),
    [movies, pendingSuggestions]
  );

  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current?.find((entry) => entry.id === movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          setSuccessMovieId(movie.id);
          setShowConfetti(true);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: 'success',
          });
        }
      }
    });

    previousMoviesRef.current = movies;
  }, [movies, previousMoviesRef, setShowConfetti, setSuccessMovieId, setToast]);

  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationReason('');
    setSuggestionError(null);
  }, []);

  const handleRecommendationReasonChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationReason(value);
  }, []);

  const focusSearchInput = useCallback(() => {
    watchlistTopControlsRef.current?.focusSearchInput();
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
        setSearchQuery('');
        setSelectedAutocompleteResult(null);
        setToast({
          message: `"${title}" sent to suggestions as ${suggestion.suggestedBy}.`,
          type: 'success',
        });
        window.requestAnimationFrame(focusSearchInput);
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to send suggestion',
          type: 'error',
        });
      } finally {
        setIsAdding(false);
      }
      return;
    }

    setIsAdding(true);
    try {
      const addedMovie = await addMovie(title, selectedAutocompleteResult ?? undefined);
      setSuccessMovieId(addedMovie.id);
      window.setTimeout(() => setSuccessMovieId((current) => (current === addedMovie.id ? null : current)), 2400);
      setSearchQuery('');
      setSelectedAutocompleteResult(null);
      setToast({
        message: `"${title}" added to watchlist!`,
        type: 'success',
      });
      window.requestAnimationFrame(focusSearchInput);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to add movie',
        type: 'error',
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
      setSearchQuery('');
      setSelectedAutocompleteResult(null);
      setToast({
        message: currentUser
          ? `"${title}" suggested for review!`
          : `"${title}" sent to suggestions${guestName.trim() ? ` as ${guestName.trim()}` : ''}!`,
        type: 'success',
      });
      window.requestAnimationFrame(focusSearchInput);
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add suggestion');
      setToast({ message: 'Failed to add suggestion', type: 'error' });
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
        setToast({ message: `"${suggestion.title}" added to watchlist!`, type: 'success' });
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to accept suggestion',
          type: 'error',
        });
      }
    },
    [acceptSuggestionToWatchlist, setToast]
  );

  const handleRejectSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      try {
        await rejectPendingSuggestion(suggestion.id);
        setToast({ message: `"${suggestion.title}" rejected.`, type: 'info' });
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to reject suggestion',
          type: 'error',
        });
      }
    },
    [rejectPendingSuggestion, setToast]
  );

  const confirmDelete = useCallback(async () => {
    if (!movieToDelete) {
      return;
    }

    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" removed!`, type: 'info' });
    } catch {
      setToast({ message: 'Failed to remove movie', type: 'error' });
    } finally {
      setMovieToDelete(null);
    }
  }, [deleteMovie, movieToDelete, setMovieToDelete, setToast]);

  const handleToggleError = useCallback(
    (message: string) => {
      setToast({ message, type: 'error' });
    },
    [setToast]
  );

  const renderMovieGrid = useCallback(
    (moviesToRender: Movie[], emptyState: string) => (
      <CollectionGrid
        className="watchlist-content"
        minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
        style={{
          animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
        }}
      >
        {moviesToRender.length > 0 ? (
          moviesToRender.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              currentUser={currentUser}
              onToggle={() => toggleWatched(movie.id)}
              onToggleError={handleToggleError}
              onRename={(title) => renameMovie(movie.id, title)}
              onDelete={() => setMovieToDelete(movie)}
              animationDelay={`${index * 0.05}s`}
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
            padding={isMobile ? spacing.md : spacing['2xl']}
            className={isMobile ? 'collection-empty-state--tight' : undefined}
            style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
          >
            {emptyState}
          </CollectionEmptyState>
        )}
      </CollectionGrid>
    ),
    [
      addMemory,
      currentUser,
      deleteMemoryRecord,
      isMobile,
      movieMemories,
      renameMovie,
      setMovieToDelete,
      successMovieId,
      handleToggleError,
      toggleMemoryPin,
      toggleWatched,
      updateMemory,
    ]
  );

  const renderSection = useCallback(
    ({
      title,
      count,
      content,
    }: {
      title: string;
      count: number;
      content: React.ReactNode;
    }) => (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: spacing.sm,
            paddingInline: spacing.xs,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span style={{ ...typography.presets.eyebrow, color: colors.accentLight }}>
              {title}
            </span>
            <h2
              style={{
                margin: 0,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.xl,
                lineHeight: typography.lineHeight.snug,
              }}
            >
              {count} {count === 1 ? 'title' : 'titles'}
            </h2>
          </div>
        </div>
        {content}
      </section>
    ),
    []
  );

  const showInitialLoading =
    isLoading &&
    isSuggestionsLoading &&
    movies.length === 0 &&
    pendingSuggestions.length === 0;

  const watchlistBody = useMemo(() => {
    if (showInitialLoading) {
      return (
        <CollectionGrid
          className="watchlist-content"
          minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
          style={{
            animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
          }}
        >
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
            <div className="scanning-overlay" style={{ padding: spacing.xl }}>
              <div
                style={{ ...typography.presets.eyebrow, color: colors.accent, animation: 'pulse 1.5s infinite' }}
              >
                SCANNING GIST REPOSITORY...
              </div>
              <div className="scanning-bar" style={{ maxWidth: '300px', margin: '0 auto' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'inherit', gap: 'inherit' }}>
              {skeletonKeys.map((key) => (
                <MovieCardSkeleton key={key} />
              ))}
            </div>
          </div>
        </CollectionGrid>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['2xl'] }}>
        {renderSection({
          title: 'Queue',
          count: sections.suggestions.length + sections.queue.length,
          content: (
            <CollectionGrid
              className="watchlist-content"
              minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
              style={{
                animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
              }}
            >
              {isSuggestionsLoading && sections.suggestions.length === 0 ? (
                skeletonKeys.slice(0, 4).map((key) => <MovieCardSkeleton key={key} />)
              ) : (
                sections.suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={() => void handleAcceptSuggestion(suggestion)}
                    onReject={() => void handleRejectSuggestion(suggestion)}
                    canRespond={Boolean(currentUser)}
                    disableActions={!currentUser}
                    isProcessing={processingSuggestionId === suggestion.id}
                    animationDelay={`${index * 0.05}s`}
                  />
                ))
              )}
              {sections.queue.length > 0 ? (
                sections.queue.map((movie, index) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    currentUser={currentUser}
                    onToggle={() => toggleWatched(movie.id)}
                    onToggleError={handleToggleError}
                    onRename={(title) => renameMovie(movie.id, title)}
                    onDelete={() => setMovieToDelete(movie)}
                    animationDelay={`${(sections.suggestions.length + index) * 0.05}s`}
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
              ) : sections.suggestions.length === 0 && !isSuggestionsLoading ? (
                <CollectionEmptyState
                  padding={isMobile ? spacing.md : spacing['2xl']}
                  className={`watchlist-empty-queue-state${isMobile ? ' collection-empty-state--tight' : ''}`}
                  style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
                >
                  <span className="watchlist-empty-queue-state__eyebrow">Your next movie night starts here</span>
                  <strong className="watchlist-empty-queue-state__title">Add the first title to build the queue.</strong>
                  <span className="watchlist-empty-queue-state__copy">
                    Search for a movie or series above, then add it to the shared list in one step.
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={focusSearchInput}
                    className="watchlist-empty-queue-state__action"
                  >
                    Jump to search
                  </Button>
                </CollectionEmptyState>
              ) : null}
            </CollectionGrid>
          ),
        })}

        {renderSection({
          title: 'Watched',
          count: sections.watched.length,
          content: renderMovieGrid(sections.watched, 'No watched movies yet'),
        })}
      </div>
    );
  }, [
    addMemory,
    currentUser,
    deleteMemoryRecord,
    focusSearchInput,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleToggleError,
    isMobile,
    isSuggestionsLoading,
    movieMemories,
    renameMovie,
    renderMovieGrid,
    renderSection,
    sections,
    showInitialLoading,
    skeletonKeys,
    successMovieId,
    toggleMemoryPin,
    toggleWatched,
    updateMemory,
    setMovieToDelete,
    processingSuggestionId,
  ]);

  return (
    <div
      className="watchlist-container"
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: spacing.xl }}
    >
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      {isWatchlistDegraded && (
        <SyncBanner
          isBlocked={isWatchlistSyncBlocked}
          onRetry={() => void retryWatchlistSync()}
          label={
            isWatchlistSyncBlocked
              ? 'A shared watchlist change conflicted with local edits. Refresh and retry.'
              : watchlistSyncWarning ||
                'Watchlist changes are being kept locally until shared sync recovers.'
          }
        />
      )}

      <WatchlistTopControls
        ref={watchlistTopControlsRef}
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
        canRecommend={true}
      />
      {watchlistBody}

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

export default memo(Watchlist);
