import React, { memo, useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context';
import { useWatchlist } from './useWatchlist';
import { WatchlistProps } from '@/types';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import CollectionEmptyState from '@/ui/CollectionEmptyState';
import CollectionGrid from '@/ui/CollectionGrid';
import WorkspacePanels from '@/ui/WorkspacePanels';
import { colors, spacing, typography, motion } from '@/design-system';

// Components
import WatchlistTopControls from './components/WatchlistTopControls';
import MovieCard from './components/MovieCard';
import SuggestionCard from './components/SuggestionCard';

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setProcessingSuggestionId,
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    movieToFix,
    setMovieToFix,
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
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    // pendingSuggestions, // Already used through filteredSuggestions
    // memories,
    // addMemory,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
  } = useWatchlist({ currentUser, isPaused });

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : ['desktop-1', 'desktop-2', 'desktop-3', 'desktop-4', 'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8'];

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

  // Event handlers
  const handleAddAction = useCallback(async () => {
    if (!searchQuery.trim()) return;

    if (currentUser) {
      setIsAdding(true);
      try {
        await addMovie(searchQuery.trim());
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" added to watchlist!`, type: 'success' });
      } catch {
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
      } catch (_error) {
        setSuggestionError(_error instanceof Error ? _error.message : 'Failed to add suggestion');
        setToast({ message: 'Failed to add suggestion', type: 'error' });
      } finally {
        setIsSuggesting(false);
      }
    }
  }, [searchQuery, currentUser, addMovie, addSuggestion, setIsAdding, setSearchQuery, setToast]);

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

  // Render components
  const renderControls = () => (
    <WatchlistTopControls
      contentTab={contentTab}
      setContentTab={setContentTab}
      sortMode={sortMode}
      setSortMode={setSortMode}
      tabCounts={tabCounts}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSubmit={handleAddAction}
      onPickRandom={handleRandomMoviePick}
      canSurprise={filteredMovies.length > 0 || filteredSuggestions.length > 0}
      isAdding={isAdding}
      isSuggesting={isSuggesting}
      suggestionError={suggestionError}
    />
  );

  const renderContent = () => (
    <CollectionGrid
      className="watchlist-content"
      minColumnWidth={isMobile ? '150px' : '160px'}
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
            {skeletonKeys.map((key) => <MovieCardSkeleton key={key} />)}
          </div>
        </div>
      ) : contentTab === 'suggestions' ? (
        filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => acceptSuggestion(suggestion.id, currentUser || 'Aaron')}
              onReject={() => rejectSuggestion(suggestion.id, currentUser || 'Aaron')}
              isProcessing={processingSuggestionId === suggestion.id}
              animationDelay={`${index * 0.05}s`}
            />
          ))
        ) : (
          <CollectionEmptyState
            padding={spacing['2xl']}
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
            onFixMatch={() => setMovieToFix(movie)}
            animationDelay={`${index * 0.05}s`}
          />
        )
      )) : (
        <CollectionEmptyState
          padding={spacing['2xl']}
          style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
        >
          {searchQuery ? 'No matching movies found' : 'Your watchlist is empty'}
        </CollectionEmptyState>
      )}
    </CollectionGrid>
  );

  return (
    <div className="watchlist-container" style={{ position: 'relative' }}>
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      <WorkspacePanels
        isMobile={isMobile}
        first={renderControls()}
        second={renderContent()}
        firstAs="aside"
        secondAs="section"
        stickyFirst
        mobileGap={spacing.lg}
      />

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
