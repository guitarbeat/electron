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
import MovieItem from './components/MovieItem';
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
  }, [movies, setShowConfetti, setToast]);

  // Search suggestions logic
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const movieMatches = movies
      .filter(m => m.title.toLowerCase().includes(query))
      .map(m => m.title)
      .slice(0, 3);

    const suggestionMatches = pendingSuggestions
      .filter(s => s.title.toLowerCase().includes(query))
      .map(s => s.title)
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
      await addSuggestion(searchQuery.trim(), 'Anonymous');
      setSearchQuery('');
      setToast({ message: `"${searchQuery.trim()}" suggested for review!`, type: 'success' });
      setIsSuggesting(false);
    }
  }, [searchQuery, currentUser, addMovie, addSuggestion, setIsAdding, setSearchQuery, setToast]);

  const handleSuggestionAction = useCallback(async (title: string) => {
    setSearchQuery(title);
    await handleAddAction();
  }, [setSearchQuery, handleAddAction]);

  const handleDeleteMovie = useCallback((movie: Movie) => {
    setMovieToDelete(movie);
  }, [setMovieToDelete]);

  const handleFixMatch = useCallback((movie: Movie) => {
    setMovieToFix(movie);
  }, [setMovieToFix]);

  const handleAddMemory = useCallback((movie: Movie, memory: Omit<SharedMemory, 'id'>) => {
    addMemory(movie.id, memory);
  }, [addMemory]);

  // Render functions
  const renderMovieItem = useCallback((movie: Movie, index: number) => {
    const movieMemories = memories.filter(m => m.movieId === movie.id);
    const isProcessing = processingSuggestionId === movie.id;

    return (
      <MovieItem
        key={movie.id}
        movie={movie}
        index={index}
        memories={movieMemories}
        currentUser={currentUser}
        onToggleWatched={() => toggleWatched(movie.id)}
        onDelete={() => handleDeleteMovie(movie)}
        onFixMatch={() => handleFixMatch(movie)}
        onAddMemory={(memory) => handleAddMemory(movie, memory)}
        isProcessing={isProcessing}
      />
    );
  }, [memories, currentUser, processingSuggestionId, toggleWatched, handleDeleteMovie, handleFixMatch, handleAddMemory]);

  const renderSuggestionItem = useCallback((suggestion: MovieSuggestion, index: number) => {
    return (
      <SuggestionItemCard
        key={suggestion.id}
        suggestion={suggestion}
        currentUser={currentUser}
        onAccept={() => acceptSuggestion(suggestion.id)}
        onReject={() => rejectSuggestion(suggestion.id)}
        isProcessing={processingSuggestionId === suggestion.id}
      />
    );
  }, [currentUser, acceptSuggestion, rejectSuggestion, processingSuggestionId]);

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
      <WorkspaceLayout>
        <div className="watchlist-error">
          <h2>Error loading movies</h2>
          <p>{moviesError}</p>
          <button onClick={refreshMovies}>Try again</button>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="watchlist">
        <WatchlistHeader />
        
        <div className="watchlist-top-controls-fallback">
          <WatchlistTopControls
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
          />
        </div>

        <WatchlistControls
          contentTab={contentTab}
          setContentTab={setContentTab}
          sortMode={sortMode}
          setSortMode={setSortMode}
          tabCounts={tabCounts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAdd={handleAddAction}
          isBusy={isAdding || isSuggesting}
          addLabel={currentUser ? 'Add movie' : 'Suggest movie'}
          topSuggestion={topSuggestion}
          onEnterAction="selectTopResult"
          onSelectSuggestion={handleSuggestionAction}
          suggestions={searchSuggestions}
          isMobile={isMobile}
        />

        <WatchlistContent
          isLoading={isLoading}
          isMobile={isMobile}
          filteredMovies={filteredMovies}
          filteredSuggestions={filteredSuggestions}
          contentTab={contentTab}
          renderMovieItem={renderMovieItem}
          renderSuggestionItem={renderSuggestionItem}
        />

        {filteredMovies.length === 0 && filteredSuggestions.length === 0 && !isLoading && (
          <div className="watchlist-empty-state">
            <div 
              style={{
                textAlign: 'center',
                padding: spacing['3xl'],
                color: colors.textSecondary,
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>
                {contentTab === 'suggestions' ? '💡' : '🎬'}
              </div>
              <h3 style={{ margin: `0 0 ${spacing.md}`, color: colors.textPrimary }}>
                {getEmptyStateMessage().split('.')[0]}
              </h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                {getEmptyStateMessage().split('.')[1] || getEmptyStateMessage()}
              </p>
            </div>
          </div>
        )}

        <WatchlistDialogs
          movieToDelete={movieToDelete}
          setMovieToDelete={setMovieToDelete}
          fixMatchDialogMovie={movieToFix}
          setFixMatchDialogMovie={setMovieToFix}
          successMovieId={showConfetti ? 'confetti-trigger' : null}
          setSuccessMovieId={setSuccessMovieId}
        />
      </div>
    </WorkspaceLayout>
  );
};

export default memo(Watchlist);
