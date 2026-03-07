import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useWatchlist } from './hooks/useWatchlist';
import { WatchlistProps } from './types';
import WorkspaceLayout from '@/layout/WorkspaceLayout';
import { Movie, MovieSuggestion, SharedMemory } from '@/types';
import { spacing, colors, radius, typography } from '@/design-system/tokens';

// Components
import {
  WatchlistHeader,
  WatchlistTopControls,
  WatchlistContent,
  WatchlistDialogs,
} from './components';
import WatchlistControls from './WatchlistControls';
import MovieItem from '@/components/movie/MovieItem';
import { SuggestionItemCard } from '@/common/DashboardCards';

// Styles
import './Watchlist.css';

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
    pendingSuggestions,
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
  }, [movies, setShowConfetti, setToast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search suggestions logic
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const movieMatches = movies
      .filter((m) => m.title.toLowerCase().includes(query))
      .map((m) => m.title)
      .slice(0, 3);

    const suggestionMatches = pendingSuggestions
      .filter((s) => s.title.toLowerCase().includes(query))
      .map((s) => s.title)
      .slice(0, 3);

    const deduped = Array.from(new Set([...movieMatches, ...suggestionMatches]));
    return deduped.slice(0, 6);
  }, [movies, pendingSuggestions, searchQuery]);

  const topSuggestion = searchSuggestions[0] || null;

  // Event handlers
  const handleAddAction = useCallback(async () => {
    if (!searchQuery.trim()) return;

    if (currentUser) {
      setIsAdding(true);
      try {
        await addMovie(searchQuery.trim());
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" added to watchlist!`, type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to add movie', type: 'error' });
      } finally {
        setIsAdding(false);
      }
    } else {
      setIsSuggesting(true);
      setSuggestionError(null);
      try {
        await addSuggestion(searchQuery.trim(), 'Anonymous');
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" suggested for review!`, type: 'success' });
      } catch (error) {
        setSuggestionError(error instanceof Error ? error.message : 'Failed to add suggestion');
        setToast({ message: 'Failed to add suggestion', type: 'error' });
      } finally {
        setIsSuggesting(false);
      }
    }
  }, [searchQuery, currentUser, addMovie, addSuggestion, setIsAdding, setSearchQuery, setToast]);

  const handleSuggestionAction = useCallback(
    async (title: string) => {
      setSearchQuery(title);
      await handleAddAction();
    },
    [setSearchQuery, handleAddAction]
  );

  const handleDeleteMovie = useCallback(
    (movie: Movie) => {
      setMovieToDelete(movie);
    },
    [setMovieToDelete]
  );

  const handleFixMatch = useCallback(
    (movie: Movie) => {
      setMovieToFix(movie);
    },
    [setMovieToFix]
  );

  const handleAddMemory = useCallback(
    async (movie: Movie, memory: { note: string; createdAt?: string }) => {
      await addMemory(movie.id, movie.title, currentUser || 'Unknown', memory.note);
    },
    [addMemory, currentUser]
  );

  // Render functions
  const renderMovieItem = useCallback(
    (movie: Movie) => {
      const movieMemories = memories.filter((m) => m.movieId === movie.id);
      const isProcessing = processingSuggestionId === movie.id;

      return (
        <MovieItem
          animationDelay={`${Math.min(filteredMovies.findIndex((m) => m.id === movie.id) * 0.05, 0.5)}s`}
          key={movie.id}
          movie={movie}
          memories={movieMemories}
          currentUser={currentUser}
          onToggle={() => toggleWatched(movie.id)}
          onDelete={() => handleDeleteMovie(movie)}
          onFixMatch={() => handleFixMatch(movie)}
          onAddMemory={async (note: string) => {
            await handleAddMemory(movie, {
              note,
              createdAt: new Date().toISOString()
            });
          }}
        />
      );
    },
    [
      memories,
      currentUser,
      processingSuggestionId,
      toggleWatched,
      handleDeleteMovie,
      handleFixMatch,
      handleAddMemory,
    ]
  );

  const renderSuggestionItem = useCallback(
    (suggestion: MovieSuggestion, index: number) => {
      return (
        <SuggestionItemCard
          key={suggestion.id}
          suggestion={suggestion}
        />
      );
    },
    []
  );

  const getEmptyStateMessage = useCallback(() => {
    if (contentTab === 'suggestions') {
      return 'No movie suggestions yet. Be the first to suggest something!';
    }

    if (searchQuery) {
      return `No movies found matching "${searchQuery}"`;
    }

    switch (contentTab) {
      case 'to-watch':
        return 'No movies in your queue. Add some movies to get started!';
      case 'watched':
        return 'No watched movies yet. Start watching and mark them as complete!';
      default:
        return 'No movies in your watchlist. Add your first movie to get started!';
    }
  }, [contentTab, searchQuery]);

  if (moviesError) {
    return (
      <WorkspaceLayout
        isMobile={isMobile}
        controls={<WatchlistTopControls
          contentTab={contentTab}
          setContentTab={setContentTab}
          sortMode={sortMode}
          setSortMode={setSortMode}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSubmit={handleAddAction}
          isAdding={isAdding}
          isSuggesting={isSuggesting}
          isMobile={isMobile}
          suggestionError={suggestionError}
        />}
        content={<div className="watchlist-error">
          <h2>Error loading movies</h2>
          <p>{moviesError}</p>
          <button onClick={refreshMovies}>Try again</button>
        </div>}
      />
    );
  }

  return (
    <WorkspaceLayout
      isMobile={isMobile}
      controls={<WatchlistTopControls
        contentTab={contentTab}
        setContentTab={setContentTab}
        sortMode={sortMode}
        setSortMode={setSortMode}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleAddAction}
        isAdding={isAdding}
        isSuggesting={isSuggesting}
        isMobile={isMobile}
        suggestionError={suggestionError}
      />}
      content={<div className="watchlist">
        <WatchlistHeader />

        {!isLoading && filteredMovies.length === 0 && filteredSuggestions.length === 0 ? (
          <div className="watchlist-empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>{getEmptyStateMessage()}</p>
          </div>
        ) : (
          <WatchlistContent
            isLoading={isLoading}
            isMobile={isMobile}
            filteredMovies={filteredMovies}
            filteredSuggestions={filteredSuggestions}
            contentTab={contentTab}
            renderMovieItem={renderMovieItem}
            renderSuggestionItem={renderSuggestionItem}
          />
        )}

        <WatchlistDialogs
          movieToDelete={movieToDelete}
          setMovieToDelete={setMovieToDelete}
          fixMatchDialogMovie={movieToFix}
          setFixMatchDialogMovie={setMovieToFix}
          successMovieId={showConfetti ? 'confetti-trigger' : null}
          setSuccessMovieId={setSuccessMovieId}
        />
      </div>}
    />
  );
};

export default memo(Watchlist);
