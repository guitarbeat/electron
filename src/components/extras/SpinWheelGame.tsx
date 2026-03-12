import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/ui/Button';
import { useMovies } from '@/hooks/useMovies';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { colors, spacing, typography, radius } from '@/design-system/tokens';
import type { Movie } from '@/types';

const SEGMENT_COLORS = ['#ff7ea8', '#6ad6ff', '#ffd166', '#7ee08c', '#c7a0ff', '#ff9f68'];
const SPIN_HISTORY_KEY = 'spinWheelHistory';
const SPIN_HISTORY_MAX = 10;

type SpinMode = 'queue' | 'all';

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

const SpinWheelGame: React.FC = () => {
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { movies, isLoading, toggleWatched } = useMovies(currentUser, false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
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

  const candidates = useMemo(() => {
    if (mode === 'all') return movies;
    const queue = movies.filter((movie) => movie.watchedBy.length < 2);
    return queue.length > 0 ? queue : movies;
  }, [mode, movies]);

  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) || null,
    [movies, selectedMovieId]
  );

  const gradient = useMemo(() => {
    if (candidates.length === 0) {
      return 'conic-gradient(#444, #222)';
    }
    const step = 360 / candidates.length;
    const parts = candidates.map((_, index) => {
      const start = Math.round(index * step);
      const end = Math.round((index + 1) * step);
      return `${SEGMENT_COLORS[index % SEGMENT_COLORS.length]} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [candidates]);

  const handleSpin = () => {
    if (isSpinning || candidates.length === 0) return;

    const targetIndex = Math.floor(Math.random() * candidates.length);
    const step = 360 / candidates.length;
    const targetCenterDeg = targetIndex * step + step / 2;
    const pointerDeg = 0;
    const normalizedTarget = (360 - targetCenterDeg + pointerDeg + 360) % 360;
    const nextRotation = rotation + 360 * 6 + normalizedTarget;

    setIsSpinning(true);
    setRotation(nextRotation);

    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }

    spinTimeoutRef.current = window.setTimeout(() => {
      const winner = candidates[targetIndex];
      setSelectedMovieId(winner.id);

      const nextHistory = [winner.title, ...history].slice(0, SPIN_HISTORY_MAX);
      setHistory(nextHistory);
      writeHistory(nextHistory);

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
    if (!selectedMovie || !currentUser) return;
    await toggleWatched(selectedMovie.id);
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
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
          marginBottom: spacing.md,
        }}
      >
        <Button onClick={handleSpin} variant="primary" size="md" disabled={isSpinning || isLoading}>
          {isSpinning ? 'Spinning...' : 'Spin Wheel'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setSelectedMovieId(null)}>
          Clear Result
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode((prev) => (prev === 'queue' ? 'all' : 'queue'))}
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
            <Button variant="secondary" size="sm" onClick={toggleWatchedForCurrentUser}>
              {selectedMovie.watchedBy.includes(currentUser)
                ? `Undo watched for ${currentUser}`
                : `Mark watched by ${currentUser}`}
            </Button>
          ) : (
            <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.textSecondary }}>
              Select Aaron or Electra to mark watched.
            </p>
          )}
        </div>
      ) : (
        <p style={{ margin: 0, textAlign: 'center', color: colors.textSecondary }}>
          {isLoading ? 'Loading movies...' : 'Spin to pick a movie from your list.'}
        </p>
      )}

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
