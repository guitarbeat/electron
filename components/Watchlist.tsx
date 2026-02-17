import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import FixMatchDialog from './FixMatchDialog';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { usePins } from '../hooks/usePins';
import { useSuggestions } from '../hooks/useSuggestions';
import { Movie, MovieSuggestion } from '../types';
import {
  PlusIcon,
  DiceIcon,
  FilmIcon,
  LockIcon,
  LayoutGridIcon,
  LayoutListIcon,
} from './icons';
import SpinWheel from './SpinWheel';
import Header from './Header';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import ConfirmDialog from './ui/ConfirmDialog';
import PinDialog from './PinDialog';
import MovieItem from './MovieItem';
import MasonryGrid from './ui/MasonryGrid';
import Confetti from './effects/Confetti';
import { SuggestionItemCard } from './DashboardCards';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

type ContentTab = 'all' | 'to-watch' | 'watched' | 'suggestions';
type SortMode = 'recent' | 'title' | 'year';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  const isMobile = useMediaQuery(breakpoints.sm);
  const {
    movies,
    isLoading,
    error,
    isSubmitting,
    addMovie,
    toggleWatched,
    deleteMovie,
    refresh: refreshMovies,
    manualMetadataUpdate,
  } = useMovies(currentUser);
  const { userHasPin, setUserPin, removeUserPin, verifyUserPin } = usePins();
  const {
    pendingSuggestions,
    acceptSuggestion,
    rejectSuggestion,
    isLoading: isSuggestionsLoading,
  } = useSuggestions();

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);
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
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState(false);
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratedMovieTitle, setCelebratedMovieTitle] = useState<string | null>(null);
  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const moviesNeededForSpin = Math.max(0, 2 - unwatchedMovies.length);
  const canSpin = Boolean(currentUser) && moviesNeededForSpin === 0;
  const normalizedSearch = searchQuery.trim().toLowerCase();
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
      if (!normalizedSearch) return true;
      return `${movie.title} ${movie.year || ''} ${movie.category || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [sortedMovies, contentTab, normalizedSearch]);

  const filteredSuggestions = useMemo(() => {
    if (contentTab !== 'all' && contentTab !== 'suggestions') {
      return [];
    }
    return pendingSuggestions.filter((suggestion) => {
      if (!normalizedSearch) return true;
      return `${suggestion.title} ${suggestion.suggestedBy} ${suggestion.reason || ''}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [pendingSuggestions, contentTab, normalizedSearch]);

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
          setCelebratedMovieTitle(movie.title);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: 'success',
          });
          setTimeout(() => {
            setShowConfetti(false);
            setCelebratedMovieTitle(null);
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

  const handleOpenWheel = () => {
    if (!currentUser) {
      showGuestWarning();
      return;
    }
    if (unwatchedMovies.length > 1) {
      setIsWheelVisible(true);
    } else {
      setToast({
        message: 'You need at least two unwatched movies to spin the wheel!',
        type: 'info',
      });
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showGuestWarning();
      return;
    }
    if (newMovieTitle.trim() && !isSubmitting) {
      setIsAdding(true);
      const title = newMovieTitle.trim();
      try {
        await addMovie(title);
        setNewMovieTitle('');
        setToast({ message: `"${title}" added successfully!`, type: 'success' });
        setSuccessMovieId(title);
        setTimeout(() => setSuccessMovieId(null), 2000);
      } catch (err: any) {
        setToast({ message: `Error adding movie: ${err.message}`, type: 'error' });
      } finally {
        setIsAdding(false);
      }
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

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handlePinAction = () => {
    if (!currentUser) {
      showGuestWarning();
      return;
    }
    if (userHasPin(currentUser)) {
      setPinMode('change');
    } else {
      setPinMode('set');
    }
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (!currentUser) return false;
    setIsPinLoading(true);
    try {
      if (pinMode === 'set') {
        await setUserPin(currentUser, pin);
        setShowPinDialog(false);
        setToast({ message: 'PIN set successfully!', type: 'success' });
        return true;
      }
      // change mode
      const isValid = await verifyUserPin(currentUser, pin);
      if (isValid) {
        setPinMode('set'); // Reuse set mode for the new pin
        return true;
      }
      setToast({ message: 'Incorrect PIN', type: 'error' });
      return false;
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      return false;
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleRemovePin = async () => {
    if (!currentUser) return;
    setIsPinLoading(true);
    try {
      await removeUserPin(currentUser);
      setToast({ message: 'PIN removed', type: 'info' });
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    } finally {
      setIsPinLoading(false);
      setShowRemovePinConfirm(false);
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
    <div style={{ background: colors.background }}>
      {/* Confetti celebration */}
      {showConfetti && <Confetti isActive={showConfetti} />}

      <Header
        currentUser={currentUser || null}
        onLogout={handleLogout}
        onPinAction={handlePinAction}
        onRemovePin={() => setShowRemovePinConfirm(true)}
        hasPin={currentUser ? userHasPin(currentUser) : false}
        movieCount={movies?.length || 0}
        watchedTogetherCount={watchedMovies.length}
      />

      <div
        style={{
          maxWidth: viewMode === 'grid' ? '1200px' : '44rem',
          margin: '0 auto',
          padding: `${spacing.lg} ${spacing.md}`,
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
            <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Input
                  ref={inputRef}
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder={
                    !currentUser
                      ? 'Login to add movies...'
                      : isMobile
                        ? 'Add movie...'
                        : 'Enter movie or show title...'
                  }
                  disabled={!currentUser || isSubmitting}
                  aria-label="New movie title"
                  style={{
                    paddingRight: isMobile ? '102px' : '132px',
                    borderColor: successMovieId ? colors.success : undefined,
                    transition: 'border-color 0.3s ease',
                    height: isMobile ? '46px' : '48px',
                    fontSize: isMobile ? '14px' : '16px',
                    opacity: !currentUser ? 0.6 : 1,
                    cursor: !currentUser ? 'not-allowed' : 'text',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: spacing.xs,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: isMobile ? '4px' : spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  <IconButton
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    variant="ghost"
                    size="sm"
                    title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                    aria-label={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                    style={{
                      padding: isMobile ? '8px' : undefined,
                      width: isMobile ? '44px' : '44px',
                      height: isMobile ? '44px' : '44px',
                    }}
                  >
                    {viewMode === 'list' ? (
                      <LayoutGridIcon style={{ width: isMobile ? '16px' : undefined }} />
                    ) : (
                      <LayoutListIcon style={{ width: isMobile ? '16px' : undefined }} />
                    )}
                  </IconButton>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!currentUser || !newMovieTitle.trim() || isSubmitting}
                    isLoading={isAdding}
                    style={{
                      padding: 0,
                      borderRadius: '50%',
                      aspectRatio: '1',
                      minWidth: isMobile ? '44px' : '44px',
                      width: isMobile ? '44px' : '44px',
                      height: isMobile ? '44px' : '44px',
                      flexShrink: 0,
                      opacity: !currentUser ? 0.5 : 1,
                    }}
                  >
                    {!isAdding && (
                      <PlusIcon
                        style={{
                          width: isMobile ? '16px' : '18px',
                          height: isMobile ? '16px' : '18px',
                        }}
                      />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Combined Spin Wheel Header/Card */}
        <Card
          variant="elevated"
          className={!canSpin ? 'neon-pulse' : undefined}
          style={{
            marginBottom: spacing.xl,
            padding: isMobile ? spacing.md : spacing.lg,
            border: `2px solid ${canSpin ? colors.secondary : colors.accent}`,
            background: canSpin
              ? 'linear-gradient(135deg, rgba(18, 54, 90, 0.95) 0%, rgba(20, 39, 78, 0.92) 100%)'
              : 'linear-gradient(135deg, rgba(80, 28, 66, 0.96) 0%, rgba(53, 21, 74, 0.92) 100%)',
            boxShadow: canSpin ? shadows.glowBlue : shadows.glowStrong,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}
          >
            <div style={{ flex: 1, textAlign: isMobile ? 'center' : 'left' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  color: canSpin ? colors.secondary : colors.accentLight,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: spacing.xs,
                }}
              >
                {!currentUser
                  ? 'Spin wheel locked'
                  : canSpin
                    ? "Tonight's movie picker is ready"
                    : 'Almost ready to spin'}
              </span>
              <h2
                style={{
                  margin: 0,
                  marginBottom: spacing.xs,
                  color: colors.textPrimary,
                  fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                {!currentUser ? 'Login to Spin the Wheel' : 'Spin the Wheel'}
              </h2>
              <p
                style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  lineHeight: typography.lineHeight.normal,
                }}
              >
                {!currentUser
                  ? 'Select a profile above, then spin for an instant movie pick.'
                  : canSpin
                    ? 'You have enough unwatched movies. Spin now and let fate decide.'
                    : `Add ${moviesNeededForSpin} more unwatched ${moviesNeededForSpin === 1 ? 'movie' : 'movies'} to unlock the wheel.`}
              </p>
            </div>
            <Button
              onClick={handleOpenWheel}
              variant={canSpin ? 'secondary' : 'primary'}
              size={isMobile ? 'md' : 'lg'}
              style={{
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? '100%' : '220px',
                fontWeight: typography.fontWeight.bold,
                letterSpacing: '0.06em',
              }}
              aria-label={!currentUser ? 'Login to spin the wheel' : 'Open spin wheel'}
            >
              {!currentUser ? <LockIcon /> : <DiceIcon />}
              {!currentUser
                ? 'Login to Spin'
                : canSpin
                  ? 'Spin Wheel Now'
                  : `Need ${moviesNeededForSpin} More`}
            </Button>
          </div>
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
                ['all', `All (${movies?.length || 0})`],
                ['to-watch', `To Watch (${unwatchedMovies.length})`],
                ['watched', `Watched (${watchedMovies.length})`],
                ['suggestions', `Suggestions (${pendingSuggestions.length})`],
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
                    contentTab === tabValue
                      ? undefined
                      : `1px solid ${colors.borderSecondary}30`,
                  color: contentTab === tabValue ? colors.textPrimary : colors.textSecondary,
                  minHeight: '44px',
                }}
              >
                {label}
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
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
              }}
            >
              Sort
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                style={{
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
            </label>
          </div>
        </Card>

        <div
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

              {filteredMovies.map((movie) => (
                <MovieItem
                  key={movie.id}
                  movie={movie}
                  currentUser={currentUser}
                  onToggle={handleToggleWatched}
                  onDelete={handleDeleteMovie}
                  onFixMatch={handleFixMatch}
                  animationDelay="0s"
                  layout="grid"
                />
              ))}
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

              {filteredMovies.map((movie, index) => (
                <MovieItem
                  key={movie.id}
                  movie={movie}
                  currentUser={currentUser}
                  onToggle={handleToggleWatched}
                  onDelete={handleDeleteMovie}
                  onFixMatch={handleFixMatch}
                  animationDelay={`${index * 0.05}s`}
                  layout="list"
                />
              ))}
            </div>
          )}

          {filteredMovies.length === 0 && filteredSuggestions.length === 0 && !isSuggestionsLoading && (
            <div
              style={{ textAlign: 'center', padding: spacing['3xl'], color: colors.textSecondary }}
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

      {isWheelVisible && (
        <SpinWheel
          isOpen={isWheelVisible}
          onClose={() => setIsWheelVisible(false)}
          movies={unwatchedMovies}
          onWinner={(movie) => {
            setToast({ message: `Winner: ${movie.title}!`, type: 'success' });
          }}
        />
      )}

      <PinDialog
        isOpen={showPinDialog}
        user={currentUser!}
        onCancel={() => setShowPinDialog(false)}
        onSubmit={handlePinSubmit}
        mode={pinMode}
        isLoading={isPinLoading}
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
            setToast({ message: `Failed to update metadata.`, type: 'error' });
          }
        }}
      />

      <ConfirmDialog
        isOpen={showRemovePinConfirm}
        title="Remove PIN"
        message="Are you sure you want to remove your PIN? Anyone will be able to mark movies as watched for you."
        onConfirm={handleRemovePin}
        onCancel={() => setShowRemovePinConfirm(false)}
      />
    </div>
  );
};

export default memo(Watchlist);
