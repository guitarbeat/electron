import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/LegacyButton';
import { useMovies } from '@/hooks/movies/useMovies';
import { useUser } from '@/app/useProviders';
import { colors, spacing } from '@/theme/tokens';
import type { Movie } from '@/shared/types';
import MovieDetailsModal from '@/components/movies/MovieDetailsModal';
import {
  buildSpinWheelGradient,
  computeSpinOutcome,
  getSpinCandidates,
  getSpinPool,
  type SpinMode,
} from './lib/spinWheelEngine.ts';

interface SpinWheelGameProps {
  onSpinningChange?: (isSpinning: boolean) => void;
}

const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ onSpinningChange }) => {
  const { currentUser } = useUser();
  const { movies, isLoading, toggleWatched } = useMovies(currentUser, false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);
  const [mode, setMode] = useState<SpinMode>('all');
  const [selectedPoolIdSet, setSelectedPoolIdSet] = useState<Set<string>>(new Set());
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onSpinningChange?.(isSpinning);
  }, [isSpinning, onSpinningChange]);

  useEffect(() => {
    return () => {
      onSpinningChange?.(false);
    };
  }, [onSpinningChange]);

  useEffect(() => {
    if (selectedMovieId && !movies.some((movie) => movie.id === selectedMovieId)) {
      setSelectedMovieId(null);
    }
  }, [movies, selectedMovieId]);

  const candidates = useMemo(() => getSpinCandidates(movies, mode), [mode, movies]);
  const spinPool = useMemo(
    () => getSpinPool(movies, mode, selectedPoolIdSet),
    [mode, movies, selectedPoolIdSet]
  );
  const isSubsetActive = selectedPoolIdSet.size > 0;

  useEffect(() => {
    const candidateIds = new Set(candidates.map((movie) => movie.id));
    setSelectedPoolIdSet((current) => {
      const next = new Set<string>();
      let changed = false;
      current.forEach((id) => {
        if (candidateIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : current;
    });
  }, [candidates]);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) || null,
    [movies, selectedMovieId]
  );

  const gradient = useMemo(() => buildSpinWheelGradient(spinPool.length), [spinPool.length]);
  const segmentAngle = spinPool.length > 0 ? 360 / spinPool.length : 0;
  const candidatePreviewMovies = useMemo(() => candidates, [candidates]);

  const handleSpin = () => {
    if (isSpinning || spinPool.length === 0) return;

    setSelectedMovieId(null);

    const outcome = computeSpinOutcome(spinPool, rotation);
    if (!outcome) return;

    setIsSpinning(true);
    setRotation(outcome.nextRotation);

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      setSelectedMovieId(outcome.winner.id);
      setIsSpinning(false);
      spinTimeoutRef.current = null;
    }, 4200);
  };

  const togglePoolSelection = (movieId: string) => {
    setSelectedPoolIdSet((current) => {
      const next = new Set(current);
      if (next.has(movieId)) next.delete(movieId);
      else next.add(movieId);
      return next;
    });
  };

  const toggleWatchedForCurrentUser = async () => {
    if (!selectedMovie || !currentUser || isTogglingWatched) return;
    setIsTogglingWatched(true);
    try {
      await toggleWatched(selectedMovie.id);
    } finally {
      setIsTogglingWatched(false);
    }
  };

  const handleOpenDetails = (movie: Movie) => {
    if (isSpinning) return;
    setModalMovie(movie);
  };

  const renderPoster = (movie: Movie, className: string, clickable = true) => {
    const isActuallyClickable = clickable && !isSpinning;
    const posterContent = movie.posterUrl ? (
      <img src={movie.posterUrl} alt={`${movie.title} poster`} className={className} />
    ) : (
      <div className={`${className} ${className}--fallback`}>
        <span>{movie.title.slice(0, 2).toUpperCase()}</span>
      </div>
    );

    if (!isActuallyClickable) return posterContent;

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleOpenDetails(movie);
        }}
        className={`${className}-click-wrapper`}
        style={{ cursor: 'pointer' }}
        title={`Click for more details about "${movie.title}"`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenDetails(movie);
          }
        }}
      >
        {posterContent}
      </div>
    );
  };

  const selectedMovieStatus =
    selectedMovie?.watchedBy.length === 2
      ? 'Watched by both'
      : selectedMovie?.watchedBy.length === 1
        ? `Watched by ${selectedMovie.watchedBy[0]}`
        : 'Unwatched';


  const emptyStateMessage = isLoading
    ? 'Loading movies...'
    : movies.length === 0
      ? 'Add movies to spin the wheel.'
      : null;

  const triggerLabel = isSpinning ? '...' : spinPool.length === 0 ? 'Wait' : 'Spin';

  return (
    <div className="spin-wheel-shell" style={{ padding: spacing.md, color: colors.textPrimary }}>
      <div className="spin-wheel-summary">
        <div className="spin-wheel-summary__item">
          <span className="spin-wheel-summary__label">Pool</span>
          <strong className="spin-wheel-summary__value">{mode === 'queue' ? 'Queue Only' : 'All Movies'}</strong>
        </div>
        <div className="spin-wheel-summary__item">
          <span className="spin-wheel-summary__label">Candidates</span>
          <strong className="spin-wheel-summary__value">
            {spinPool.length} title{spinPool.length === 1 ? '' : 's'}
          </strong>
        </div>
        <div className="spin-wheel-summary__item">
          <span className="spin-wheel-summary__label">State</span>
          <strong className="spin-wheel-summary__value">
            {isSpinning ? 'Locked In' : selectedMovie ? 'Winner Ready' : 'Idle'}
          </strong>
        </div>
      </div>

      <div className="spin-wheel-mode-bar" role="group" aria-label="Spin wheel pool">
        <button
          type="button"
          className={`spin-wheel-mode-pill ${mode === 'queue' ? 'spin-wheel-mode-pill--active' : ''}`}
          onClick={() => setMode('queue')}
          disabled={isSpinning || isLoading}
          aria-pressed={mode === 'queue'}
        >
          Queue
        </button>
        <button
          type="button"
          className={`spin-wheel-mode-pill ${mode === 'all' ? 'spin-wheel-mode-pill--active' : ''}`}
          onClick={() => setMode('all')}
          disabled={isSpinning || isLoading}
          aria-pressed={mode === 'all'}
        >
          All Movies
        </button>
      </div>

      <div className="spin-wheel-stage">
        <div
          className={`spin-wheel-wrapper ${isSpinning ? 'spin-wheel-wrapper--spinning' : ''} ${
            selectedMovie ? 'spin-wheel-wrapper--result' : ''
          }`}
        >
          <div className="spin-marker" />
          <div className="spin-wheel-container">
          <div
            className="spin-wheel-rotor"
            style={{
              transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? 'transform 4.2s cubic-bezier(0.12, 0.85, 0.18, 1)'
                  : 'transform 0.4s ease',
              }}
            >
              <div className="spin-wheel" style={{ background: gradient }} />
              <div className="spin-wheel-gloss" />
              {spinPool.map((movie, index) => {
                const angle = segmentAngle * index + segmentAngle / 2;
                const isFlipped = angle > 90 && angle < 270;

                return (
                  <div
                    key={movie.id}
                    className="spin-wheel-segment"
                    style={
                      {
                        '--segment-angle': `${angle}deg`,
                        '--segment-count': `${Math.max(spinPool.length, 1)}`,
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className={`spin-wheel-segment__content ${
                        isFlipped ? 'spin-wheel-segment__content--flipped' : ''
                      }`}
                    >
                      {renderPoster(movie, 'spin-wheel-segment__poster')}
                      <span className="spin-wheel-segment__title">{movie.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="spin-wheel-rim" />
            <div className="spin-hub" />
            {currentUser ? (
              <button
                type="button"
                className="spin-wheel-trigger"
                onClick={handleSpin}
                disabled={isSpinning || isLoading || spinPool.length === 0}
                aria-label={isSpinning ? 'Spinning' : emptyStateMessage ?? 'Spin the wheel'}
              >
                <span className="spin-wheel-trigger__label">{triggerLabel}</span>
                <span className="spin-wheel-trigger__subtext">
                  {isSpinning ? 'Locked' : emptyStateMessage ? 'Load' : 'Launch'}
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="spin-wheel-panel">
          {selectedMovie ? (() => {
            const isWatchedByCurrentUser = currentUser ? selectedMovie.watchedBy.includes(currentUser) : false;
            return (
              <div className="result-display-container spin-wheel-panel__card spin-wheel-panel__card--result">
              <p className="spin-wheel-panel__eyebrow">Tonight&apos;s Pick</p>
              <h3 className="current-movie-title current-movie-title--result">{selectedMovie.title}</h3>
              <p className="spin-wheel-panel__meta">
                {selectedMovie.year || 'Unknown year'} {selectedMovie.genre ? `· ${selectedMovie.genre}` : ''}
              </p>
              <p className="spin-wheel-panel__status">{selectedMovieStatus}</p>
              {renderPoster(selectedMovie, 'spin-wheel-panel__poster')}
              {selectedMovie.plot ? <p className="spin-wheel-panel__copy">{selectedMovie.plot}</p> : null}
              {currentUser ? (
                <Button
                  variant={isWatchedByCurrentUser ? 'danger' : 'primary'}
                  size="sm"
                  isLoading={isTogglingWatched}
                  disabled={isTogglingWatched}
                  onClick={toggleWatchedForCurrentUser}
                  className={`spin-result-action ${
                    isWatchedByCurrentUser
                      ? 'spin-result-action--undo'
                      : 'spin-result-action--mark'
                  }`}
                >
                  {isWatchedByCurrentUser
                    ? `Undo watched for ${currentUser}`
                    : `Mark watched by ${currentUser}`}
                </Button>
              ) : null}
            </div>
            );
          })() : (
            <div className="spin-wheel-panel__card spin-wheel-panel__card--info">
              <p className="spin-wheel-panel__eyebrow">
                {isSpinning ? 'Spinning Now' : 'Wheel Loaded'}
              </p>
              <h3 className="spin-wheel-panel__title">
                {emptyStateMessage ? 'Wheel Offline' : 'Movie Night Roulette'}
              </h3>
              <p className="spin-wheel-panel__copy">
                {emptyStateMessage ??
                  `The wheel is loaded with ${spinPool.length} ${
                    mode === 'queue' ? 'queue' : 'total'
                  } titles. Tap the center button and let it decide.`}
              </p>

              {candidatePreviewMovies.length > 0 ? (
                <div
                  className="spin-wheel-preview-strip"
                  aria-label="Candidate preview"
                  style={{
                    display: 'grid',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '4.5rem',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.15rem',
                  }}
                >
                  {candidatePreviewMovies.map((movie) => {
                    const isSelected = selectedPoolIdSet.has(movie.id);

                    return (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => togglePoolSelection(movie.id)}
                        onDoubleClick={() => setModalMovie(movie)}
                        aria-label={movie.title}
                        aria-pressed={isSelected}
                        title={movie.title}
                      style={{
                        appearance: 'none',
                        border: 'none',
                        padding: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                          opacity: isSelected || !isSubsetActive ? 1 : 0.5,
                        transform: isSelected ? 'translateY(-2px) scale(1.02)' : 'scale(0.98)',
                        transition: 'transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease',
                      }}
                      >
                        <div
                          style={{
                            width: '4.5rem',
                            aspectRatio: '2 / 3',
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: isSelected
                              ? '0 0 0 2px var(--color-accent), 0 14px 24px rgba(0,0,0,0.35)'
                              : '0 10px 18px rgba(0,0,0,0.25)',
                          }}
                        >
                          {renderPoster(movie, 'spin-wheel-preview-strip__poster', false)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          <div className="spin-wheel-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedMovieId(null)}
              disabled={isSpinning || !selectedMovieId}
              className="spin-wheel-action"
            >
              Clear Result
            </Button>
          </div>

        </div>
      </div>

      {modalMovie && (
        <MovieDetailsModal
          movie={modalMovie}
          isOpen={!!modalMovie}
          onClose={() => setModalMovie(null)}
        />
      )}
    </div>
  );
};

export default SpinWheelGame;
