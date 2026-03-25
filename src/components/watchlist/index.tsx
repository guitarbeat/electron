import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  buildSharedSuggestionUrl,
  clearCurrentSharedSuggestionParams,
  parseSharedSuggestionIntent,
  type SharedSuggestionIntent,
} from '@/app/sharedSuggestion';
import { useUser } from '@/app/providers';
import { useWatchlist } from './useWatchlist';
import type {
  ContentTab,
  MovieSuggestion,
  SharedMemory,
  SortMode,
  WatchlistProps,
} from '@/shared/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid } from '@/ui/CollectionLayout';
import SyncBanner from '@/components/ui/SyncBanner';
import SharedSuggestionPrompt from './SharedSuggestionPrompt';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import { trackMetric } from '@/services/analyticsService';
import { normalizeMovieTitle } from '@/utils/shared';
import { shareSuggestionLink } from '@/utils/browser';
import WatchlistTopControls from './WatchlistTopControls';
import SuggestionCard from './SuggestionCard';
import MovieCard from './MovieCard';
import { buildWatchlistTabView, getWatchlistTabCounts } from './watchlistView';

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const [sharedSuggestion, setSharedSuggestion] = useState<SharedSuggestionIntent | null>(() =>
    typeof window === 'undefined' ? null : parseSharedSuggestionIntent(window.location.search)
  );
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingSharedSuggestion, setIsSavingSharedSuggestion] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>('queue');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const {
    // State returns
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

    // Data returns
    movies,
    isLoading,
    // refreshMovies,
    addMovie,
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

  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] = useState(false);
  const [recommendationGuestName, setRecommendationGuestName] = useState('');
  const [recommendationReason, setRecommendationReason] = useState('');

  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : ['desktop-1', 'desktop-2', 'desktop-3', 'desktop-4', 'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8'];

  const movieMemories = React.useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();

    movies.forEach((movie) => {
      const normalizedTitle = movie.title.trim().toLowerCase();
      const relatedMemories = memories.filter((memory) => {
        if (memory.movieId === movie.id) {
          return true;
        }

        return !memory.movieId && memory.movieTitle.trim().toLowerCase() === normalizedTitle;
      });

      if (relatedMemories.length > 0) {
        memoriesByMovieId.set(movie.id, relatedMemories);
      }
    });

    return memoriesByMovieId;
  }, [memories, movies]);

  const isSharedSuggestionAlreadySaved = React.useMemo(() => {
    if (!sharedSuggestion) {
      return false;
    }

    const normalizedTitle = normalizeMovieTitle(sharedSuggestion.title);

    return (
      movies.some((movie) => normalizeMovieTitle(movie.title) === normalizedTitle) ||
      pendingSuggestions.some((suggestion) => normalizeMovieTitle(suggestion.title) === normalizedTitle)
    );
  }, [movies, pendingSuggestions, sharedSuggestion]);

  const tabCounts = React.useMemo(
    () => getWatchlistTabCounts(movies, pendingSuggestions),
    [movies, pendingSuggestions]
  );

  const activeView = React.useMemo(
    () =>
      buildWatchlistTabView({
        contentTab,
        movies,
        pendingSuggestions,
        sortMode,
        searchQuery,
      }),
    [contentTab, movies, pendingSuggestions, searchQuery, sortMode]
  );

  // Handle confetti when both users watch a movie
  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current?.find((m) => m.id === movie.id);
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
  }, [movies, setShowConfetti, setToast, setSuccessMovieId, previousMoviesRef]);

  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationGuestName('');
    setRecommendationReason('');
    setSuggestionError(null);
  }, []);

  const handleRecommendationGuestNameChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationGuestName(value);
  }, []);

  const handleRecommendationReasonChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationReason(value);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (parseSharedSuggestionIntent(window.location.search)) {
      trackMetric('shared_suggestion_link_opened');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSharedSuggestion = () => {
      setSharedSuggestion(parseSharedSuggestionIntent(window.location.search));
    };

    window.addEventListener('popstate', syncSharedSuggestion);
    return () => window.removeEventListener('popstate', syncSharedSuggestion);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
    }
  }, [resetRecommendationComposer, searchQuery]);

  // Event handlers
  const openRecommendationComposer = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add to shared suggestions.',
        type: 'info',
      });
      return;
    }

    setSuggestionError(null);
    setIsRecommendationComposerOpen(true);
  }, [currentUser, searchQuery, setToast]);

  const handleAddAction = useCallback(async () => {
    const title = searchQuery.trim();
    if (!title) return;

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add movies to the shared watchlist.',
        type: 'info',
      });
      return;
    }

    setIsAdding(true);
    try {
      const addedMovie = await addMovie(title);
      setSuccessMovieId(addedMovie.id);
      window.setTimeout(() => setSuccessMovieId((current) => (current === addedMovie.id ? null : current)), 2400);
      setSearchQuery('');
      setToast({
        message: `"${title}" added to watchlist!`,
        type: 'success',
        actionLabel: 'Find',
        onAction: () => {
          setSearchQuery(title);
        },
      });
    } catch {
      setToast({ message: 'Failed to add movie', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [
    searchQuery,
    currentUser,
    addMovie,
    setIsAdding,
    setSearchQuery,
    setSuccessMovieId,
    setToast,
  ]);

  const handleRandomMoviePick = useCallback(() => {
    const pool = activeView.surprisePool;

    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomTitle = pool[randomIndex];

    if (randomTitle) {
      setSearchQuery(randomTitle);
    }
  }, [activeView.surprisePool, setSearchQuery]);

  const handleSubmitRecommendation = useCallback(async () => {
    const title = searchQuery.trim();
    if (!title) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add to shared suggestions.',
        type: 'info',
      });
      return;
    }

    setSuggestionError(null);

    try {
      await submitRecommendation({
        title,
        suggestedBy: recommendationGuestName,
        reason: recommendationReason,
      });
      setContentTab('suggestions');
      resetRecommendationComposer();
      setToast({ message: `"${title}" suggested for review!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add suggestion');
      setToast({ message: 'Failed to add suggestion', type: 'error' });
    }
  }, [
    recommendationGuestName,
    recommendationReason,
    setContentTab,
    currentUser,
    resetRecommendationComposer,
    searchQuery,
    setToast,
    submitRecommendation,
  ]);

  const dismissSharedSuggestion = useCallback(() => {
    clearCurrentSharedSuggestionParams();
    setSharedSuggestion(null);
  }, []);

  const handleShareAction = useCallback(async () => {
    const title = searchQuery.trim();

    if (!title || typeof window === 'undefined') {
      return;
    }

    setIsSharing(true);

    try {
      const shareUrl = buildSharedSuggestionUrl(window.location.href, {
        title,
        suggestedBy: currentUser ?? 'Someone',
      });
      const shareMethod = await shareSuggestionLink(title, currentUser ?? 'Someone', shareUrl);

      trackMetric('watchlist_share_clicked');
      setToast({
        message:
          shareMethod === 'native'
            ? `Share sheet opened for "${title}".`
            : `Share link copied for "${title}".`,
        type: 'success',
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setToast({ message: 'Failed to share movie link', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  }, [currentUser, searchQuery, setToast]);

  const handleSaveSharedSuggestion = useCallback(async () => {
    if (!sharedSuggestion) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to save shared suggestions.',
        type: 'info',
      });
      return;
    }

    if (isSharedSuggestionAlreadySaved) {
      setToast({
        message: `"${sharedSuggestion.title}" is already in your watchlist flow.`,
        type: 'info',
      });
      dismissSharedSuggestion();
      return;
    }

    setIsSavingSharedSuggestion(true);
    setSuggestionError(null);

    try {
      await submitRecommendation({
        title: sharedSuggestion.title,
        suggestedBy: sharedSuggestion.suggestedBy,
        preserveSuggestedBy: true,
      });
      trackMetric('shared_suggestion_saved');
      setContentTab('suggestions');
      setSearchQuery(sharedSuggestion.title);
      resetRecommendationComposer();
      setToast({
        message: `"${sharedSuggestion.title}" saved to suggestions.`,
        type: 'success',
      });
      dismissSharedSuggestion();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to save shared suggestion',
        type: 'error',
      });
    } finally {
      setIsSavingSharedSuggestion(false);
    }
  }, [
    dismissSharedSuggestion,
    currentUser,
    isSharedSuggestionAlreadySaved,
    resetRecommendationComposer,
    setContentTab,
    setSearchQuery,
    setToast,
    sharedSuggestion,
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
    if (!movieToDelete) return;

    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" removed!`, type: 'info' });
    } catch {
      setToast({ message: 'Failed to remove movie', type: 'error' });
    } finally {
      setMovieToDelete(null);
    }
  }, [movieToDelete, deleteMovie, setToast, setMovieToDelete]);

  const renderContent = () => (
    <CollectionGrid
      className="watchlist-content"
      minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
      style={{
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      {(contentTab === 'suggestions' ? isSuggestionsLoading : isLoading) &&
      activeView.movies.length === 0 &&
      activeView.suggestions.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <div className="scanning-overlay" style={{ padding: spacing.xl }}>
            <div style={{ ...typography.presets.eyebrow, color: colors.accent, animation: 'pulse 1.5s infinite' }}>
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
      ) : contentTab === 'suggestions' && activeView.suggestions.length > 0 ? (
        activeView.suggestions.map((suggestion, index) => (
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
      ) : activeView.movies.length > 0 ? (
        activeView.movies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            currentUser={currentUser}
            onToggle={() => toggleWatched(movie.id)}
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
          {activeView.emptyState}
        </CollectionEmptyState>
      )}
    </CollectionGrid>
  );

  return (
    <div className="watchlist-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
        currentUser={currentUser}
        contentTab={contentTab}
        setContentTab={setContentTab}
        sortMode={sortMode}
        setSortMode={setSortMode}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleAddAction}
        onRecommend={openRecommendationComposer}
        onSubmitRecommendation={handleSubmitRecommendation}
        onCancelRecommendation={resetRecommendationComposer}
        recommendationGuestName={recommendationGuestName}
        setRecommendationGuestName={handleRecommendationGuestNameChange}
        recommendationReason={recommendationReason}
        setRecommendationReason={handleRecommendationReasonChange}
        showRecommendationComposer={isRecommendationComposerOpen}
        onPickRandom={handleRandomMoviePick}
        canSurprise={activeView.surprisePool.length > 0}
        isAdding={isAdding}
        isSubmittingRecommendation={isSubmittingRecommendation}
        isSharing={isSharing}
        suggestionError={suggestionError}
        canRecommend={Boolean(currentUser)}
        onShare={handleShareAction}
      />

      {sharedSuggestion && (
        <SharedSuggestionPrompt
          intent={sharedSuggestion}
          isSaving={isSavingSharedSuggestion}
          isAlreadySaved={isSharedSuggestionAlreadySaved}
          canSave={Boolean(currentUser)}
          onSave={() => void handleSaveSharedSuggestion()}
          onDismiss={dismissSharedSuggestion}
        />
      )}

      {renderContent()}

      {movieToDelete && (
        <ConfirmDialog
          isOpen={!!movieToDelete}
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
