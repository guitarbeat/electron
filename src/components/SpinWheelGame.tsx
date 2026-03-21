import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import { useMovies } from '@/hooks/useMovies';
import { useUser, useToast } from '@/context';
import { colors, spacing, typography, radius } from '@/design-system';
import type { Movie } from '@/types';
import {
  SPIN_HISTORY_MAX,
  appendSpinHistory,
  buildSpinWheelGradient,
  computeSpinOutcome,
  getSpinCandidates,
  type SpinMode,
} from '@/components/spinWheel/spinWheelGame';

const SPIN_HISTORY_KEY = 'spinWheelHistory';

interface SpinWheelGameProps {
  onSpinningChange?: (isSpinning: boolean) => void;
}

const readHistory = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SPIN_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, SPIN_HISTORY_MAX) : [];
  } catch {
    return [];
  }
};

const writeHistory = (history: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPIN_HISTORY_KEY, JSON.stringify(history.slice(0, SPIN_HISTORY_MAX)));
};

const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ onSpinningChange }) => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { movies, isLoading, toggleWatched } = useMovies(currentUser, false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);
  const [mode, setMode] = useState<SpinMode>('queue');
  const [history, setHistory] = useState<string[]>(readHistory);
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

  const gradient = useMemo(() => buildSpinWheelGradient(candidates.length), [candidates.length]);

  const handleSpin = () => {
    if (isSpinning || candidates.length === 0) return;

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
      setHistory((currentHistory) => {
        const nextHistory = appendSpinHistory(currentHistory, winner.title, SPIN_HISTORY_MAX);
        writeHistory(nextHistory);
        return nextHistory;
      });

      setIsSpinning(false);
      showToast({
        message: `Wheel picked "${winner.title}"`,
        type: 'success',
        duration: 3000,
      });
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

  const renderMovieMeta = (movie: Movie) => {
    const statusLabel =
      movie.watchedBy.length === 2
        ? 'Watched by both'
        : movie.watchedBy.length === 1
          ? `Watched by ${movie.watchedBy[0]}`
          : 'Unwatched';

    return (
      <>
        <p style={{ marginTop: 0, marginBottom: spacing.xs, color: colors.textSecondary }}>
          Tonight&apos;s pick
        </p>
        <h3 className="current-movie-title current-movie-title--result">{movie.title}</h3>
        <p style={{ marginBottom: spacing.xs, color: colors.textSecondary }}>
          {movie.year || 'Unknown year'} {movie.genre ? `· ${movie.genre}` : ''}
        </p>
        <p style={{ marginTop: 0, marginBottom: spacing.md, color: colors.textSecondary }}>
          {statusLabel}
        </p>
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            style={{
              width: 140,
              height: 200,
              objectFit: 'cover',
              borderRadius: radius.md,
              margin: `0 auto ${spacing.sm}`,
              border: `1px solid ${colors.borderSecondary}35`,
            }}
          />
        ) : null}
        {movie.plot ? (
          <p
            style={{
              marginTop: 0,
              marginBottom: spacing.md,
              color: colors.textPrimary,
              maxWidth: 480,
            }}
          >
            {movie.plot}
          </p>
        ) : null}
      </>
    );
  };

  const emptyStateMessage = isLoading
    ? 'Loading movies...'
    : movies.length === 0
      ? 'No movies available.'
      : null;

  return (
    <div style={{ padding: spacing.md, color: colors.textPrimary }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing.md }}>
        <div className="spin-wheel-container" style={{ width: 320, height: 320, minHeight: 320 }}>
          <div className="spin-marker" />
          <div
            className="spin-wheel"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 4.2s cubic-bezier(0.12, 0.85, 0.18, 1)'
                : 'transform 0.4s ease',
            }}
          />
          <div className="spin-hub" />
        </div>
      </div>

      <div
        className="spin-wheel-actions"
      >
        <Button
          onClick={handleSpin}
          variant="primary"
          size="md"
          disabled={isSpinning || isLoading || candidates.length === 0}
          className="spin-wheel-action"
        >
          {isSpinning ? 'Spinning...' : 'Spin Wheel'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedMovieId(null)}
          disabled={isSpinning || !selectedMovieId}
          className="spin-wheel-action"
        >
          Clear Result
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode((prev) => (prev === 'queue' ? 'all' : 'queue'))}
          disabled={isSpinning || candidates.length === 0}
          className="spin-wheel-action spin-wheel-action--mode"
        >
          Mode: {mode === 'queue' ? 'Queue Only' : 'All Movies'}
        </Button>
      </div>

      <p
        style={{
          marginTop: 0,
          marginBottom: spacing.sm,
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: typography.fontSize.sm,
        }}
      >
        {candidates.length} candidate{candidates.length === 1 ? '' : 's'} available
      </p>

      {selectedMovie ? (
        <div
          className="result-display-container"
          style={{ maxWidth: 560, margin: '0 auto', pointerEvents: 'auto' }}
        >
          {renderMovieMeta(selectedMovie)}
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
      ) : emptyStateMessage ? (
        <p style={{ margin: 0, textAlign: 'center', color: colors.textSecondary }}>
          {emptyStateMessage}
        </p>
      ) : null}

      {history.length > 0 && (
        <div style={{ marginTop: spacing.md }}>
          <h4 style={{ margin: `0 0 ${spacing.xs}`, color: colors.textSecondary }}>Recent Picks</h4>
          <ol style={{ margin: 0, paddingLeft: spacing.lg, color: colors.textPrimary }}>
            {history.map((title, index) => (
              <li key={`${title}-${index}`}>{title}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default SpinWheelGame;
