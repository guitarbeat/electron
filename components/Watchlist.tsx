import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { Movie } from '../types';
import { PlusIcon, TrashIcon, EyeIcon, EyeOffIcon, Spinner, SparkleHeartIcon, LogoutIcon, DiceIcon, CheckIcon, FilmIcon } from './icons';
import SpinWheel from './SpinWheel';
import Header from './Header';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import MovieItem from './MovieItem';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  // FIX: Added non-null assertion as currentUser is guaranteed to exist in this component.
  const { movies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie } = useMovies(currentUser!);

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // We use the movie state from the time of render to determine the message.
      // If it WAS watched by user, we are unwatching it.
      const watchedByCurrentUser = movie.watchedBy.includes(currentUser!);
      setToast({
        message: watchedByCurrentUser
          ? `Marked "${movie.title}" as unwatched`
          : `Marked "${movie.title}" as watched!`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: `Error updating movie status: ${err.message}`, type: 'error' });
    }
  }, [toggleWatched, currentUser]);

  const handleDeleteMovie = useCallback(async (movie: Movie) => {
    if (!window.confirm(`Are you sure you want to delete "${movie.title}"?`)) return;
    
    try {
      await deleteMovie(movie.id);
      setToast({ message: `"${movie.title}" deleted`, type: 'success' });
    } catch (err: any) {
      setToast({ message: `Error deleting movie: ${err.message}`, type: 'error' });
    }
  }, [deleteMovie]);

  const handleLogout = () => {
    setCurrentUser(null);
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
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      {isWheelVisible && <SpinWheel movies={unwatchedMovies} onClose={() => setIsWheelVisible(false)} />}
      
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
            marginBottom: spacing.xl, 
            padding: spacing.xl,
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
              gap: spacing.xl, 
              flexWrap: 'wrap', 
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{ minWidth: '80px', animationDelay: '0.1s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['3xl'], 
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
                  fontSize: typography.fontSize.sm, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  {movies.length === 1 ? 'Movie' : 'Movies'}
                </div>
              </div>
              <div style={{ minWidth: '80px', animationDelay: '0.2s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['3xl'], 
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
                  fontSize: typography.fontSize.sm, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  Unwatched
                </div>
              </div>
              <div style={{ minWidth: '80px', animationDelay: '0.3s' }} className="bounce-in">
                <div style={{ 
                  fontSize: typography.fontSize['3xl'], 
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
                  fontSize: typography.fontSize.sm, 
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.medium,
                  letterSpacing: '0.05em',
                }}>
                  Watched Together
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* Add Movie Form */}
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <form onSubmit={handleAddMovie} style={{ padding: spacing.lg }} className="add-movie-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, alignItems: 'stretch' }}>
              <div style={{ 
                display: 'flex', 
                gap: spacing.md, 
                alignItems: 'center', 
                width: '100%',
                flexWrap: 'wrap',
              }}>
                <IconButton
                  type="button"
                  onClick={handleLogout}
                  title={`Switch User (Currently: ${currentUser})`}
                  variant="ghost"
                  style={{ flexShrink: 0 }}
                >
                  <LogoutIcon />
                </IconButton>
                <Input
                  ref={inputRef}
                  type="text"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="What movie should we watch?"
                  disabled={isSubmitting}
                  style={{ flex: 1, margin: 0, minWidth: '200px' }}
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
                  disabled={!newMovieTitle.trim() || isSubmitting}
                  style={{ 
                    padding: spacing.md,
                    borderRadius: '50%',
                    aspectRatio: '1',
                    minWidth: '56px',
                    width: '56px',
                    height: '56px',
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
        <Card variant="elevated" style={{ marginBottom: spacing['2xl'] }}>
          <div style={{ padding: spacing.lg }}>
            <Button
              onClick={handleOpenWheel}
              disabled={unwatchedMovies.length < 2}
              variant="secondary"
              size="lg"
              style={{ 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: spacing.sm,
                fontSize: typography.fontSize.xl,
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

        {/* Movie List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {movies && movies.map((movie, index) => (
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
                currentUser={currentUser}
                onToggle={handleToggleWatched}
                onDelete={handleDeleteMovie}
                isSubmitting={isSubmitting}
                index={index}
              />
            </React.Fragment>
          ))}
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
