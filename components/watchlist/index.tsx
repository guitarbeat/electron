import React, { memo, useCallback, useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import FixMatchDialog from '../FixMatchDialog';
import Confetti from '../effects/Confetti';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { PlusIcon, Spinner, FilmIcon } from '../icons';
import MasonryGrid from '../ui/MasonryGrid';
import MovieItem from '../MovieItem';
import { SuggestionItemCard } from '../DashboardCards';
import { useWatchlist } from './hooks/useWatchlist';
import { WatchlistProps, SortMode, ContentTab } from './types';
import { Movie, MovieSuggestion, SharedMemory } from '../../types';
import { spacing, colors, radius, typography, shadows } from '../../design-system/tokens';

const TABS: { label: string; value: ContentTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Queue', value: 'to-watch' },
  { label: 'Watched', value: 'watched' },
  { label: 'Suggestions', value: 'suggestions' },
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
    viewMode,
    setViewMode,
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    setActiveMemoryFilter,
    showMemoriesOnly,
    setShowMemoriesOnly,
    setIsMemoryWallCollapsed,
    highlightMovieId,
    setHighlightMovieId,
    previousMoviesRef,
    memorySectionRef,
    movieResultsRef,

    // Data returns
    movies,
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

  const handleJumpFromMemory = useCallback(
    (memory: SharedMemory) => {
      const targetMovie =
        (movies || []).find((m) => m.id === memory.movieId) ||
        (movies || []).find(
          (m) => m.title.trim().toLowerCase() === memory.movieTitle.trim().toLowerCase()
        );

      if (!targetMovie) {
        setToast({ message: 'Movie is no longer in the queue.', type: 'info' });
        return;
      }

      setShowMemoriesOnly(false);
      setContentTab('watched');
      setSearchQuery('');
      setHighlightMovieId(targetMovie.id);

      requestAnimationFrame(() => {
        const el = movieResultsRef.current?.querySelector(`[data-movie-id="${targetMovie.id}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.animate(
            [
              { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
              { transform: 'scale(1.02)', boxShadow: '0 0 20px rgba(255,215,0,0.3)' },
              { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
            ],
            { duration: 1000, easing: 'ease-out' }
          );
        }
      });

      setTimeout(() => setHighlightMovieId(null), 2000);
    },
    [
      movies,
      setContentTab,
      setSearchQuery,
      setHighlightMovieId,
      setShowMemoriesOnly,
      setToast,
      movieResultsRef,
    ]
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
        layout={viewMode}
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
        isHighlighted={highlightMovieId === movie.id}
      />
    );
  };

  let toastBgColor: string = colors.accent;
  if (toast?.type === 'error') toastBgColor = colors.error;
  else if (toast?.type === 'success') toastBgColor = colors.success;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.md }}>
      {showConfetti && <Confetti isActive={showConfetti} />}

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

      {/* --- Controls Section (inside unified panel) --- */}
      <div
        style={{
          padding: isMobile ? spacing.sm : spacing.md,
          marginBottom: spacing.xl,
          marginTop: `-${spacing.md}`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          background: 'rgba(23, 33, 58, 0.5)',
          backdropFilter: 'blur(12px)',
          borderRadius: `0 0 ${spacing.md} ${spacing.md}`,
          border: `1px solid ${colors.borderSecondary}25`,
          borderTop: `1px solid ${colors.borderSecondary}15`,
          fontFamily: typography.fontFamily.body.join(', '),
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: spacing.xs,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              flex: isMobile ? '1 1 100%' : '0 0 auto',
              paddingBottom: isMobile ? spacing.xs : 0,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setContentTab(tab.value)}
                style={{
                  padding: `${spacing.xs} ${spacing.md}`,
                  borderRadius: radius.full,
                  border: `1px solid ${contentTab === tab.value ? colors.accent : 'transparent'}`,
                  background:
                    contentTab === tab.value ? colors.accent : 'rgba(255, 255, 255, 0.05)',
                  color: contentTab === tab.value ? '#000' : colors.textSecondary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: typography.fontFamily.heading.join(', '),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  boxShadow: contentTab === tab.value ? `0 0 12px ${colors.accent}40` : 'none',
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    background:
                      contentTab === tab.value ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                    padding: '2px 8px',
                    borderRadius: radius.sm,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {tabCounts[tab.value] || 0}
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              flex: '1 1 auto',
              minWidth: isMobile ? '100%' : '0',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <form
              onSubmit={handleAddAction}
              style={{
                flex: 1,
                display: 'flex',
                gap: 0,
                alignItems: 'center',
                background: colors.surfaceElevated,
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}40`,
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or add a movie..."
                aria-label="Search or add a movie"
                style={{
                  height: '48px',
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  paddingLeft: spacing.md,
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
                    height: '48px',
                    minWidth: '60px',
                    borderRadius: 0,
                    borderLeft: `1px solid ${colors.borderSecondary}40`,
                  }}
                  title="Add or Suggest"
                >
                  {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
                </Button>
              ) : (
                <div style={{ paddingRight: spacing.md, color: colors.textTertiary, opacity: 0.5 }}>
                  <PlusIcon style={{ width: '18px', height: '18px' }} />
                </div>
              )}
            </form>

            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                flex: isMobile ? 'none' : '0 0 auto',
                alignItems: 'center',
              }}
            >
              {/* View Mode Toggle */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: radius.md,
                  padding: '4px',
                  border: `1px solid ${colors.borderSecondary}40`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List View"
                  style={{
                    background: viewMode === 'list' ? colors.surfaceElevated : 'transparent',
                    border: 'none',
                    borderRadius: radius.sm,
                    padding: '8px',
                    color: viewMode === 'list' ? colors.accent : colors.textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'list' ? shadows.card : 'none',
                  }}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  style={{
                    background: viewMode === 'grid' ? colors.surfaceElevated : 'transparent',
                    border: 'none',
                    borderRadius: radius.sm,
                    padding: '8px',
                    color: viewMode === 'grid' ? colors.accent : colors.textSecondary,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: viewMode === 'grid' ? shadows.card : 'none',
                  }}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                aria-label="Sort movies"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '48px',
                  minWidth: isMobile ? '100%' : '160px',
                  flex: 1,
                  borderRadius: radius.md,
                  border: `1px solid ${colors.borderSecondary}40`,
                  backgroundColor: colors.surfaceElevated,
                  color: colors.textPrimary,
                  padding: `0 ${spacing.sm}`,
                  fontFamily: typography.fontFamily.heading.join(', '),
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textSecondary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                }}
              >
                <option value="recent">Recently Added</option>
                <option value="title">Title A-Z</option>
                <option value="year">Year (Newest)</option>
              </select>
            </div>
          </div>
        </div>
        {suggestionError && (
          <div style={{ color: colors.error, fontSize: '12px', marginTop: spacing.xs }}>
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
        {viewMode === 'grid' ? (
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

            {filteredMovies.map((movie) => renderMovieItem(movie))}
          </MasonryGrid>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {(contentTab === 'all' || contentTab === 'suggestions') &&
              filteredSuggestions.map((suggestion) => (
                <SuggestionItemCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAcceptSuggestion}
                  onReject={(s) => handleRejectSuggestion(s.id)}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}

            {filteredMovies.map((movie, index) => renderMovieItem(movie, index))}
          </div>
        )}

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
                {searchQuery
                  ? 'No results match your search.'
                  : contentTab === 'suggestions'
                    ? 'No pending suggestions right now.'
                    : 'No movies in this section yet.'}
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
