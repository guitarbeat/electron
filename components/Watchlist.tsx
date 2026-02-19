import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import FixMatchDialog from './FixMatchDialog';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { useMemories } from '../hooks/useMemories';
import { useSuggestions } from '../hooks/useSuggestions';
import { Movie, MovieSuggestion, SharedMemory } from '../types';
import { PlusIcon, DiceIcon, FilmIcon, LockIcon, LayoutGridIcon, LayoutListIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import ConfirmDialog from './ui/ConfirmDialog';
import MovieItem from './MovieItem';
import MasonryGrid from './ui/MasonryGrid';
import Confetti from './effects/Confetti';
import { SuggestionItemCard } from './DashboardCards';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import {
  getMemoryMovieKey,
  getFallbackMovieKey,
  sortMemories
} from './memories/memoryUtils';

type ContentTab = 'all' | 'to-watch' | 'watched' | 'suggestions';
type SortMode = 'recent' | 'title' | 'year';
const MAX_SUGGESTION_TITLE_LENGTH = 120;

interface WatchlistProps {
  isPaused?: boolean;
}

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const {
    movies,
    isLoading,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    refresh: refreshMovies,
    manualMetadataUpdate,
  } = useMovies(currentUser, isPaused);
  const {
    pendingSuggestions,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    isLoading: isSuggestionsLoading,
  } = useSuggestions(isPaused);
  const {
    memories,
    addMemory,
    updateMemory,
    deleteMemory: deleteMemoryRecord,
    toggleMemoryPin,
    isLoading: isMemoriesLoading,
    error: memoriesError,
  } = useMemories(isPaused);

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [contentTab, setContentTab] = useState<ContentTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMemoriesOnly, setShowMemoriesOnly] = useState(false);
  const [highlightMovieId, setHighlightMovieId] = useState<string | null>(null);
  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const movieResultsRef = useRef<HTMLDivElement | null>(null);

  const showGuestWarning = useCallback(() => {
    setToast({
      message: 'Please select a profile above to make changes!',
      type: 'info',
    });
  }, []);

  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length < 2) : []),
    [movies]
  );
  const watchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length === 2) : []),
    [movies]
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const movieMemoriesMap = useMemo(() => {
    if (!movies) return new Map();
    const groupedByKey = new Map<string, SharedMemory[]>();

    memories.forEach((memory) => {
      const key = getMemoryMovieKey(memory);
      const list = groupedByKey.get(key) || [];
      list.push(memory);
      groupedByKey.set(key, list);
    });

    const resultMap = new Map<string, SharedMemory[]>();

    movies.forEach((movie) => {
      const movieKeys = [movie.id, getFallbackMovieKey(movie.title)];
      const merged = new Map<string, SharedMemory>();

      movieKeys.forEach((key) => {
        const memoriesForKey = groupedByKey.get(key) || [];
        memoriesForKey.forEach((memory) => {
          merged.set(memory.id, memory);
        });
      });

      resultMap.set(movie.id, sortMemories(Array.from(merged.values()), 'newest'));
    });

    return resultMap;
  }, [movies, memories]);

  const memoryErrorMessage =
    memoriesError instanceof Error
      ? memoriesError.message
      : memoriesError
        ? String(memoriesError)
        : null;

  const sortedMovies = useMemo(() => {
    if (!movies) return [];
    const next = [...movies];
    switch (sortMode) {
      case 'title':
        next.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'year':
        next.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
        break;
      case 'recent':
      default:
        break;
    }
    return next;
  }, [movies, sortMode]);

  const filteredMovies = useMemo(() => {
    return sortedMovies.filter((movie) => {
      const inTab =
        contentTab === 'all' ||
        (contentTab === 'to-watch' && movie.watchedBy.length < 2) ||
        (contentTab === 'watched' && movie.watchedBy.length === 2);
      if (!inTab) return false;

      const hasMemories = (movieMemoriesMap.get(movie.id)?.length || 0) > 0;
      if (showMemoriesOnly && !hasMemories) return false;

      if (!normalizedSearch) return true;
      return `${movie.title} ${movie.year || ''} ${movie.category || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [sortedMovies, contentTab, normalizedSearch, showMemoriesOnly, movieMemoriesMap]);

  const filteredSuggestions = useMemo(() => {
    if (showMemoriesOnly) {
      return [];
    }
    if (contentTab !== 'all' && contentTab !== 'suggestions') {
      return [];
    }
    return pendingSuggestions.filter((suggestion) => {
      if (!normalizedSearch) return true;
      return `${suggestion.title} ${suggestion.suggestedBy} ${suggestion.reason || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [pendingSuggestions, contentTab, normalizedSearch, showMemoriesOnly]);

  const tabCounts = useMemo(
    () => ({
      all: sortedMovies.length,
      'to-watch': sortedMovies.filter((movie) => movie.watchedBy.length < 2).length,
      watched: sortedMovies.filter((movie) => movie.watchedBy.length === 2).length,
      suggestions: pendingSuggestions.length,
    }),
    [sortedMovies, pendingSuggestions]
  );

  useEffect(() => {
    // Only used for mobile detection now
  }, [isMobile]);

  // Track shared watch completion for confetti
  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    // Check if any movie just became watched by both
    for (const movie of movies) {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current.find((m) => m.id === movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          // Movie just became watched by both!
          setShowConfetti(true);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: 'success',
          });
          setTimeout(() => {
            setShowConfetti(false);
          }, 3000);
          break;
        }
      }
    }

    previousMoviesRef.current = movies;
  }, [movies]);

  // TOAST management
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newMovieTitle.trim();

    if (!title || isSubmitting || isAdding) {
      return;
    }

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

      setNewMovieTitle('');
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
  };

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
    [toggleWatched, currentUser, showGuestWarning]
  );

  const handleDeleteMovie = useCallback(
    (movie: Movie) => {
      if (!currentUser) {
        showGuestWarning();
        return;
      }
      setMovieToDelete(movie);
    },
    [currentUser, showGuestWarning]
  );

  const handleFixMatch = useCallback((movie: Movie) => {
    setMovieToFix(movie);
  }, []);



  const handleEditMemory = useCallback(
    async (memoryId: string, note: string) => {
      await updateMemory(memoryId, { note });
      setToast({ message: 'Memory updated.', type: 'success' });
    },
    [updateMemory]
  );

  const handleDeleteMemory = useCallback(
    async (memoryId: string) => {
      await deleteMemoryRecord(memoryId);
      setToast({ message: 'Memory deleted.', type: 'info' });
    },
    [deleteMemoryRecord]
  );

  const handleTogglePin = useCallback(
    async (memoryId: string) => {
      const result = await toggleMemoryPin(memoryId);
      setToast({
        message: result.isPinned ? 'Memory pinned.' : 'Memory unpinned.',
        type: 'success',
      });
    },
    [toggleMemoryPin]
  );

  const confirmDelete = async () => {
    if (movieToDelete) {
      try {
        await deleteMovie(movieToDelete.id);
        setToast({ message: `"${movieToDelete.title}" removed`, type: 'info' });
        setMovieToDelete(null);
      } catch (err: any) {
        setToast({ message: `Error: ${err.message}`, type: 'error' });
      }
    }
  };

  const handleAcceptSuggestion = async (suggestion: MovieSuggestion) => {
    if (!currentUser) {
      showGuestWarning();
      return;
    }
    setProcessingSuggestionId(suggestion.id);
    try {
      await acceptSuggestion(suggestion.id, currentUser);
      setToast({ message: `"${suggestion.title}" added to watchlist!`, type: 'success' });
      refreshMovies();
    } catch (err: any) {
      setToast({ message: `Failed to accept suggestion: ${err.message}`, type: 'error' });
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  const handleRejectSuggestion = async (suggestion: MovieSuggestion) => {
    if (!currentUser) {
      showGuestWarning();
      return;
    }
    setProcessingSuggestionId(suggestion.id);
    try {
      await rejectSuggestion(suggestion.id, currentUser);
      setToast({ message: 'Suggestion rejected', type: 'info' });
    } catch (err: any) {
      setToast({ message: `Failed to reject suggestion: ${err.message}`, type: 'error' });
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  if (isLoading && !movies) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          background: colors.background,
          gap: spacing.lg,
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            animation: 'float 2s ease-in-out infinite',
          }}
        >
          🎬
        </div>
        <div style={{ color: colors.textSecondary, fontSize: typography.fontSize.lg }}>
          Loading your watchlist...
        </div>
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                width: '60px',
                height: '90px',
                borderRadius: radius.md,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="quiet-ui" style={{ background: colors.background }}>
      {/* Confetti celebration */}
      {showConfetti && <Confetti isActive={showConfetti} />}
      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: `${spacing.lg} 0`,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: isMobile ? spacing.sm : spacing.lg,
              left: isMobile ? spacing.md : 'auto',
              right: spacing.lg,
              padding: isMobile ? `${spacing.sm} ${spacing.md}` : `${spacing.md} ${spacing.xl}`,
              backgroundColor:
                toast.type === 'error'
                  ? colors.error
                  : toast.type === 'success'
                    ? colors.success
                    : colors.secondary,
              color: colors.textPrimary,
              borderRadius: radius.md,
              boxShadow: shadows.card,
              zIndex: 1000,
              animation: 'slide-in 0.3s ease-out',
              fontSize: isMobile ? typography.fontSize.xs : typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              textAlign: 'center',
            }}
          >
            {toast.message}
          </div>
        )}

        <Card
          variant="elevated"
          style={{ marginBottom: spacing.xl, padding: isMobile ? spacing.sm : spacing.md }}
        >
          <form onSubmit={handleAddMovie}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
                    color: colors.textPrimary,
                    fontFamily:
                      "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                    letterSpacing: '0.03em',
                  }}
                >
                  {currentUser ? 'Add to Watchlist' : 'Suggest a Title'}
                </h3>
                <p
                  style={{
                    margin: `${spacing.xs} 0 0`,
                    color: colors.textSecondary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  {currentUser
                    ? 'Quick add with one clear field.'
                    : 'Suggest a title for Aaron & Electra to watch.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <IconButton
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                  variant="ghost"
                  size="sm"
                  title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                  aria-label={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                  style={{
                    width: '44px',
                    height: '44px',
                    flexShrink: 0,
                  }}
                >
                  {viewMode === 'list' ? (
                    <LayoutGridIcon style={{ width: isMobile ? '16px' : undefined }} />
                  ) : (
                    <LayoutListIcon style={{ width: isMobile ? '16px' : undefined }} />
                  )}
                </IconButton>
              </div>
            </div>

            <Input
              ref={inputRef}
              label="Movie or show title"
              value={newMovieTitle}
              onChange={(e) =>
                setNewMovieTitle(e.target.value.slice(0, MAX_SUGGESTION_TITLE_LENGTH))
              }
              placeholder={currentUser ? 'Example: Spirited Away' : 'Example: The Holdovers'}
              disabled={isSubmitting || isAdding}
              aria-label="Movie or show title"
              style={{
                borderColor: successMovieId ? colors.success : undefined,
                transition: 'border-color 0.3s ease',
                height: isMobile ? '46px' : '48px',
                fontSize: isMobile ? '14px' : '16px',
              }}
            />

            <div
              style={{
                marginTop: spacing.xs,
                marginBottom: spacing.sm,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
              }}
            >
              <span>Suggestions are reviewed by Aaron & Electra.</span>
              <span>
                {newMovieTitle.length}/{MAX_SUGGESTION_TITLE_LENGTH}
              </span>
            </div>

            <div
              style={{
                marginTop: spacing.md,
                display: 'flex',
                justifyContent: isMobile ? 'stretch' : 'flex-end',
              }}
            >
              <Button
                type="submit"
                variant={currentUser ? 'primary' : 'secondary'}
                disabled={isSubmitting || isAdding || !newMovieTitle.trim()}
                isLoading={isAdding}
                aria-label={currentUser ? 'Add movie to watchlist' : 'Submit suggestion'}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? '100%' : '220px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  fontFamily:
                    "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                  letterSpacing: '0.04em',
                }}
              >
                {!isAdding && <PlusIcon style={{ width: '16px', height: '16px' }} />}
                {currentUser ? 'Add to Watchlist' : 'Submit Suggestion'}
              </Button>
            </div>
          </form>
        </Card>

        <Card
          variant="elevated"
          style={{
            marginBottom: spacing.lg,
            padding: isMobile ? spacing.sm : spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
              gap: spacing.xs,
            }}
          >
            {(
              [
                ['all', 'All'],
                ['to-watch', 'To Watch'],
                ['watched', 'Watched'],
                ['suggestions', 'Suggestions'],
              ] as Array<[ContentTab, string]>
            ).map(([tabValue, label]) => (
              <Button
                key={tabValue}
                variant={contentTab === tabValue ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setContentTab(tabValue)}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  border:
                    contentTab === tabValue ? undefined : `1px solid ${colors.borderSecondary}30`,
                  color: contentTab === tabValue ? colors.textPrimary : colors.textSecondary,
                  minHeight: '44px',
                }}
              >
                {label} ({tabCounts[tabValue]})
              </Button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies and suggestions..."
              aria-label="Search movies and suggestions"
              style={{
                height: '44px',
                flex: 1,
              }}
            />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              aria-label="Sort movies"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '44px',
                minWidth: isMobile ? '100%' : '160px',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}40`,
                backgroundColor: colors.surfaceElevated,
                color: colors.textPrimary,
                padding: `0 ${spacing.sm}`,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              <option value="recent">Recently Added</option>
              <option value="title">Title A-Z</option>
              <option value="year">Year (Newest)</option>
            </select>
            <Button
              type="button"
              size="sm"
              variant={showMemoriesOnly ? 'secondary' : 'ghost'}
              onClick={() => setShowMemoriesOnly((prev) => !prev)}
              style={{
                minHeight: '44px',
                border: `1px solid ${colors.borderSecondary}40`,
                whiteSpace: 'nowrap',
              }}
            >
              Memories only ({memories.length})
            </Button>
          </div>
        </Card>

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
                  onReject={handleRejectSuggestion}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}

              {filteredMovies.map((movie) => {
                const movieMemories = movieMemoriesMap.get(movie.id) || [];
                return (
                  <MovieItem
                    key={movie.id}
                    movie={movie}
                    currentUser={currentUser}
                    onToggle={handleToggleWatched}
                    onDelete={handleDeleteMovie}
                    onFixMatch={handleFixMatch}
                    animationDelay="0s"
                    layout="grid"
                    memories={movieMemories}
                    onAddMemory={async (note) => {
                      await addMemory(movie.id, movie.title, currentUser!, note);
                      setToast({ message: 'Memory added!', type: 'success' });
                    }}
                    onUpdateMemory={handleEditMemory}
                    onDeleteMemory={handleDeleteMemory}
                    onTogglePin={handleTogglePin}
                    isHighlighted={highlightMovieId === movie.id}
                  />
                );
              })}
            </MasonryGrid>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {(contentTab === 'all' || contentTab === 'suggestions') &&
                filteredSuggestions.map((suggestion) => (
                  <SuggestionItemCard
                    key={suggestion.id}
                    suggestion={suggestion}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    isProcessing={processingSuggestionId === suggestion.id}
                  />
                ))}

              {filteredMovies.map((movie) => {
                const movieMemories = movieMemoriesMap.get(movie.id) || [];
                return (
                  <MovieItem
                    key={movie.id}
                    movie={movie}
                    currentUser={currentUser}
                    onToggle={handleToggleWatched}
                    onDelete={handleDeleteMovie}
                    onFixMatch={handleFixMatch}
                    animationDelay="0s"
                    layout="list"
                    memories={movieMemories}
                    onAddMemory={async (note) => {
                      await addMemory(movie.id, movie.title, currentUser!, note);
                      setToast({ message: 'Memory added!', type: 'success' });
                    }}
                    onUpdateMemory={handleEditMemory}
                    onDeleteMemory={handleDeleteMemory}
                    onTogglePin={handleTogglePin}
                    isHighlighted={highlightMovieId === movie.id}
                  />
                );
              })}
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
                <p>
                  {searchQuery
                    ? 'No results match your search.'
                    : contentTab === 'suggestions'
                      ? 'No pending suggestions right now.'
                      : 'No movies in this section yet.'}
                </p>
              </div>
            )}
        </div>


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
        movieTitle={movieToFix?.title || ''}
        onClose={() => setMovieToFix(null)}
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
