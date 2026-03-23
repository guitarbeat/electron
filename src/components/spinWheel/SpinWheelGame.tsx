import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import { buildSharedSuggestionUrl } from '@/app/sharedSuggestion';
import { useMovies } from '@/hooks/useMovies';
import { useUser, useToast } from '@/app/providers';
import { trackMetric } from '@/services/analyticsService';
import { shareSuggestionLink } from '@/components/watchlist/watchlistShare';
import { ShareIcon } from '@/common/icons';
import { colors, spacing } from '@/theme/tokens';
import type { Movie } from '@/shared/types';
import {
  buildSpinWheelGradient,
  computeSpinOutcome,
  getSpinCandidates,
  type SpinMode,
} from './spinWheelEngine.ts';
import { useSpinWheelState } from '@/hooks/useSpinWheelState';

interface SpinWheelGameProps {
  onSpinningChange?: (isSpinning: boolean) => void;
}

const todayUtcDate = (): string => new Date().toISOString().slice(0, 10);

const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ onSpinningChange }) => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { movies, isLoading, toggleWatched } = useMovies(currentUser, false);
  const { history, daily, recordSpin } = useSpinWheelState(currentUser, false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);
  const [mode, setMode] = useState<SpinMode>('queue');
  const [isSharing, setIsSharing] = useState(false);
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

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) || null,
    [movies, selectedMovieId]
  );

  const handleSharePick = useCallback(async () => {
    if (!selectedMovie || !currentUser || typeof window === 'undefined') {
      return;
    }

    setIsSharing(true);
    try {
      const shareUrl = buildSharedSuggestionUrl(window.location.href, {
        title: selectedMovie.title,
        suggestedBy: currentUser,
      });
      const shareMethod = await shareSuggestionLink(
        selectedMovie.title,
        currentUser,
        shareUrl
      );
      trackMetric('spin_pick_share_clicked');
      showToast({
        message:
          shareMethod === 'native'
            ? `Share sheet opened for "${selectedMovie.title}".`
            : `Share link copied for "${selectedMovie.title}".`,
        type: 'success',
        duration: 3000,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      showToast({ message: 'Failed to share movie link', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  }, [currentUser, selectedMovie, showToast]);

  const gradient = useMemo(() => buildSpinWheelGradient(candidates.length), [candidates.length]);
  const segmentAngle = candidates.length > 0 ? 360 / candidates.length : 0;
  const previewMovies = useMemo(() => candidates.slice(0, 3), [candidates]);

  const handleSpin = () => {
    if (isSpinning || candidates.length === 0 || !currentUser) return;

    const outcome = computeSpinOutcome(candidates, rotation);
    if (!outcome) {
      return;
    }

    setIsSpinning(true);
    setRotation(outcome.nextRotation);

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      const winner = outcome.winner;
      setSelectedMovieId(winner.id);
      setIsSpinning(false);

      void (async () => {
        const saved = await recordSpin(winner.id, winner.title);
        if (saved) {
          showToast({
            message: `Wheel picked "${winner.title}"`,
            type: 'success',
            duration: 3000,
          });
        } else {
          showToast({
            message:
              'Could not save spin to shared state. Your pick is shown here; Recent picks may be out of date.',
            type: 'error',
            duration: 4000,
          });
        }
      })();

      spinTimeoutRef.current = null;
    }, 4200);
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

  const renderPoster = (movie: Movie, className: string) =>
    movie.posterUrl ? (
      <img src={movie.posterUrl} alt={`${movie.title} poster`} className={className} />
    ) : (
      <div className={`${className} ${className}--fallback`}>
        <span>{movie.title.slice(0, 2).toUpperCase()}</span>
      </div>
    );

  const selectedMovieStatus =
    selectedMovie?.watchedBy.length === 2
      ? 'Watched by both'
      : selectedMovie?.watchedBy.length === 1
        ? `Watched by ${selectedMovie.watchedBy[0]}`
        : 'Unwatched';

  const emptyStateMessage = !currentUser
    ? 'Select Aaron or Electra to load the wheel.'
    : isLoading
      ? 'Loading movies...'
      : movies.length === 0
        ? 'Add movies to spin the wheel.'
        : null;

  const triggerLabel = isSpinning
    ? '...'
    : !currentUser
      ? 'Pick'
      : candidates.length === 0
        ? 'Wait'
        : 'Spin';

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
            {candidates.length} title{candidates.length === 1 ? '' : 's'}
          </strong>
        </div>
        <div className="spin-wheel-summary__item">
          <span className="spin-wheel-summary__label">State</span>
          <strong className="spin-wheel-summary__value">
            {isSpinning ? 'Locked In' : selectedMovie ? 'Winner Ready' : 'Idle'}
          </strong>
        </div>
        {daily && daily.date === todayUtcDate() ? (
          <div className="spin-wheel-summary__item">
            <span className="spin-wheel-summary__label">Today (UTC)</span>
            <strong className="spin-wheel-summary__value">{daily.movieTitle}</strong>
          </div>
        ) : null}
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
              {candidates.map((movie, index) => {
                const angle = segmentAngle * index + segmentAngle / 2;
                const isFlipped = angle > 90 && angle < 270;

                return (
                  <div
                    key={movie.id}
                    className="spin-wheel-segment"
                    style={
                      {
                        '--segment-angle': `${angle}deg`,
                        '--segment-count': `${Math.max(candidates.length, 1)}`,
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
            <button
              type="button"
              className="spin-wheel-trigger"
              onClick={handleSpin}
              disabled={isSpinning || isLoading || candidates.length === 0 || !currentUser}
              aria-label={
                isSpinning
                  ? 'Spinning'
                  : emptyStateMessage ?? 'Spin the wheel'
              }
            >
              <span className="spin-wheel-trigger__label">{triggerLabel}</span>
              <span className="spin-wheel-trigger__subtext">
                {isSpinning ? 'Locked' : emptyStateMessage ? 'Load' : 'Launch'}
              </span>
            </button>
          </div>
        </div>

        <div className="spin-wheel-panel">
          {selectedMovie ? (
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
                  variant={selectedMovie.watchedBy.includes(currentUser) ? 'danger' : 'primary'}
                  size="sm"
                  isLoading={isTogglingWatched}
                  disabled={isTogglingWatched}
                  onClick={toggleWatchedForCurrentUser}
                  className={`spin-result-action ${
                    selectedMovie.watchedBy.includes(currentUser)
                      ? 'spin-result-action--undo'
                      : 'spin-result-action--mark'
                  }`}
                >
                  {selectedMovie.watchedBy.includes(currentUser)
                    ? `Undo watched for ${currentUser}`
                    : `Mark watched by ${currentUser}`}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="spin-wheel-panel__card spin-wheel-panel__card--info">
              <p className="spin-wheel-panel__eyebrow">
                {isSpinning ? 'Spinning Now' : currentUser ? 'Wheel Loaded' : 'Pick A Profile'}
              </p>
              <h3 className="spin-wheel-panel__title">
                {emptyStateMessage ? 'Wheel Offline' : 'Movie Night Roulette'}
              </h3>
              <p className="spin-wheel-panel__copy">
                {emptyStateMessage ??
                  `The wheel is loaded with ${candidates.length} ${
                    mode === 'queue' ? 'queue' : 'total'
                  } titles. Tap the center button and let it decide.`}
              </p>

              {previewMovies.length > 0 ? (
                <div className="spin-wheel-preview-strip" aria-label="Candidate preview">
                  {previewMovies.map((movie) => (
                    <div key={movie.id} className="spin-wheel-preview-strip__item">
                      {renderPoster(movie, 'spin-wheel-preview-strip__poster')}
                      <span className="spin-wheel-preview-strip__title">{movie.title}</span>
                    </div>
                  ))}
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

          {history.length > 0 && (
            <div className="spin-wheel-history">
              <h4 className="spin-wheel-history__title">Recent Picks</h4>
              <ol className="spin-wheel-history__list">
                {history.map((title, index) => (
                  <li key={`${title}-${index}`}>{title}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheelGame;
