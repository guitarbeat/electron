import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import FixMatchDialog from './FixMatchDialog';
import { useUser } from '../context/UserContext';
import { useMovies } from '../hooks/useMovies';
import { useSuggestions } from '../hooks/useSuggestions';
import { Movie, MovieSuggestion } from '../types';
import { PlusIcon, DiceIcon, FilmIcon, LockIcon, LayoutGridIcon, LayoutListIcon } from './icons';
import SpinWheel from './SpinWheel';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import IconButton from './ui/IconButton';
import ConfirmDialog from './ui/ConfirmDialog';
import MovieItem from './MovieItem';
import MasonryGrid from './ui/MasonryGrid';
import Confetti from './effects/Confetti';
import { SuggestionItemCard } from './DashboardCards';
import MemoryWall from './MemoryWall';
import GuestBubbleNameEditor from './GuestBubbleNameEditor';
import {
  useGuestProfile,
  MAX_GUEST_NAME_LENGTH,
  normalizeGuestName,
  isReservedProfileName,
} from '../hooks/useGuestProfile';
import { spacing, typography, colors, shadows, radius } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

type ContentTab = 'all' | 'to-watch' | 'watched' | 'suggestions';
type SortMode = 'recent' | 'title' | 'year';
const MAX_SUGGESTION_TITLE_LENGTH = 120;

interface WatchlistProps {
  surface: 'queue' | 'memories';
}

const getGuestInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return '';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('').slice(0, 2);
};

const Watchlist: React.FC<WatchlistProps> = ({ surface }) => {
  const { currentUser } = useUser();
  const { guestName, hasGuestName, setGuestName, clearGuestName } = useGuestProfile();
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
  } = useMovies(currentUser);
  const {
    pendingSuggestions,
    addSuggestion,
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
  const [guestNameDraft, setGuestNameDraft] = useState(guestName);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isGuestSaveConfirmed, setIsGuestSaveConfirmed] = useState(false);
  const [isGuestBubbleOpen, setIsGuestBubbleOpen] = useState(() => !guestName);
  const [movieToFix, setMovieToFix] = useState<Movie | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const previousMoviesRef = useRef<Movie[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guestInitials = getGuestInitials(guestName);
  const guestMotionEasing = 'cubic-bezier(0.22, 1, 0.36, 1)';

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
  const isSpinLocked = !currentUser;
  const moviesNeededForSpin = Math.max(0, 2 - unwatchedMovies.length);
  const canSpin = Boolean(currentUser) && moviesNeededForSpin === 0;
  const isQueueSurface = surface === 'queue';
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


  useEffect(() => {
    if (!isGuestBubbleOpen) {
      setGuestNameDraft(guestName);
      setGuestError(null);
    }
  }, [guestName, isGuestBubbleOpen]);

  useEffect(() => {
    if (!isGuestSaveConfirmed) return;
    const timer = setTimeout(() => setIsGuestSaveConfirmed(false), 1500);
    return () => clearTimeout(timer);
  }, [isGuestSaveConfirmed]);

  useEffect(() => {
    if (currentUser) {
      setIsGuestBubbleOpen(false);
      return;
    }

    if (!hasGuestName) {
      setIsGuestBubbleOpen(true);
    }
  }, [currentUser, hasGuestName]);

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

  const handleSaveGuestBubble = () => {
    const normalizedName = normalizeGuestName(guestNameDraft);

    if (!normalizedName) {
      setGuestError('Add a guest name to continue.');
      return;
    }

    if (isReservedProfileName(normalizedName)) {
      setGuestError('Use Aaron or Electra bubbles for those names.');
      return;
    }

    setGuestName(normalizedName);
    setGuestNameDraft(normalizedName);
    setGuestError(null);
    setIsGuestSaveConfirmed(true);
    setIsGuestBubbleOpen(false);
    setToast({ message: `Guest bubble saved as "${normalizedName}"`, type: 'success' });
  };

  const handleResetGuestBubble = () => {
    clearGuestName();
    setGuestNameDraft('');
    setGuestError(null);
    setIsGuestSaveConfirmed(false);
    setIsGuestBubbleOpen(true);
    setToast({ message: 'Guest bubble removed.', type: 'info' });
  };

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newMovieTitle.trim();
    const guestAuthor = guestName.trim();

    if (!title || isSubmitting || isAdding) {
      return;
    }

    if (!currentUser && !guestAuthor) {
      setToast({ message: 'Create your guest bubble before suggesting a movie.', type: 'info' });
      setIsGuestBubbleOpen(true);
      return;
    }

    if (!currentUser && isReservedProfileName(guestAuthor)) {
      setToast({
        message: 'If this is Aaron or Electra, select that profile above to add directly.',
        type: 'info',
      });
      return;
    }

    setIsAdding(true);
    try {
      if (currentUser) {
        await addMovie(title);
        setToast({ message: `"${title}" added successfully!`, type: 'success' });
      } else {
        await addSuggestion(title, guestAuthor);
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
          maxWidth: isQueueSurface ? (viewMode === 'grid' ? '1200px' : '44rem') : '960px',
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

        {isQueueSurface && (
          <>
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
                    : 'Create a guest bubble once, then suggest in one tap.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setGuestError(null);
                      setGuestNameDraft(guestName);
                      setIsGuestBubbleOpen((isOpen) => !isOpen || !hasGuestName);
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = 'translateY(-1px)';
                      event.currentTarget.style.filter = 'brightness(1.04)';
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = 'translateY(0)';
                      event.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.transform = 'translateY(-1px)';
                      event.currentTarget.style.filter = 'brightness(1.04)';
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.transform = 'translateY(0)';
                      event.currentTarget.style.filter = 'brightness(1)';
                    }}
                    onMouseDown={(event) => {
                      event.currentTarget.style.transform = 'translateY(1px) scale(0.99)';
                    }}
                    onMouseUp={(event) => {
                      event.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    style={{
                      minHeight: '44px',
                      borderRadius: radius.full,
                      border: `1px solid ${hasGuestName ? '#8ed0ff8c' : '#ffcb8a8a'}`,
                      background:
                        'radial-gradient(circle at 28% 20%, rgba(255,255,255,0.2), rgba(255,255,255,0)), linear-gradient(145deg, rgba(34, 56, 95, 0.92), rgba(22, 36, 65, 0.94))',
                      color: colors.textPrimary,
                      padding: `0 ${spacing.sm}`,
                      fontSize: typography.fontSize.xs,
                      fontFamily:
                        "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      boxShadow: hasGuestName
                        ? '0 0 16px rgba(114, 186, 245, 0.34), inset 0 1px 0 rgba(255,255,255,0.18)'
                        : '0 0 14px rgba(255, 196, 125, 0.26), inset 0 1px 0 rgba(255,255,255,0.14)',
                      transform: 'translateY(0)',
                      filter: 'brightness(1)',
                      transition: `transform 160ms ${guestMotionEasing}, box-shadow 180ms ${guestMotionEasing}, filter 160ms ${guestMotionEasing}`,
                    }}
                    aria-label={guestName ? 'Edit guest bubble name' : 'Create guest bubble'}
                    title={guestName ? 'Edit guest bubble name' : 'Create guest bubble'}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: '#eaf5ff',
                        border: '1px solid rgba(166, 216, 255, 0.65)',
                        background:
                          'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.36), rgba(255,255,255,0)), linear-gradient(145deg, rgba(59, 104, 161, 0.95), rgba(36, 66, 120, 0.95))',
                      }}
                    >
                      {guestInitials || '+'}
                    </span>
                    <span>{guestName ? `Guest: ${guestName}` : 'Create Guest Bubble'}</span>
                    <span
                      style={{
                        borderRadius: radius.full,
                        border: `1px solid ${
                          isGuestSaveConfirmed ? '#ffd899aa' : hasGuestName ? '#9bd8ff88' : '#ffd29a88'
                        }`,
                        padding: '2px 8px',
                        fontSize: '0.62rem',
                        color: isGuestSaveConfirmed
                          ? '#fff1d8'
                          : hasGuestName
                            ? '#cde9ff'
                            : '#ffe1bc',
                        background: isGuestSaveConfirmed
                          ? 'rgba(255, 206, 138, 0.2)'
                          : hasGuestName
                            ? 'rgba(126, 194, 252, 0.16)'
                            : 'rgba(255, 194, 122, 0.14)',
                        transition: `all 180ms ${guestMotionEasing}`,
                      }}
                    >
                      {isGuestSaveConfirmed ? 'Saved' : hasGuestName ? 'Edit' : 'Create'}
                    </span>
                  </button>
                )}

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
              <span>
                {currentUser
                  ? 'Press Enter to add quickly.'
                  : guestName
                    ? `Suggesting as ${guestName}`
                    : 'Create a guest bubble to suggest titles.'}
              </span>
              <span>
                {newMovieTitle.length}/{MAX_SUGGESTION_TITLE_LENGTH}
              </span>
            </div>
            {!currentUser &&
              (isGuestBubbleOpen ? (
                <GuestBubbleNameEditor
                  draftName={guestNameDraft}
                  savedName={guestName}
                  error={guestError}
                  isMobile={isMobile}
                  disabled={isSubmitting || isAdding}
                  onDraftChange={(value) => {
                    setGuestNameDraft(value.slice(0, MAX_GUEST_NAME_LENGTH));
                    setGuestError(null);
                  }}
                  onSave={handleSaveGuestBubble}
                  onClear={handleResetGuestBubble}
                  isSaveConfirmed={isGuestSaveConfirmed}
                  onClose={() => {
                    setGuestNameDraft(guestName);
                    setGuestError(null);
                    setIsGuestBubbleOpen(false);
                  }}
                />
              ) : (
                <div
                  style={{
                    marginTop: spacing.sm,
                    padding: spacing.sm,
                    border: `1px solid ${colors.borderSecondary}35`,
                    borderRadius: radius.full,
                    background:
                      'radial-gradient(circle at 22% 15%, rgba(255,255,255,0.16), rgba(255,255,255,0)), rgba(19, 31, 58, 0.66)',
                    color: '#d8ecff',
                    fontSize: typography.fontSize.xs,
                    fontFamily:
                      "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                    letterSpacing: '0.04em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    boxShadow: '0 0 16px rgba(116, 180, 235, 0.25)',
                    transition: `all 220ms ${guestMotionEasing}`,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(170, 217, 255, 0.6)',
                      background: 'rgba(69, 117, 173, 0.65)',
                      color: '#f1f8ff',
                      fontSize: '0.62rem',
                    }}
                  >
                    {guestInitials || 'G'}
                  </span>
                  Guest bubble active: {guestName}
                </div>
              ))}

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
                disabled={
                  isSubmitting ||
                  isAdding ||
                  !newMovieTitle.trim() ||
                  (!currentUser && !hasGuestName)
                }
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

          {/* Combined Spin Wheel Header/Card */}
          <Card
            variant="elevated"
            className={currentUser && !canSpin ? 'neon-pulse' : undefined}
            style={{
              marginBottom: spacing.xl,
              padding: isMobile ? spacing.md : spacing.lg,
              border: `1px solid ${canSpin ? colors.secondary : colors.borderSecondary}55`,
              background: isSpinLocked
                ? 'linear-gradient(135deg, rgba(24, 33, 57, 0.92) 0%, rgba(16, 23, 42, 0.95) 100%)'
                : canSpin
                  ? 'linear-gradient(135deg, rgba(18, 54, 90, 0.95) 0%, rgba(20, 39, 78, 0.92) 100%)'
                  : 'linear-gradient(135deg, rgba(80, 28, 66, 0.96) 0%, rgba(53, 21, 74, 0.92) 100%)',
              boxShadow: isSpinLocked
                ? shadows.card
                : canSpin
                  ? shadows.glowBlue
                  : shadows.glowStrong,
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
              <h2
                style={{
                  margin: 0,
                  marginBottom: spacing.xs,
                  color: colors.textPrimary,
                  fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                {!currentUser ? 'Movie Spin Wheel' : 'Spin the Wheel'}
              </h2>
              {!canSpin && currentUser && (
                <p
                  style={{
                    margin: 0,
                    color: colors.textSecondary,
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.lineHeight.normal,
                  }}
                >
                  Add {moviesNeededForSpin} more unwatched{' '}
                  {moviesNeededForSpin === 1 ? 'movie' : 'movies'}.
                </p>
              )}
            </div>
            <Button
              onClick={handleOpenWheel}
              variant={canSpin ? 'secondary' : 'ghost'}
              size={isMobile ? 'sm' : 'md'}
              style={{
                width: isMobile ? '100%' : 'auto',
                minWidth: isMobile ? '100%' : '180px',
                fontWeight: typography.fontWeight.bold,
                letterSpacing: '0.04em',
                border: canSpin ? undefined : `1px solid ${colors.borderSecondary}40`,
              }}
              aria-label={!currentUser ? 'Login to spin the wheel' : 'Open spin wheel'}
            >
              {!currentUser ? <LockIcon /> : <DiceIcon />}
              {!currentUser
                ? 'Pick Profile First'
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
      </>
    )}

        {surface === 'memories' && (
          <MemoryWall watchedMovies={watchedMovies} currentUser={currentUser} />
        )}
      </div>

      {isQueueSurface && (
        <>
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
        </>
      )}
    </div>
  );
};

export default memo(Watchlist);
