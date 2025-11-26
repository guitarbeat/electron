import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { Movie } from '../types';
import { PlusIcon, TrashIcon, EyeIcon, EyeOffIcon, Spinner, SparkleHeartIcon, LogoutIcon, DiceIcon } from './icons';
import SpinWheel from './SpinWheel';
import Header from './Header';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, shadows } from '../design-system/tokens';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  // FIX: Added non-null assertion as currentUser is guaranteed to exist in this component.
  const { movies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie } = useMovies(currentUser!);

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);

  const unwatchedMovies = movies ? movies.filter(movie => movie.watchedBy.length < 2) : [];

  const handleOpenWheel = () => {
    if (unwatchedMovies.length > 1) {
        setIsWheelVisible(true);
    } else {
        alert("You need at least two unwatched movies to spin the wheel!");
    }
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMovieTitle.trim() && !isSubmitting) {
      setIsAdding(true);
      try {
        await addMovie(newMovieTitle);
        setNewMovieTitle('');
      } catch (err: any) {
        alert(`Error adding movie: ${err.message}`);
      }
      finally {
        setIsAdding(false);
      }
    }
  };

  const handleToggleWatched = async (movieId: string) => {
    try {
      await toggleWatched(movieId);
    } catch (err: any) {
      alert(`Error updating movie status: ${err.message}`);
    }
  }

  const handleDeleteMovie = async (movieId: string) => {
    try {
      await deleteMovie(movieId);
    } catch (err: any) {
      alert(`Error deleting movie: ${err.message}`);
    }
  }

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const getWatchedStatus = (movie: Movie) => {
    const aaronWatched = movie.watchedBy.includes('Aaron');
    const electraWatched = movie.watchedBy.includes('Electra');
    if (aaronWatched && electraWatched) return "Watched by both";
    if (aaronWatched) return "Watched by Aaron";
    if (electraWatched) return "Watched by Electra";
    return "Not watched yet";
  };
  
  const firstWatchedIndex = movies ? movies.findIndex(m => m.watchedBy.length === 2) : -1;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
        <Spinner style={{ width: '48px', height: '48px', color: colors.accent }} />
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
      <div>
        <Header />
        
        {/* Add Movie Form */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <form onSubmit={handleAddMovie} style={{ padding: spacing.lg }} className="add-movie-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center', width: '100%' }}>
                <IconButton
                  type="button"
                  onClick={handleLogout}
                  title="Switch User"
                  variant="ghost"
                  style={{ flexShrink: 0 }}
                >
                  <LogoutIcon />
                </IconButton>
                <Input
                  type="text"
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="Enter movie title..."
                  disabled={isSubmitting}
                  style={{ flex: 1, margin: 0 }}
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
                  title="Add movie"
                >
                  {!isAdding && <PlusIcon />}
                </Button>
              </div>
            </div>
          </form>
        </Card>
        
        {/* Spin to Decide card */}
        <Card variant="elevated" style={{ marginBottom: spacing['2xl'] }}>
          <div style={{ padding: spacing.md }}>
            <Button
              onClick={handleOpenWheel}
              disabled={unwatchedMovies.length < 2}
              variant="secondary"
              size="lg"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}
              title={unwatchedMovies.length < 2 ? "Add more unwatched movies to use the wheel" : "Spin the wheel to pick a movie!"}
            >
              <DiceIcon />
              Spin to Decide
            </Button>
          </div>
        </Card>

        {/* Movie List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {movies && movies.map((movie, index) => {
            const watchedByCurrentUser = movie.watchedBy.includes(currentUser!);
            const watchedByBoth = movie.watchedBy.length === 2;

            return (
              <React.Fragment key={movie.id}>
                {index === firstWatchedIndex && firstWatchedIndex !== -1 && (
                    <div className="flex items-center my-6 animate-fade-in" style={{ margin: `${spacing.xl} 0` }}>
                        <hr className="flex-grow border-pink-400 border-dashed" style={{ flex: 1, height: '1px', borderColor: colors.accent, borderStyle: 'dashed' }} />
                        <span className="px-4 text-pink-300 font-heading" style={{ 
                          padding: `0 ${spacing.md}`, 
                          color: colors.accent, 
                          fontSize: typography.fontSize.sm, 
                          fontWeight: typography.fontWeight.medium,
                          textShadow: shadows.textGlow,
                          letterSpacing: '0.05em',
                        }}>
                          Watched Together
                        </span>
                        <hr className="flex-grow border-pink-400 border-dashed" style={{ flex: 1, height: '1px', borderColor: colors.accent, borderStyle: 'dashed' }} />
                    </div>
                )}
                <Card 
                  variant={watchedByBoth ? 'elevated' : 'default'}
                  className={watchedByBoth ? 'animate-pink-glow' : ''}
                  style={{
                    padding: spacing.lg,
                    opacity: watchedByCurrentUser && !watchedByBoth ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    {watchedByBoth && (
                      <div style={{ color: colors.accent, flexShrink: 0 }}>
                        <SparkleHeartIcon />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                      <h3 className="movie-title" style={{
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                        color: watchedByBoth ? colors.textSecondary : colors.textPrimary,
                        textDecoration: watchedByBoth ? 'line-through' : 'none',
                        margin: 0,
                        marginBottom: spacing.sm,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        textShadow: watchedByBoth ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)',
                        transition: 'all 0.2s ease-out',
                        letterSpacing: '0.02em',
                        lineHeight: typography.lineHeight.normal,
                      }}>
                        {movie.title}
                      </h3>
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                        margin: 0,
                        letterSpacing: '0.01em',
                      }}>
                        Added by {movie.addedBy} • {getWatchedStatus(movie)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexShrink: 0 }}>
                      <IconButton
                        onClick={() => handleToggleWatched(movie.id)}
                        disabled={isSubmitting}
                        variant="ghost"
                        title={watchedByCurrentUser ? "Mark as unwatched" : "Mark as watched"}
                      >
                        {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteMovie(movie.id)}
                        disabled={isSubmitting}
                        variant="danger"
                        title="Delete movie"
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              </React.Fragment>
            )
          })}
          {movies?.length === 0 && (
              <Card variant="default">
                <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.textSecondary }}>
                  <p style={{ margin: 0, marginBottom: spacing.sm, fontSize: typography.fontSize.base }}>
                    Your movie list is empty
                  </p>
                  <p style={{ margin: 0, fontSize: typography.fontSize.sm }}>
                    Add a movie to get started
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
