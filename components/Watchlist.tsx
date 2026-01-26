import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
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
  SparkleHeartIcon,
  EyeIcon,
  EyeOffIcon,
  TrashIcon
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
import { DashboardCard, SuggestionItemCard } from './DashboardCards';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';

const Watchlist: React.FC = () => {
  const { currentUser, setCurrentUser } = useUser();
  const { movies, isLoading, error, isSubmitting, addMovie, toggleWatched, deleteMovie, refresh: refreshMovies, updateMovieMetadata } = useMovies(currentUser!);
  const { userHasPin, setUserPin, removeUserPin, verifyUserPin } = usePins();
  const { pendingSuggestions, acceptSuggestion, rejectSuggestion, isLoading: isSuggestionsLoading } = useSuggestions();

  const [newMovieTitle, setNewMovieTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isWheelVisible, setIsWheelVisible] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [successMovieId, setSuccessMovieId] = useState<string | null>(null);
  const [processingSuggestionId, setProcessingSuggestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'change'>('set');
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const unwatchedMovies = useMemo(() => movies ? movies.filter(movie => movie.watchedBy.length < 2) : [], [movies]);
  const watchedMovies = useMemo(() => movies ? movies.filter(movie => movie.watchedBy.length === 2) : [], [movies]);
  const firstWatchedIndex = useMemo(() => movies ? movies.findIndex(m => m.watchedBy.length === 2) : -1, [movies]);
  
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
      setToast({ message: "You need at least two unwatched movies to spin the wheel!", type: 'info' });
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

  const handleToggleWatched = useCallback(async (movie: Movie) => {
    try {
      const wasWatched = movie.watchedBy.includes(currentUser!);
      await toggleWatched(movie.id);
      setToast({ 
        message: wasWatched ? `Marked "${movie.title}" as unwatched` : `Marked "${movie.title}" as watched!`, 
        type: 'success' 
      });
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
    }
  }, [toggleWatched, currentUser]);

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
      setToast({ message: "Suggestion rejected", type: 'info' });
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: colors.background }}>
        <div style={{ color: colors.textSecondary }}>Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.background }}>
      <Header 
        currentUser={currentUser!}
        onLogout={handleLogout}
        onPinAction={handlePinAction}
        onRemovePin={() => setShowRemovePinConfirm(true)}
        hasPin={userHasPin(currentUser!)}
      />

      <div style={{ 
        maxWidth: viewMode === 'grid' ? '1200px' : '44rem', 
        margin: '0 auto', 
        padding: `${spacing.lg} ${spacing.md}`,
        transition: 'max-width 0.3s ease'
      }}>
        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: spacing.lg,
            right: spacing.lg,
            padding: `${spacing.md} ${spacing.xl}`,
            backgroundColor: toast.type === 'error' ? colors.error : toast.type === 'success' ? colors.success : colors.secondary,
            color: colors.textPrimary,
            borderRadius: radius.md,
            boxShadow: shadows.card,
            zIndex: 1000,
            animation: 'slide-in 0.3s ease-out',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
          }}>
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
                  placeholder="Enter movie or show title..."
                  disabled={isSubmitting}
                  aria-label="New movie title"
                  style={{ 
                    paddingRight: '120px',
                    borderColor: successMovieId ? colors.success : undefined,
                    transition: 'border-color 0.3s ease'
                  }}
                />
                <div style={{ 
                  position: 'absolute', 
                  right: spacing.sm, 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  gap: spacing.sm,
                  alignItems: 'center'
                }}>
                   <IconButton
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    variant="ghost"
                    size="sm"
                    title={`Switch to ${viewMode === 'list' ? 'Grid' : 'List'} view`}
                  >
                    {viewMode === 'list' ? <LayoutGridIcon /> : <LayoutListIcon />}
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
                      minWidth: '36px',
                      width: '36px',
                      height: '36px',
                      flexShrink: 0,
                    }}
                  >
                    {!isAdding && <PlusIcon style={{ width: '18px', height: '18px' }} />}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        {/* Action Grid (Only in List View) */}
        {viewMode === 'list' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: spacing.md, marginBottom: spacing.xl }}>
             <Button
                onClick={handleOpenWheel}
                disabled={unwatchedMovies.length < 2}
                variant="secondary"
                size="sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}
              >
                <DiceIcon />
                Spin to Decide
              </Button>
          </div>
        )}

        <div style={{
          opacity: isSubmitting ? 0.5 : 1,
          pointerEvents: isSubmitting ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}>
          {viewMode === 'grid' ? (
            <MasonryGrid>
              {/* Primary Action Card */}
              <DashboardCard 
                title="Spin to Decide"
                icon={<DiceIcon style={{ width: '32px', height: '32px' }} />}
                description={unwatchedMovies.length < 2 ? "Needs 2+ movies" : "Pick a random movie!"}
                onClick={handleOpenWheel}
                variant="accent"
                actionLabel="Spin Wheel"
              />

              {/* Individual Suggestions */}
              {pendingSuggestions.map(suggestion => (
                <SuggestionItemCard 
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={handleAcceptSuggestion}
                  onReject={handleRejectSuggestion}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}

              {movies && movies.map((movie) => (
                <MovieItem
                  key={movie.id}
                  movie={movie}
                  currentUser={currentUser!}
                  onToggle={handleToggleWatched}
                  onDelete={handleDeleteMovie}
                  onUpdateMetadata={async (movie, searchTerm) => {
                    const termToCheck = searchTerm || movie.title;
                    setToast({ message: `Fetching details for "${termToCheck}"...`, type: 'info' });
                    const success = await updateMovieMetadata(movie, searchTerm);
                    if (success) {
                        setToast({ message: `Updated details for "${movie.title}"!`, type: 'success' });
                    } else {
                        setToast({ message: `Could not find details for "${termToCheck}"`, type: 'error' });
                    }
                    return success;
                  }}
                  animationDelay="0s"
                  layout="grid"
                />
              ))}
            </MasonryGrid>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {movies && movies.map((movie, index) => (
                <React.Fragment key={movie.id}>
                  {index === firstWatchedIndex && firstWatchedIndex !== -1 && (
                    <div style={{ margin: `${spacing.xl} 0`, display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <hr style={{ flex: 1, border: 'none', borderTop: `1px dashed ${colors.accent}`, opacity: 0.5 }} />
                      <span style={{ color: colors.accent, fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
                        Watched Together ✨
                      </span>
                      <hr style={{ flex: 1, border: 'none', borderTop: `1px dashed ${colors.accent}`, opacity: 0.5 }} />
                    </div>
                  )}
                  <MovieItem
                    movie={movie}
                    currentUser={currentUser!}
                    onToggle={handleToggleWatched}
                    onDelete={handleDeleteMovie}
                    onUpdateMetadata={async (m, s) => updateMovieMetadata(m, s)}
                    animationDelay={`${index * 0.05}s`}
                    layout="list"
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {movies?.length === 0 && !isSuggestionsLoading && (
            <div style={{ textAlign: 'center', padding: spacing['3xl'], color: colors.textSecondary }}>
              <FilmIcon style={{ width: '64px', height: '64px', opacity: 0.3, marginBottom: spacing.md }} />
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

      <SpinWheel
        isOpen={isWheelVisible}
        onClose={() => setIsWheelVisible(false)}
        movies={unwatchedMovies}
        onWinner={(movie) => {
          setToast({ message: `Winner: ${movie.title}!`, type: 'success' });
          setIsWheelVisible(false);
        }}
      />

      <PinDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSubmit={handlePinSubmit}
        mode={pinMode}
        isLoading={isPinLoading}
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
