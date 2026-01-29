import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import FixMatchDialog from './FixMatchDialog';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { usePins } from '../hooks/usePins';
import { useSuggestions } from '../hooks/useSuggestions';
import { Movie, MovieSuggestion } from '../types';
import {
  PlusIcon,
  LogoutIcon,
  DiceIcon,
  CheckIcon,
  FilmIcon,
  LockIcon,
  RefreshIcon,
  LayoutGridIcon,
  LayoutListIcon,
  TicketIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon,
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
import { DashboardCard, SuggestionItemCard } from './DashboardCards';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

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
    updateMovieMetadata,
    manualMetadataUpdate,
    refreshAllMetadata,
  } = useMovies(currentUser!);
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
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState(false);
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebratedMovieTitle, setCelebratedMovieTitle] = useState<string | null>(null);
  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const unwatchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length < 2) : []),
    [movies]
  );
  const watchedMovies = useMemo(
    () => (movies ? movies.filter((movie) => movie.watchedBy.length === 2) : []),
    [movies]
  );
  const firstWatchedIndex = useMemo(
    () => (movies ? movies.findIndex((m) => m.watchedBy.length === 2) : -1),
    [movies]
  );

  // Track shared watch completion for confetti
  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    // Check if any movie just became watched by both
    for (const movie of movies) {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current.find(m => m.id === movie.id);
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
      try {
        const wasWatched = movie.watchedBy.includes(currentUser!);
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
    [toggleWatched, currentUser]
  );

  const handleDeleteMovie = (movie: Movie) => {
    setMovieToDelete(movie);
  };

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
    setProcessingSuggestionId(suggestion.id);
    try {
      await acceptSuggestion(suggestion.id, currentUser!);
      setToast({ message: `"${suggestion.title}" added to watchlist!`, type: 'success' });
      refreshMovies();
    } catch (err: any) {
      setToast({ message: `Failed to accept suggestion: ${err.message}`, type: 'error' });
    } finally {
      setProcessingSuggestionId(null);
    }
  };

  const handleRejectSuggestion = async (suggestion: MovieSuggestion) => {
    setProcessingSuggestionId(suggestion.id);
    try {
      await rejectSuggestion(suggestion.id, currentUser!);
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
    if (userHasPin(currentUser!)) {
      setPinMode('change');
    } else {
      setPinMode('set');
    }
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (!currentUser) return;
    setIsPinLoading(true);
    try {
      if (pinMode === 'set') {
        await setUserPin(currentUser, pin);
        setShowPinDialog(false);
        setToast({ message: 'PIN set successfully!', type: 'success' });
      } else {
        // change mode
        const isValid = await verifyUserPin(currentUser, pin);
        if (isValid) {
          setPinMode('set'); // Reuse set mode for the new pin
        } else {
          setToast({ message: 'Incorrect PIN', type: 'error' });
        }
      }
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
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
          minHeight: '100vh',
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
    <div style={{ minHeight: '100vh', background: colors.background }}>
      {/* Confetti celebration */}
      {showConfetti && <Confetti />}
      
      <Header
        currentUser={currentUser!}
        onLogout={handleLogout}
        onPinAction={handlePinAction}
        onRemovePin={() => setShowRemovePinConfirm(true)}
        hasPin={userHasPin(currentUser!)}
        movieCount={movies?.length || 0}
        watchedTogetherCount={watchedMovies.length}
      />

      <div
        style={{
          maxWidth: viewMode === 'grid' ? '1200px' : '44rem',
          margin: '0 auto',
          padding: `${spacing.lg} ${spacing.md}`,
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: spacing.lg,
              right: spacing.lg,
              padding: `${spacing.md} ${spacing.xl}`,
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
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {toast.message}
          </div>
        )}

        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <form onSubmit={handleAddMovie} style={{ padding: spacing.md }}>
            <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Input
                  ref={inputRef}
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder={isMobile ? 'Add movie...' : 'Enter movie or show title...'}
                  disabled={isSubmitting}
                  aria-label="New movie title"
                  style={{
                    paddingRight: isMobile ? '80px' : '120px',
                    borderColor: successMovieId ? colors.success : undefined,
                    transition: 'border-color 0.3s ease',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: spacing.sm,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: isMobile ? spacing.xs : spacing.sm,
                    alignItems: 'center',
                  }}
                >
                  <IconButton
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    variant="ghost"
                    size="sm"
                    title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                    aria-label={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                    style={{ padding: isMobile ? '4px' : undefined }}
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
                    disabled={!newMovieTitle.trim() || isSubmitting}
                    isLoading={isAdding}
                    style={{
                      padding: 0,
                      borderRadius: '50%',
                      aspectRatio: '1',
                      minWidth: isMobile ? '32px' : '36px',
                      width: isMobile ? '32px' : '36px',
                      height: isMobile ? '32px' : '36px',
                      flexShrink: 0,
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

        {/* Action Grid (Only in List View) */}
        {viewMode === 'list' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: spacing.md,
              marginBottom: spacing.xl,
            }}
          >
            <Button
              onClick={handleOpenWheel}
              disabled={unwatchedMovies.length < 2}
              variant="secondary"
              size="sm"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <DiceIcon />
              Spin to Decide
            </Button>
          </div>
        )}

        <div
          style={{
            opacity: isSubmitting ? 0.5 : 1,
            pointerEvents: isSubmitting ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          {viewMode === 'grid' ? (
            <MasonryGrid>
              {/* Primary Action Card */}
              <DashboardCard
                title="Spin to Decide"
                icon={<DiceIcon style={{ width: '32px', height: '32px' }} />}
                description={
                  unwatchedMovies.length < 2 ? 'Needs 2+ movies' : 'Pick a random movie!'
                }
                onClick={handleOpenWheel}
                variant="accent"
                actionLabel="Spin Wheel"
              />

              {/* Individual Suggestions */}
              {pendingSuggestions.map((suggestion) => (
                <SuggestionItemCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}

              {movies &&
                movies.map((movie) => (
                  <MovieItem
                    key={movie.id}
                    movie={movie}
                    currentUser={currentUser!}
                    onToggle={handleToggleWatched}
                    onDelete={handleDeleteMovie}
                    onFixMatch={(movie) => setMovieToFix(movie)}
                    animationDelay="0s"
                    layout="grid"
                  />
                ))}
            </MasonryGrid>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {movies &&
                movies.map((movie, index) => (
                  <React.Fragment key={movie.id}>
                    {index === firstWatchedIndex && firstWatchedIndex !== -1 && (
                      <div
                        style={{
                          margin: `${spacing.xl} 0`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.md,
                        }}
                      >
                        <hr
                          style={{
                            flex: 1,
                            border: 'none',
                            borderTop: `1px dashed ${colors.accent}`,
                            opacity: 0.5,
                          }}
                        />
                        <span
                          style={{
                            color: colors.accent,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                          }}
                        >
                          Watched Together ✨
                        </span>
                        <hr
                          style={{
                            flex: 1,
                            border: 'none',
                            borderTop: `1px dashed ${colors.accent}`,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                    )}
                    <MovieItem
                      movie={movie}
                      currentUser={currentUser!}
                      onToggle={handleToggleWatched}
                      onDelete={handleDeleteMovie}
                      onFixMatch={(movie) => setMovieToFix(movie)}
                      animationDelay={`${index * 0.05}s`}
                      layout="list"
                    />
                  </React.Fragment>
                ))}
            </div>
          )}

          {movies?.length === 0 && !isSuggestionsLoading && (
            <div
              style={{ textAlign: 'center', padding: spacing['3xl'], color: colors.textSecondary }}
            >
              <FilmIcon
                style={{ width: '64px', height: '64px', opacity: 0.3, marginBottom: spacing.md }}
              />
              <p>Your watchlist is empty. Add a movie to start!</p>
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
            // The modal stays open to show the result; close button inside SpinWheel will handle closing
          }}
        />
      )}

      <PinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
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
