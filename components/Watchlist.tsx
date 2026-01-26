import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { usePins } from '../hooks/usePins';
import { Movie } from '../types';
import { PlusIcon, LogoutIcon, DiceIcon, CheckIcon, FilmIcon, LockIcon } from './icons';
import SpinWheel from './SpinWheel';
import Header from './Header';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import ConfirmDialog from './ui/ConfirmDialog';
import PinDialog from './PinDialog';
import MovieItem from './MovieItem';
import SuggestionList from './SuggestionList';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  // FIX: Added non-null assertion as currentUser is guaranteed to exist in this component.
  const { movies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie, refresh: refreshMovies } = useMovies(currentUser!);
  const { userHasPin, setUserPin, removeUserPin, verifyUserPin, isLoading: isPinsLoading } = usePins();

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // PIN management state
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState(false);

  const unwatchedMovies = movies ? movies.filter(movie => movie.watchedBy.length < 2) : [];
  const watchedMovies = movies ? movies.filter(movie => movie.watchedBy.length === 2) : [];
  
  // * Auto-focus input after successful add
  useEffect(() => {
    if (!isAdding && newMovieTitle === '' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding, newMovieTitle]);

  // * Auto-hide toast
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
        setToast({ message: "You need at least two unwatched movies to spin the wheel!", type: 'info' });
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMovieTitle.trim() && !isSubmitting) {
      setIsAdding(true);
      const movieTitle = newMovieTitle.trim();
      try {
        await addMovie(movieTitle);
        setNewMovieTitle('');
        setToast({ message: `"${movieTitle}" added successfully!`, type: 'success' });
        setSuccessMovieId(movieTitle);
        setTimeout(() => setSuccessMovieId(null), 2000);
      } catch (err: any) {
        setToast({ message: `Error adding movie: ${err.message}`, type: 'error' });
      }
      finally {
        setIsAdding(false);
      }
    }
  };

  const handleToggleWatched = useCallback(async (movie: Movie) => {
    try {
      await toggleWatched(movie.id);
      const watchedByCurrentUser = movie.watchedBy.includes(currentUser!);
      // Note: Logic inverted because we are showing the NEW state's toast
      setToast({
        message: !watchedByCurrentUser
          ? `Marked "${movie.title}" as watched!`
          : `Marked "${movie.title}" as unwatched`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: `Error updating movie status: ${err.message}`, type: 'error' });
    }
  }, [toggleWatched, currentUser]);

  const handleDeleteMovie = useCallback((movie: Movie) => {
    setMovieToDelete(movie);
  }, []);

  const confirmDeleteMovie = useCallback(async () => {
    if (!movieToDelete) return;
    
    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" deleted`, type: 'success' });
      setMovieToDelete(null);
    } catch (err: any) {
      setToast({ message: `Error deleting movie: ${err.message}`, type: 'error' });
    }
  }, [deleteMovie, movieToDelete]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // PIN management handlers
  const handleOpenPinSettings = () => {
    if (userHasPin(currentUser!)) {
      setPinMode('change');
    } else {
      setPinMode('set');
    }
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin: string, newPin?: string): Promise<boolean> => {
    if (!currentUser) return false;
    setIsPinLoading(true);
    try {
      if (pinMode === 'set') {
        const success = await setUserPin(currentUser, pin);
        if (success) {
          setShowPinDialog(false);
          setToast({ message: 'PIN set successfully!', type: 'success' });
        }
        return success;
      } else if (pinMode === 'change') {
        // First verify the current PIN
        if (!newPin) {
          // Step 1: Verify current PIN
          const isValid = await verifyUserPin(currentUser, pin);
          return isValid;
        } else {
          // Step 2: Set new PIN
          const success = await setUserPin(currentUser, newPin);
          if (success) {
            setShowPinDialog(false);
            setToast({ message: 'PIN changed successfully!', type: 'success' });
          }
          return success;
        }
      }
      return false;
    } finally {
      setIsPinLoading(false);
    }
  };

  const handleRemovePin = () => {
    setShowPinDialog(false);
    setShowRemovePinConfirm(true);
  };

  const confirmRemovePin = async () => {
    if (!currentUser) return;
    setIsPinLoading(true);
    try {
      const success = await removeUserPin(currentUser);
      if (success) {
        setToast({ message: 'PIN removed successfully', type: 'success' });
      } else {
        setToast({ message: 'Failed to remove PIN', type: 'error' });
      }
    } finally {
      setIsPinLoading(false);
      setShowRemovePinConfirm(false);
    }
  };
  
  const firstWatchedIndex = movies ? movies.findIndex(m => m.watchedBy.length === 2) : -1;

  if (isLoading) {
    return (
      <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
        <Card variant="elevated" style={{ marginBottom: spacing.xl, padding: spacing.lg }}>
          <div className="skeleton" style={{ 
            height: '60px', 
            borderRadius: radius.md,
            marginBottom: spacing.md,
          }} />
          <div className="skeleton" style={{ 
            height: '40px', 
            borderRadius: radius.md,
            width: '70%',
            margin: '0 auto',
          }} />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="default" className="skeleton" style={{ 
              padding: spacing.xl,
              height: '120px',
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center', color: colors.error }}>
        <p>Error loading movies. Please try refreshing the page.</p>
        <p style={{ fontSize: typography.fontSize.sm, marginTop: spacing.sm }}>{error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto', padding: `0 ${spacing.md}` }}>
      {isWheelVisible && <SpinWheel movies={unwatchedMovies} onClose={() => setIsWheelVisible(false)} />}
      
      <ConfirmDialog
        isOpen={!!movieToDelete}
        title="Delete Movie"
        message={`Are you sure you want to delete "${movieToDelete?.title}"?`}
        confirmText="Delete"
        onConfirm={confirmDeleteMovie}
        onCancel={() => setMovieToDelete(null)}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={showRemovePinConfirm}
        title="Remove PIN"
        message="Are you sure you want to remove your PIN? Anyone will be able to access your account."
        confirmText="Remove PIN"
        onConfirm={confirmRemovePin}
        onCancel={() => setShowRemovePinConfirm(false)}
        isLoading={isPinLoading}
      />

      {/* PIN Dialog */}
      {currentUser && (
        <PinDialog
          isOpen={showPinDialog}
          user={currentUser}
          mode={pinMode}
          onSubmit={handlePinSubmit}
          onCancel={() => setShowPinDialog(false)}
          onRemove={pinMode === 'change' ? handleRemovePin : undefined}
          isLoading={isPinLoading}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Card 
          variant="elevated" 
          style={{ 
            position: 'fixed',
            top: spacing.lg,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            maxWidth: '90%',
            padding: spacing.lg,
            backgroundColor: toast.type === 'error' ? colors.error + '30' : toast.type === 'success' ? colors.success + '30' : colors.secondary + '30',
            borderColor: toast.type === 'error' ? colors.error : toast.type === 'success' ? colors.success : colors.secondary,
            borderWidth: '2px',
            animation: 'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxShadow: toast.type === 'error' 
              ? `0 4px 12px ${colors.error}40, ${shadows.card}` 
              : toast.type === 'success' 
                ? `0 4px 12px ${colors.success}40, ${shadows.card}` 
                : `0 4px 12px ${colors.secondary}40, ${shadows.card}`,
          }}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          aria-atomic="true"
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: spacing.md, 
            color: colors.textPrimary,
            justifyContent: 'center',
          }}>
            {toast.type === 'success' && (
              <CheckIcon style={{ 
                color: colors.success, 
                flexShrink: 0,
                filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.6))',
              }} />
            )}
            {toast.type === 'error' && (
              <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            )}
            {toast.type === 'info' && (
              <span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
            )}
            <span style={{ 
              fontSize: typography.fontSize.base, 
              textAlign: 'center',
              fontWeight: typography.fontWeight.medium,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              maxWidth: '100%',
              flex: '1 1 auto', // * Allow flex item to grow and shrink
              minWidth: 0, // * Allow shrinking below content size for proper wrapping
            }}>
              {toast.message}
            </span>
          </div>
        </Card>
      )}
      
      <div>
        <Header />
        
        {/* Movie Statistics */}
        {movies && movies.length > 0 && (
          <Card variant="elevated" className="scale-in" style={{ 
            marginBottom: spacing.lg, 
            padding: spacing.md,
            position: 'relative',
            // * overflow handled by Card component - decorative background will be clipped properly
          }}>
            {/* Decorative background pattern */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: 'radial-gradient(circle at 20% 50%, rgba(255, 105, 180, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(135, 206, 250, 0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            }} />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: spacing.lg, 
              flexWrap: 'wrap', 
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{ minWidth: '60px', animationDelay: '0.1s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['2xl'], 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.accent, // * Fallback for browsers without gradient support
                  background: shadows.textGradientPink,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 105, 180, 0.3)',
                  lineHeight: typography.lineHeight.tight,
                  marginBottom: spacing.xs,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))',
                  transition: 'transform 0.3s ease-out',
                  animationDelay: '0s',
                }} className="float">
                  {movies.length}
                </div>
                <div style={{ 
                  fontSize: typography.fontSize.xs, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  {movies.length === 1 ? 'Movie' : 'Movies'}
                </div>
              </div>
              <div style={{ minWidth: '60px', animationDelay: '0.2s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['2xl'], 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.secondary, // * Fallback for browsers without gradient support
                  background: shadows.textGradientBlue,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(135, 206, 250, 0.3)',
                  lineHeight: typography.lineHeight.tight,
                  marginBottom: spacing.xs,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))',
                  transition: 'transform 0.3s ease-out',
                  animationDelay: '0.3s',
                }} className="float">
                  {unwatchedMovies.length}
                </div>
                <div style={{ 
                  fontSize: typography.fontSize.xs, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  Unwatched
                </div>
              </div>
              <div style={{ minWidth: '60px', animationDelay: '0.3s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['2xl'], 
                  fontWeight: typography.fontWeight.bold, 
                  color: colors.accent, // * Fallback for browsers without gradient support
                  background: shadows.textGradientPink,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 105, 180, 0.3)',
                  lineHeight: typography.lineHeight.tight,
                  marginBottom: spacing.xs,
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))',
                  transition: 'transform 0.3s ease-out',
                  animationDelay: '0.6s',
                }} className="float">
                  {watchedMovies.length}
                </div>
                <div style={{ 
                  fontSize: typography.fontSize.xs, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  Watched
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Add Movie Form */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <form onSubmit={handleAddMovie} style={{ padding: spacing.md }} className="add-movie-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, alignItems: 'stretch' }}>
              <div style={{ 
                display: 'flex', 
                gap: spacing.sm, 
                alignItems: 'center', 
                width: '100%',
                flexWrap: 'wrap',
              }}>
                <IconButton
                  type="button"
                  onClick={handleLogout}
                  title={`Switch User (Currently: ${currentUser})`}
                  aria-label={`Switch user (currently logged in as ${currentUser})`}
                  variant="ghost"
                  style={{ flexShrink: 0 }}
                >
                  <LogoutIcon />
                </IconButton>
                <IconButton
                  type="button"
                  onClick={handleOpenPinSettings}
                  title={userHasPin(currentUser!) ? 'Change or remove your PIN' : 'Set a PIN to lock your account'}
                  aria-label={userHasPin(currentUser!) ? 'Change PIN' : 'Set PIN'}
                  variant="ghost"
                  disabled={isPinsLoading}
                  style={{ flexShrink: 0 }}
                >
                  <LockIcon style={{ 
                    width: '1rem', 
                    height: '1rem',
                    color: userHasPin(currentUser!) ? colors.success : colors.textSecondary,
                  }} />
                </IconButton>
                <Input
                  ref={inputRef}
                  type="text"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="What movie should we watch?"
                  aria-label="New movie title"
                  disabled={isSubmitting}
                  style={{ flex: 1, margin: 0, minWidth: '150px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setNewMovieTitle('');
                      inputRef.current?.blur();
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isAdding}
                  loadingText=""
                  disabled={!newMovieTitle.trim() || isSubmitting}
                  style={{ 
                    padding: spacing.sm,
                    borderRadius: '50%',
                    aspectRatio: '1',
                    minWidth: '40px',
                    width: '40px',
                    height: '40px',
                    flexShrink: 0,
                  }}
                  title="Add movie to watchlist"
                  aria-label="Add movie to watchlist"
                >
                  {!isAdding && <PlusIcon />}
                </Button>
              </div>
            </div>
          </form>
        </Card>
        
        {/* Spin to Decide card */}
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <div style={{ padding: spacing.md }}>
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
                fontSize: typography.fontSize.lg,
              }}
              title={unwatchedMovies.length < 2 ? "Add at least 2 unwatched movies to use the wheel" : "Spin the wheel to randomly pick a movie!"}
            >
              <DiceIcon />
              Spin to Decide
            </Button>
            {unwatchedMovies.length < 2 && (
              <p style={{
                marginTop: spacing.sm,
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                {unwatchedMovies.length === 0 
                  ? "Add movies to your watchlist to use the wheel"
                  : "Add one more movie to use the wheel"}
              </p>
            )}
          </div>
        </Card>

        {/* Movie Suggestions Section */}
        <SuggestionList currentUser={currentUser!} onMovieAdded={refreshMovies} />

        {/* Movie List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          opacity: isSubmitting ? 0.5 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}>
          {movies && movies.map((movie, index) => {
            return (
              <React.Fragment key={movie.id}>
                {index === firstWatchedIndex && firstWatchedIndex !== -1 && (
                    <div className="flex items-center my-6 animate-fade-in" style={{ margin: `${spacing['2xl']} 0 ${spacing.xl} 0` }}>
                        <hr className="flex-grow border-pink-400 border-dashed" style={{ 
                          flex: 1, 
                          height: '2px', 
                          borderColor: colors.accent, 
                          borderStyle: 'dashed',
                          opacity: 0.5,
                        }} />
                        <span className="px-4 text-pink-300 font-heading" style={{ 
                          padding: `0 ${spacing.lg}`, 
                          color: colors.accent, // * Fallback for browsers without gradient support
                          background: shadows.textGradientPink,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontSize: typography.fontSize.base, 
                          fontWeight: typography.fontWeight.semibold,
                          textShadow: '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 105, 180, 0.3)',
                          letterSpacing: '0.05em',
                          whiteSpace: 'normal', // * Changed from 'nowrap' to allow wrapping on small screens
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
                        }}>
                          Watched Together ✨
                        </span>
                        <hr className="flex-grow border-pink-400 border-dashed" style={{ 
                          flex: 1, 
                          height: '2px', 
                          borderColor: colors.accent, 
                          borderStyle: 'dashed',
                          opacity: 0.5,
                        }} />
                    </div>
                )}
                <MovieItem
                  movie={movie}
                  currentUser={currentUser!}
                  onToggle={handleToggleWatched}
                  onDelete={handleDeleteMovie}
                  animationDelay={`${index * 0.05}s`}
                />
              </React.Fragment>
            )
          })}
          {movies?.length === 0 && (
              <Card variant="elevated">
                <div style={{ textAlign: 'center', padding: spacing['3xl'], color: colors.textSecondary }}>
                  <FilmIcon style={{ 
                    width: '80px', 
                    height: '80px', 
                    margin: '0 auto', 
                    marginBottom: spacing.xl, 
                    opacity: 0.6, 
                    color: colors.accent,
                    filter: 'drop-shadow(0 0 10px rgba(255, 105, 180, 0.3))',
                  }} />
                  <p style={{ 
                    margin: 0, 
                    marginBottom: spacing.md, 
                    fontSize: typography.fontSize.xl, 
                    color: colors.textPrimary,
                    fontWeight: typography.fontWeight.semibold,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    Your movie list is empty
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: typography.fontSize.base,
                    color: colors.textSecondary,
                    lineHeight: typography.lineHeight.relaxed,
                  }}>
                    Start building your watchlist by adding a movie above!
                  </p>
                </div>
              </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
