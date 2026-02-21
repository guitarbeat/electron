import React, { memo, useCallback, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import ConfirmDialog from '../ui/ConfirmDialog';
import FixMatchDialog from '../FixMatchDialog';
import Confetti from '../effects/Confetti';
import { WatchlistControls } from './components/WatchlistControls';
import { WatchlistContent } from './components/WatchlistContent';
import { useWatchlistState } from './hooks/useWatchlistState';
import { useWatchlistData } from './hooks/useWatchlistData';
import { WatchlistProps } from './types';
import { Movie, MovieSuggestion, SharedMemory } from '../../types';
import { spacing, colors, radius } from '../../design-system/tokens';

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();

  const {
    isMobile,
    newMovieTitle,
    setNewMovieTitle,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    toast,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    setProcessingSuggestionId,
    viewMode,
    setViewMode,
    contentTab,
    setContentTab,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    activeMemoryFilter,
    setActiveMemoryFilter,
    showMemoriesOnly,
    setShowMemoriesOnly,
    isMemoryWallCollapsed,
    setIsMemoryWallCollapsed,
    highlightMovieId,
    setHighlightMovieId,
    previousMoviesRef,
    memorySectionRef,
    movieResultsRef,
  } = useWatchlistState();

  const {
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
    isMemoriesLoading,
    memoriesError,
    watchedMovies,
    movieMemorySummaries,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
    isSubmitting,
  } = useWatchlistData({
    currentUser,
    isPaused,
    sortMode,
    contentTab,
    searchQuery,
    showMemoriesOnly,
  });

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

      <WatchlistControls
        contentTab={contentTab}
        setContentTab={setContentTab}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortMode={sortMode}
        setSortMode={setSortMode}
        showMemoriesOnly={showMemoriesOnly}
        setShowMemoriesOnly={setShowMemoriesOnly}
        memoriesCount={memories.length}
        isMobile={isMobile}
        onAddMovie={async (title) => {
          if (!title) return;
          setIsAdding(true);
          try {
            if (currentUser) {
              await addMovie(title);
              setToast({ message: `"${title}" added successfully!`, type: 'success' });
            } else {
              await addSuggestion(title, 'Anonymous');
              setToast({ message: `"${title}" suggested for review!`, type: 'success' });
              setContentTab('suggestions');
            }
            setSuccessMovieId(title);
            setTimeout(() => setSuccessMovieId(null), 2000);
          } catch (err: any) {
            setToast({
              message: currentUser
                ? `Error adding movie: ${err.message}`
                : `Failed to add suggestion: ${err.message}`,
              type: 'error',
            });
          } finally {
            setIsAdding(false);
          }
        }}
        isAdding={isAdding}
      />

      <WatchlistContent
        viewMode={viewMode}
        filteredMovies={filteredMovies}
        filteredSuggestions={filteredSuggestions}
        isSuggestionsLoading={isSuggestionsLoading}
        currentUser={currentUser}
        onToggleWatched={handleToggleWatched}
        onDeleteMovie={handleDeleteMovie}
        onFixMatch={handleFixMatch}
        onMemoryClick={handleJumpToMovieMemories}
        movieMemorySummaries={movieMemorySummaries}
        highlightMovieId={highlightMovieId}
        onAcceptSuggestion={handleAcceptSuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        processingSuggestionId={processingSuggestionId}
        contentTab={contentTab}
        searchQuery={searchQuery}
        isSubmitting={isSubmitting}
        movieResultsRef={movieResultsRef}
        onAddMemory={addMemory}
        onUpdateMemory={handleUpdateMemory}
        onDeleteMemory={async (id) => {
          await deleteMemoryRecord(id);
        }}
        onToggleMemoryPin={async (id) => {
          await toggleMemoryPin(id);
        }}
        memories={memories}
      />

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
