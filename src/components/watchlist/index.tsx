import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  buildSharedSuggestionUrl,
  clearCurrentSharedSuggestionParams,
  parseSharedSuggestionIntent,
  type SharedSuggestionIntent,
} from '@/app/sharedSuggestion';
import { useUser } from '@/app/providers';
import { useWatchlist } from './useWatchlist';
import type { MovieSuggestion, SharedMemory, WatchlistProps } from '@/shared/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid } from '@/ui/CollectionLayout';
import SyncBanner from '@/components/ui/SyncBanner';
import SharedSuggestionPrompt from './SharedSuggestionPrompt';
import { colors, motion, spacing, typography } from '@/theme/tokens';
import { trackMetric } from '@/services/analyticsService';
import { normalizeMovieTitle, shareSuggestionLink } from './watchlistShare';
import WatchlistTopControls from './WatchlistTopControls';
import SuggestionCard from './SuggestionCard';
import MovieCard from './MovieCard';
import Button from '@/ui/Button';

interface WatchlistEmptyStateProps {
  isMobile: boolean;
  searchQuery: string;
  currentUser: ReturnType<typeof useUser>['currentUser'];
  isAdding: boolean;
  isSubmittingRecommendation: boolean;
  isSharing: boolean;
  onAddMovie: () => Promise<void> | void;
  onFocusSearch: () => void;
}

const WatchlistEmptyState: React.FC<WatchlistEmptyStateProps> = ({
  isMobile,
  searchQuery,
  currentUser,
  isAdding,
  isSubmittingRecommendation,
  isSharing,
  onAddMovie,
  onFocusSearch,
}) => {
  const trimmedQuery = searchQuery.trim();
  const hasQuery = trimmedQuery.length > 0;
  const canAddCurrentQuery = hasQuery && Boolean(currentUser);

  const eyebrow = hasQuery ? 'No exact match yet' : 'Fresh queue';
  const title = hasQuery ? `No saved match for "${trimmedQuery}"` : 'Your watchlist is ready for its first pick';
  const body = hasQuery
    ? currentUser
      ? 'You can still add this title to the shared queue, even if it is not already listed.'
      : 'Pick Aaron or Electra from quick actions first, then add this title to the shared queue.'
    : currentUser
      ? 'Search for a movie title above to add a first pick, or share a suggestion link to collect ideas together.'
      : 'Open quick actions to choose Aaron or Electra, then search for a movie title to start the shared queue.';

  return (
    <CollectionEmptyState
      padding={isMobile ? spacing.md : spacing['2xl']}
      className={`watchlist-empty-state ${isMobile ? 'collection-empty-state--tight' : ''}`.trim()}
      style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
      aria-live="polite"
    >
      <span className="watchlist-empty-state__eyebrow">{eyebrow}</span>
      <h2 className="watchlist-empty-state__title">{title}</h2>
      <p>{body}</p>
      <div className="watchlist-empty-state__actions">
        {canAddCurrentQuery ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => void onAddMovie()}
            disabled={isAdding || isSubmittingRecommendation || isSharing}
            isLoading={isAdding}
          >
            Add &ldquo;{trimmedQuery}&rdquo;
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onFocusSearch}
          disabled={isAdding || isSubmittingRecommendation || isSharing}
        >
          Focus title field
        </Button>
      </div>
    </CollectionEmptyState>
  );
};

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [sharedSuggestion, setSharedSuggestion] = useState<SharedSuggestionIntent | null>(() =>
    typeof window === 'undefined' ? null : parseSharedSuggestionIntent(window.location.search)
  );
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingSharedSuggestion, setIsSavingSharedSuggestion] = useState(false);

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
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
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
    memories,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    isWatchlistDegraded,
    isWatchlistSyncBlocked,
    watchlistSyncWarning,
    retryWatchlistSync,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
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
        actionLabel: 'Open',
        onAction: () => {
          setContentTab('queue');
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
    setContentTab,
    setIsAdding,
    setSearchQuery,
    setSuccessMovieId,
    setToast,
  ]);

  const handleRandomMoviePick = useCallback(() => {
    const movieTitles = filteredMovies.map((movie) => movie.title);
    const suggestionTitles = filteredSuggestions.map((suggestion) => suggestion.title);
    const pool = Array.from(new Set([...movieTitles, ...suggestionTitles])).filter(Boolean);

    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomTitle = pool[randomIndex];

    if (randomTitle) {
      setSearchQuery(randomTitle);
    }
  }, [filteredMovies, filteredSuggestions, setSearchQuery]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

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
      resetRecommendationComposer();
      setToast({ message: `"${title}" suggested for review!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add suggestion');
      setToast({ message: 'Failed to add suggestion', type: 'error' });
    }
  }, [
    recommendationGuestName,
    recommendationReason,
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
      {isLoading ? (
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
      ) : contentTab === 'suggestions' ? (
        filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => void handleAcceptSuggestion(suggestion)}
              onReject={() => void handleRejectSuggestion(suggestion)}
              canRespond={Boolean(currentUser)}
              disableActions={Boolean(processingSuggestionId) || !currentUser}
              isProcessing={processingSuggestionId === suggestion.id}
              animationDelay={`${index * 0.05}s`}
            />
          ))
        ) : (
          <CollectionEmptyState
            padding={isMobile ? spacing.md : spacing['2xl']}
            className={isMobile ? 'collection-empty-state--tight' : undefined}
            style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
          >
            No pending suggestions
          </CollectionEmptyState>
        )
      ) : filteredMovies.length > 0 ? (
        filteredMovies.map((movie, index) => (
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
        <WatchlistEmptyState
          isMobile={isMobile}
          searchQuery={searchQuery}
          currentUser={currentUser}
          isAdding={isAdding}
          isSubmittingRecommendation={isSubmittingRecommendation}
          isSharing={isSharing}
          onAddMovie={handleAddAction}
          onFocusSearch={handleFocusSearch}
        />
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
        searchInputRef={searchInputRef}
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
        canSurprise={filteredMovies.length > 0 || filteredSuggestions.length > 0}
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
