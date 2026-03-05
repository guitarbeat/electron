import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import FixMatchDialog from '../common/FixMatchDialog';
import Confetti from '../effects/Confetti';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, Spinner, FilmIcon } from '../common/icons';
import MasonryGrid from '../ui/MasonryGrid';
import { MovieCardSkeleton, SuggestionSkeleton } from '../ui/Skeleton';
import SubNav from '../ui/SubNav';
import MovieItem from '../common/MovieItem';
import { SuggestionItemCard } from '../common/DashboardCards';
import { useWatchlist } from './hooks/useWatchlist';
import { WatchlistProps, SortMode, ContentTab } from './types';
import { getEmptyStateMessage } from './utils';
import { Movie, MovieSuggestion, SharedMemory } from '../../types';
import { spacing, colors, radius, typography, layout } from '../../design-system/tokens';
import './Watchlist.css';

const MOVIE_TABS: { id: ContentTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎬' },
  { id: 'to-watch', label: 'Queue', icon: '📋' },
  { id: 'watched', label: 'Watched', icon: '✅' },
  { id: 'suggestions', label: 'Suggestions', icon: '💡' },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'A–Z' },
  { id: 'year', label: 'Year' },
];
const MOBILE_SKELETON_KEYS = ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4'];
const DESKTOP_SKELETON_KEYS = [
  'desktop-1',
  'desktop-2',
  'desktop-3',
  'desktop-4',
  'desktop-5',
  'desktop-6',
  'desktop-7',
  'desktop-8',
];

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();

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
    setSuccessMovieId,
    processingSuggestionId,
    setProcessingSuggestionId,
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    previousMoviesRef,
    movieResultsRef,

    // Data returns
    movies,
    isLoading,
    moviesError,
    refreshMovies,
    addMovie,
    toggleWatched,
    deleteMovie,
    restoreMovie,
    manualMetadataUpdate,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    isSuggestionsLoading,
    memories,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
    isSubmitting,
  } = useWatchlist({ currentUser, isPaused });

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [suggestionToReject, setSuggestionToReject] = useState<MovieSuggestion | null>(null);

  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current?.find((m) => m.id === movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          setShowConfetti(true);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: 'success',
          });
          setTimeout(() => {
            setShowConfetti(false);
          }, 3000);
        }
      }
    });

    previousMoviesRef.current = movies;
  }, [movies, setShowConfetti, setToast, previousMoviesRef]);

  const showGuestWarning = useCallback(() => {
    setToast({
      message: 'Please select a profile above to make changes!',
      type: 'info',
    });
  }, [setToast]);

  const handleToggleWatched = useCallback(
    async (movie: Movie) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      try {
        const wasWatched = movie.watchedBy.includes(currentUser);
        await toggleWatched(movie.id);
        setToast({
          message: wasWatched
            ? `Marked "${movie.title}" as unwatched`
            : `Marked "${movie.title}" as watched!`,
          type: 'success',
        });
      } catch (err: any) {
        setToast({ message: `Error: ${err.message}`, type: 'error' });
      }
    },
    [toggleWatched, currentUser, showGuestWarning, setToast]
  );

  const handleDeleteMovie = useCallback(
    (movie: Movie) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      setMovieToDelete(movie);
    },
    [currentUser, showGuestWarning, setMovieToDelete]
  );

  const confirmDelete = useCallback(async () => {
    if (!movieToDelete) return;
    const deletedMovie = movieToDelete;
    try {
      await deleteMovie(deletedMovie.id);
      setMovieToDelete(null);
      setToast({
        message: `Deleted "${deletedMovie.title}"`,
        type: 'success',
        onUndo: async () => {
          try {
            await restoreMovie(deletedMovie);
            setToast({ message: `Restored "${deletedMovie.title}"`, type: 'success' });
          } catch {
            setToast({ message: 'Failed to undo delete', type: 'error' });
          }
        },
      });
    } catch (err: any) {
      setToast({ message: `Failed to delete: ${err.message}`, type: 'error' });
    }
  }, [movieToDelete, deleteMovie, restoreMovie, setToast, setMovieToDelete]);

  const handleFixMatch = useCallback(
    (movie: Movie) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      setMovieToFix(movie);
    },
    [currentUser, showGuestWarning, setMovieToFix]
  );

  const handleAcceptSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      setProcessingSuggestionId(suggestion.id);
      try {
        await addMovie(suggestion.title);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
        await acceptSuggestion(suggestion.id, currentUser);

        setToast({
          message: `Accepted "${suggestion.title}" to watchlist!`,
          type: 'success',
        });
        setSuccessMovieId(suggestion.title);
        setTimeout(() => setSuccessMovieId(null), 2000);
      } catch (err: any) {
        setToast({ message: `Failed to accept: ${err.message}`, type: 'error' });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [
      currentUser,
      addMovie,
      acceptSuggestion,
      setToast,
      setSuccessMovieId,
      setProcessingSuggestionId,
      showGuestWarning,
    ]
  );

  const handleRejectSuggestion = useCallback(
    (suggestion: MovieSuggestion) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      setSuggestionToReject(suggestion);
    },
    [currentUser, showGuestWarning]
  );

  const confirmRejectSuggestion = useCallback(async () => {
    if (!currentUser || !suggestionToReject) return;
    setProcessingSuggestionId(suggestionToReject.id);
    try {
      await rejectSuggestion(suggestionToReject.id, currentUser);
      setToast({ message: 'Suggestion removed', type: 'info' });
      setSuggestionToReject(null);
    } catch (err: any) {
      setToast({ message: 'Failed to reject suggestion', type: 'error' });
    } finally {
      setProcessingSuggestionId(null);
    }
  }, [currentUser, rejectSuggestion, setProcessingSuggestionId, setToast, suggestionToReject]);

  const handleUpdateMemory = useCallback(
    async (memoryId: string, updates: { note?: string }) => {
      try {
        await updateMemory(memoryId, updates);
      } catch (err: any) {
        setToast({ message: 'Failed to update memory', type: 'error' });
      }
    },
    [updateMemory, setToast]
  );

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsAdding(true);
    try {
      if (currentUser) {
        await addMovie(searchQuery.trim());
        setToast({ message: `"${searchQuery.trim()}" added successfully!`, type: 'success' });
        setSearchQuery('');
      } else {
        setIsSuggesting(true);
        setSuggestionError(null);
        await addSuggestion(searchQuery.trim(), 'Anonymous');
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" suggested for review!`, type: 'success' });
        setContentTab('suggestions');
      }
      setSuccessMovieId(searchQuery.trim());
      setTimeout(() => setSuccessMovieId(null), 2000);
    } catch (err: any) {
      if (currentUser) {
        setToast({ message: `Error adding movie: ${err.message}`, type: 'error' });
      } else {
        setSuggestionError(err.message || 'Failed to suggest');
      }
    } finally {
      setIsAdding(false);
      setIsSuggesting(false);
    }
  };

  // Optimization: Index memories for O(1) lookup to prevent O(N*M) filtering in render
  const memoryIndex = useMemo(() => {
    const byId = new Map<string, SharedMemory[]>();
    const byTitle = new Map<string, SharedMemory[]>();

    memories.forEach((m) => {
      // Index by ID
      if (m.movieId) {
        const list = byId.get(m.movieId) || [];
        list.push(m);
        byId.set(m.movieId, list);
      }
      // Index by Title
      const title = m.movieTitle.toLowerCase();
      if (title) {
        const list = byTitle.get(title) || [];
        list.push(m);
        byTitle.set(title, list);
      }
    });

    return { byId, byTitle };
  }, [memories]);

  const getMovieMemories = useCallback(
    (movie: Movie) => {
      const fromId = memoryIndex.byId.get(movie.id) || [];
      const fromTitle = memoryIndex.byTitle.get(movie.title.toLowerCase()) || [];

      if (fromId.length === 0 && fromTitle.length === 0) return [];
      if (fromId.length === 0) return fromTitle;
      if (fromTitle.length === 0) return fromId;

      // Deduplicate by ID if we have matches from both sources
      const combined = new Map<string, SharedMemory>();
      fromId.forEach((m) => combined.set(m.id, m));
      fromTitle.forEach((m) => combined.set(m.id, m));

      return Array.from(combined.values());
    },
    [memoryIndex]
  );

  const renderMovieItem = (movie: Movie, index?: number) => {
    const movieMemories = getMovieMemories(movie);
    return (
      <MovieItem
        key={movie.id}
        movie={movie}
        currentUser={currentUser}
        onToggle={handleToggleWatched}
        onDelete={handleDeleteMovie}
        onFixMatch={handleFixMatch}
        animationDelay={index !== undefined ? `${index * 0.05}s` : '0s'}
        memories={movieMemories}
        onAddMemory={async (note) => {
          await addMemory(movie.id, movie.title, currentUser || 'Anonymous', note);
        }}
        onUpdateMemory={async (memoryId, note) => {
          await handleUpdateMemory(memoryId, { note });
        }}
        onDeleteMemory={async (id) => {
          await deleteMemoryRecord(id);
        }}
        onTogglePin={async (id) => {
          await toggleMemoryPin(id);
        }}
      />
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.md }}>
      {showConfetti && <Confetti isActive={showConfetti} />}

      {moviesError && (
        <div
          style={{
            background: `${colors.error}20`,
            border: `1px solid ${colors.error}`,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: colors.error, flex: 1, minWidth: 0 }}>{moviesError.message}</span>
          <Button variant="secondary" size="sm" onClick={() => refreshMovies()}>
            Retry
          </Button>
        </div>
      )}

      {/* --- Sub-nav: tabs + sort (full card so top is never cut off) --- */}
      <div
        style={{
          marginBottom: spacing.lg,
          marginTop: spacing.md,
          position: 'sticky',
          top: isMobile
            ? spacing.sm
            : `calc(${layout.topBarHeight} + ${layout.desktopNavHeight} + ${spacing.sm})`,
          zIndex: 25,
          padding: isMobile ? spacing.sm : spacing.md,
          background: 'rgba(23, 33, 58, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderSecondary}25`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? spacing.md : spacing.lg,
          }}
        >
          <SubNav
            ariaLabel="Movies: filter and sort"
            scrollClassName="watchlist-tabs-scroll"
            tabs={MOVIE_TABS.map((t) => ({
              id: t.id,
              label: t.label,
              icon: t.icon,
              count: tabCounts[t.id] ?? 0,
            }))}
            activeId={contentTab}
            onSelect={(id) => setContentTab(id as ContentTab)}
            chips={SORT_OPTIONS}
            activeChipId={sortMode}
            onChipSelect={(id) => setSortMode(id as SortMode)}
            chipLabel="Sort by"
          />

          {/* Search + Add: full-width bar */}
          <form
            onSubmit={handleAddAction}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
              background: colors.surfaceElevated,
              borderRadius: radius.lg,
              border: `1px solid ${colors.borderSecondary}35`,
              overflow: 'hidden',
              minHeight: '48px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or add a movie…"
              aria-label="Search or add a movie"
              style={{
                minHeight: '48px',
                flex: 1,
                border: 'none',
                background: 'transparent',
                paddingLeft: spacing.md,
                paddingRight: spacing.sm,
                fontSize: typography.fontSize.sm,
              }}
            />
            {searchQuery.trim() ? (
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={isAdding || isSuggesting}
                isLoading={isAdding || isSuggesting}
                style={{
                  minHeight: '48px',
                  minWidth: '56px',
                  borderRadius: 0,
                  borderLeft: `1px solid ${colors.borderSecondary}40`,
                }}
                title="Add or suggest movie"
                aria-label="Add or suggest movie"
              >
                {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
              </Button>
            ) : (
              <div
                style={{
                  padding: `0 ${spacing.md}`,
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.textTertiary,
                  opacity: 0.6,
                }}
                aria-hidden
              >
                <PlusIcon style={{ width: 20, height: 20 }} />
              </div>
            )}
          </form>
        </div>

        {suggestionError && (
          <div
            style={{
              color: colors.error,
              fontSize: typography.fontSize.xs,
              marginTop: -spacing.xs,
            }}
          >
            {suggestionError}
          </div>
        )}
      </div>

      {/* --- Content Section --- */}
      <div
        ref={movieResultsRef}
        style={{
          opacity: isSubmitting ? 0.5 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(140px, 1fr))'
              : 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: spacing.md,
            alignItems: 'start',
          }}
        >
          {isLoading && (!movies || movies.length === 0) ? (
            <>
              {contentTab === 'suggestions' && (
                <>
                  <SuggestionSkeleton />
                  <SuggestionSkeleton />
                </>
              )}
              {(isMobile ? MOBILE_SKELETON_KEYS : DESKTOP_SKELETON_KEYS).map((key) => (
                <MovieCardSkeleton key={key} />
              ))}
            </>
          ) : (
            <>
              {filteredSuggestions.map((suggestion) => (
                <SuggestionItemCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}

              {filteredMovies.map((movie, index) => renderMovieItem(movie, index))}
            </>
          )}
        </div>

        {filteredMovies.length === 0 &&
          filteredSuggestions.length === 0 &&
          !isLoading &&
          !isSuggestionsLoading && (
            <div
              style={{
                textAlign: 'center',
                padding: spacing['3xl'],
                color: colors.textSecondary,
              }}
            >
              <FilmIcon
                style={{ width: '64px', height: '64px', opacity: 0.3, marginBottom: spacing.md }}
              />
              <p
                style={{
                  fontFamily: typography.fontFamily.heading.join(', '),
                  textTransform: 'uppercase',
                  letterSpacing: typography.letterSpacing.wide,
                }}
              >
                {getEmptyStateMessage(searchQuery, contentTab)}
              </p>
              {!searchQuery && contentTab === 'all' && (
                <p style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}>
                  Try searching for a title in the bar above.
                </p>
              )}
            </div>
          )}
      </div>

      <ConfirmDialog
        isOpen={!!movieToDelete}
        title="Delete Movie"
        message={`Are you sure you want to remove "${movieToDelete?.title}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setMovieToDelete(null)}
      />
      <ConfirmDialog
        isOpen={!!suggestionToReject}
        title="Reject Suggestion"
        message={`Are you sure you want to reject "${suggestionToReject?.title}"?`}
        confirmText="Reject"
        onConfirm={confirmRejectSuggestion}
        onCancel={() => setSuggestionToReject(null)}
      />

      <FixMatchDialog
        isOpen={!!movieToFix}
        movie={movieToFix}
        onClose={() => setMovieToFix(null)}
        onRename={async (newName) => {
          if (!movieToFix) return;
          setToast({ message: `Renaming to "${newName}"...`, type: 'info' });
          const success = await manualMetadataUpdate(movieToFix, { title: newName });
          if (success) {
            setToast({ message: `Renamed to "${newName}"!`, type: 'success' });
          } else {
            setToast({ message: 'Failed to rename.', type: 'error' });
          }
        }}
        onSelect={async (metadata) => {
          if (!movieToFix) return;
          setToast({ message: `Updating details for "${movieToFix.title}"...`, type: 'info' });
          const success = await manualMetadataUpdate(movieToFix, metadata);
          if (success) {
            setToast({ message: `Updated details for "${movieToFix.title}"!`, type: 'success' });
          } else {
            setToast({ message: 'Failed to update metadata.', type: 'error' });
          }
        }}
      />
    </div>
  );
};

export default memo(Watchlist);
