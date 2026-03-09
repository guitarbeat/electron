import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useWatchlist } from './hooks/useWatchlist';
import { Movie, MovieSuggestion, WatchlistProps } from '@/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';

// Components
import WatchlistTopControls from './components/controls/WatchlistTopControls';
import MovieCard from './components/MovieCard';

// Styles
import './Watchlist.css';

const renderWorkspace = ({
  isMobile,
  controls,
  content,
}: {
  isMobile: boolean;
  controls: React.ReactNode;
  content: React.ReactNode;
}) => {
  if (isMobile) {
    return (
      <div className="workspace-layout workspace-layout--mobile">
        <div className="workspace-layout__content">{content}</div>
      </div>
    );
  }

  return (
    <div className="workspace-layout">
      <aside className="workspace-layout__controls" aria-label="Watchlist controls">
        {controls}
      </aside>
      <section className="workspace-layout__content" aria-label="Watchlist content">
        {content}
      </section>
    </div>
  );
};

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
  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : [
        'desktop-1',
        'desktop-2',
        'desktop-3',
        'desktop-4',
        'desktop-5',
        'desktop-6',
        'desktop-7',
        'desktop-8',
      ];

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

      return (
        <MovieCard
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
              createdAt: new Date().toISOString(),
            });
          }}
        />
      );
    },
    [
      memories,
      currentUser,
      filteredMovies,
      toggleWatched,
      handleDeleteMovie,
      handleFixMatch,
      handleAddMemory,
    ]
  );

  const renderSuggestionItem = useCallback(
    (suggestion: MovieSuggestion) => {
      const isProcessing = processingSuggestionId === suggestion.id;

      return (
        <article key={suggestion.id} className="suggestion-item-card">
          <h3 className="suggestion-item-card__title">{suggestion.title}</h3>
          <p className="suggestion-item-card__meta">
            Suggested by {suggestion.suggestedBy} on{' '}
            {new Date(suggestion.createdAt).toLocaleDateString()}
          </p>
          {suggestion.reason ? (
            <p className="suggestion-item-card__reason">{suggestion.reason}</p>
          ) : null}

          {currentUser ? (
            <div className="suggestion-item-card__actions">
              <button
                type="button"
                className="suggestion-item-card__button is-accept"
                disabled={isProcessing}
                onClick={async () => {
                  if (!currentUser) return;
                  setProcessingSuggestionId(suggestion.id);
                  try {
                    await addMovie(suggestion.title);
                    await acceptSuggestion(suggestion.id, currentUser);
                    setToast({ message: `Added "${suggestion.title}"`, type: 'success' });
                  } finally {
                    setProcessingSuggestionId(null);
                  }
                }}
              >
                {isProcessing ? 'Adding…' : 'Accept'}
              </button>
              <button
                type="button"
                className="suggestion-item-card__button is-reject"
                disabled={isProcessing}
                onClick={async () => {
                  if (!currentUser) return;
                  setProcessingSuggestionId(suggestion.id);
                  try {
                    await rejectSuggestion(suggestion.id, currentUser);
                    setToast({ message: `Rejected "${suggestion.title}"`, type: 'info' });
                  } finally {
                    setProcessingSuggestionId(null);
                  }
                }}
              >
                Reject
              </button>
            </div>
          ) : null}
        </article>
      );
    },
    [
      acceptSuggestion,
      addMovie,
      currentUser,
      processingSuggestionId,
      rejectSuggestion,
      setProcessingSuggestionId,
      setToast,
    ]
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

  const moviesErrorMessage =
    moviesError instanceof Error
      ? moviesError.message
      : typeof moviesError === 'string'
        ? moviesError
        : 'Unable to load movies right now.';

  if (moviesError) {
    return (
      <>
        {renderWorkspace({
          isMobile,
          controls: (
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
          ),
          content: (
            <div className="watchlist-error">
              <h2>Error loading movies</h2>
              <p>{moviesErrorMessage}</p>
              <button onClick={refreshMovies}>Try again</button>
            </div>
          ),
        })}
      </>
    );
  }

  return (
    <>
      {renderWorkspace({
        isMobile,
        controls: (
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
        ),
        content: (
          <div className="watchlist">
            <header className="watchlist-header">
              <h1 className="watchlist-title">Watchlist</h1>
            </header>

            {!isLoading && filteredMovies.length === 0 && filteredSuggestions.length === 0 ? (
              <div
                className="watchlist-empty-state"
                style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}
              >
                <p>{getEmptyStateMessage()}</p>
              </div>
            ) : isLoading ? (
              <div className="watchlist-content">
                {skeletonKeys.map((key) => (
                  <MovieCardSkeleton key={key} />
                ))}
              </div>
            ) : contentTab === 'suggestions' ? (
              <div className="watchlist-content">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestion) => renderSuggestionItem(suggestion))
                ) : (
                  <div className="watchlist-empty-state">
                    <p>No suggestions available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="watchlist-content">
                {filteredMovies.length > 0 ? (
                  filteredMovies.map((movie) => renderMovieItem(movie))
                ) : (
                  <div className="watchlist-empty-state">
                    <p>No movies found</p>
                  </div>
                )}
              </div>
            )}

            {movieToDelete && (
              <ConfirmDialog
                isOpen={!!movieToDelete}
                onCancel={() => setMovieToDelete(null)}
                title="Delete Movie"
                message={`Are you sure you want to delete "${movieToDelete.title}"?`}
                onConfirm={async () => {
                  try {
                    await deleteMovie(movieToDelete.id);
                    setToast({ message: `Deleted "${movieToDelete.title}"`, type: 'info' });
                  } catch (error) {
                    setToast({ message: 'Failed to delete movie', type: 'error' });
                  } finally {
                    setMovieToDelete(null);
                  }
                }}
              />
            )}

            {movieToFix && (
              <div className="fix-match-dialog-overlay">
                <div className="fix-match-dialog">
                  <h2 className="text-lg font-semibold mb-4">Fix Match</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to fix the match for &quot;{movieToFix.title}&quot;?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setMovieToFix(null)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showConfetti && (
              <Confetti isActive={showConfetti} onComplete={() => setSuccessMovieId(null)} />
            )}
          </div>
        ),
      })}
    </>
  );
};

export default memo(Watchlist);
