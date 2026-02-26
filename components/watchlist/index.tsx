import React, { memo, useCallback, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import FixMatchDialog from '../common/FixMatchDialog';
import Confetti from '../effects/Confetti';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, Spinner, FilmIcon } from '../common/icons';
import MasonryGrid from '../ui/MasonryGrid';
import MovieItem from '../common/MovieItem';
import { SuggestionItemCard } from '../common/DashboardCards';
import { useWatchlist } from './hooks/useWatchlist';
import { WatchlistProps, SortMode, ContentTab } from './types';
import { getEmptyStateMessage } from './utils';
import { Movie, MovieSuggestion, SharedMemory } from '../../types';
import { spacing, colors, radius, typography } from '../../design-system/tokens';
import './Watchlist.css';

const TABS: { label: string; value: ContentTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Queue', value: 'to-watch' },
  { label: 'Watched', value: 'watched' },
  { label: 'Suggestions', value: 'suggestions' },
];

const SORT_OPTIONS: { label: string; value: SortMode }[] = [
  { label: 'Recent', value: 'recent' },
  { label: 'A–Z', value: 'title' },
  { label: 'Year', value: 'year' },
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
    toast,
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
    setActiveMemoryFilter,
    setIsMemoryWallCollapsed,
    previousMoviesRef,
    memorySectionRef,
    movieResultsRef,

    // Data returns
    movies,
    moviesError,
    refreshMovies,
    addMovie,
    toggleWatched,
    deleteMovie,
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
    movieMemorySummaries,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
    isSubmitting,
  } = useWatchlist({ currentUser, isPaused });

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

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
    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `Deleted "${movieToDelete.title}"`, type: 'success' });
      setMovieToDelete(null);
    } catch (err: any) {
      setToast({ message: `Failed to delete: ${err.message}`, type: 'error' });
    }
  }, [movieToDelete, deleteMovie, setToast, setMovieToDelete]);

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
    async (suggestionId: string) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      // eslint-disable-next-line no-restricted-globals, no-alert
      if (!confirm('Reject this suggestion?')) return;

      setProcessingSuggestionId(suggestionId);
      try {
        await rejectSuggestion(suggestionId, currentUser);
        setToast({ message: 'Suggestion removed', type: 'info' });
      } catch (err: any) {
        setToast({ message: 'Failed to reject suggestion', type: 'error' });
      } finally {
        setProcessingSuggestionId(null);
      }
    },
    [currentUser, rejectSuggestion, setToast, setProcessingSuggestionId, showGuestWarning]
  );

  const handleJumpToMovieMemories = useCallback(
    (movie: Movie) => {
      setActiveMemoryFilter(movie.id);
      setIsMemoryWallCollapsed(false);
      memorySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    [setActiveMemoryFilter, setIsMemoryWallCollapsed, memorySectionRef]
  );

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

  const renderMovieItem = (movie: Movie, index?: number) => {
    const movieMemories = memories.filter(
      (m) => m.movieId === movie.id || m.movieTitle.toLowerCase() === movie.title.toLowerCase()
    );
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

  let toastBgColor: string = colors.accent;
  if (toast?.type === 'error') toastBgColor = colors.error;
  else if (toast?.type === 'success') toastBgColor = colors.success;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.md }}>
      {showConfetti && <Confetti isActive={showConfetti} />}

      {moviesError && (
        <div
          style={{
            background: colors.error + '20',
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
          <span style={{ color: colors.error, flex: 1, minWidth: 0 }}>
            {moviesError.message}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refreshMovies()}
          >
            Retry
          </Button>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: spacing.xl,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: toastBgColor,
            color: '#fff',
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: radius.full,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* --- Controls: tabs, search, sort (mobile-first) --- */}
      <div
        role="region"
        aria-label="Watchlist filters and sort"
        style={{
          marginBottom: spacing.xl,
          marginTop: `-${spacing.md}`,
          padding: isMobile ? spacing.sm : spacing.md,
          background: 'rgba(23, 33, 58, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
          border: `1px solid ${colors.borderSecondary}20`,
          borderTop: 'none',
          fontFamily: typography.fontFamily.body.join(', '),
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? spacing.md : spacing.lg,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Tabs: horizontal scroll, pill style, 44px min touch target */}
        <div
          style={{
            display: 'flex',
            gap: spacing.xs,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            paddingBottom: spacing.xs,
            minHeight: '44px',
            alignItems: 'center',
          }}
          className="watchlist-tabs-scroll"
        >
          {TABS.map((tab) => {
            const isActive = contentTab === tab.value;
            const count = tabCounts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setContentTab(tab.value)}
                aria-pressed={isActive}
                aria-label={`${tab.label}, ${count} items`}
                style={{
                  flex: '0 0 auto',
                  minHeight: '44px',
                  minWidth: isMobile ? '72px' : '80px',
                  padding: `0 ${isMobile ? spacing.sm : spacing.md}`,
                  borderRadius: radius.full,
                  border: `2px solid ${isActive ? colors.accent : 'transparent'}`,
                  background: isActive
                    ? `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`
                    : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#1a1a2e' : colors.textSecondary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  fontFamily: typography.fontFamily.heading.join(', '),
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  boxShadow: isActive ? '0 0 16px rgba(255,105,180,0.35)' : 'none',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isActive ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)',
                    padding: '2px 6px',
                    borderRadius: radius.sm,
                    minWidth: '18px',
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

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

        {/* Sort: chip group (one-tap, no dropdown) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.xs,
            alignItems: 'center',
          }}
          role="group"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((opt) => {
            const isActive = sortMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortMode(opt.value)}
                aria-pressed={isActive}
                aria-label={`Sort by ${opt.label}`}
                style={{
                  minHeight: '40px',
                  padding: `0 ${spacing.sm}`,
                  borderRadius: radius.md,
                  border: `1px solid ${isActive ? colors.secondary : colors.borderSecondary}40`,
                  background: isActive ? colors.secondaryMuted : 'rgba(255,255,255,0.04)',
                  color: isActive ? colors.secondary : colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: typography.fontFamily.body.join(', '),
                }}
              >
                {opt.label}
              </button>
            );
          })}
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
        <MasonryGrid>
          {filteredSuggestions.map((suggestion) => (
            <SuggestionItemCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={handleAcceptSuggestion}
              onReject={(s) => handleRejectSuggestion(s.id)}
              isProcessing={processingSuggestionId === suggestion.id}
            />
          ))}

          {filteredMovies.map((movie, index) => renderMovieItem(movie, index))}
        </MasonryGrid>

        {filteredMovies.length === 0 &&
          filteredSuggestions.length === 0 &&
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
