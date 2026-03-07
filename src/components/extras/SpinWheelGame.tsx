import React, { useMemo, useState } from 'react';
import Button from '@/ui/Button';
import { useMovies } from '@/hooks/useMovies';
import { useUser } from '@/context/UserContext';
import { colors, spacing, typography } from '@/design-system/tokens';

const SEGMENT_COLORS = ['#ff7ea8', '#6ad6ff', '#ffd166', '#7ee08c', '#c7a0ff', '#ff9f68'];

const SpinWheelGame: React.FC = () => {
  const { currentUser } = useUser();
  const { movies, isLoading, toggleWatched } = useMovies(currentUser, false);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const unwatched = movies.filter((movie) => movie.watchedBy.length < 2);
    return unwatched.length > 0 ? unwatched : movies;
  }, [movies]);

  const selectedMovie = useMemo(
    () => candidates.find((movie) => movie.id === selectedMovieId) || null,
    [candidates, selectedMovieId]
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

    window.setTimeout(() => {
      const winner = candidates[targetIndex];
      setSelectedMovieId(winner.id);
      setHistory((prev) => [winner.title, ...prev].slice(0, 6));
      setIsSpinning(false);
    }, 4200);
  };

  const markWatched = async () => {
    if (!selectedMovie || !currentUser) return;
    if (selectedMovie.watchedBy.includes(currentUser)) return;
    await toggleWatched(selectedMovie.id);
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
      </div>

      {selectedMovie ? (
        <div
          className="result-display-container"
          style={{ maxWidth: 540, margin: '0 auto', pointerEvents: 'auto' }}
        >
          <p style={{ marginTop: 0, marginBottom: spacing.xs, color: colors.textSecondary }}>
            Tonight&apos;s pick
          </p>
          <h3 className="current-movie-title current-movie-title--result">{selectedMovie.title}</h3>
          <p style={{ marginBottom: spacing.md, color: colors.textSecondary }}>
            {selectedMovie.year || 'Unknown year'}{' '}
            {selectedMovie.genre ? `· ${selectedMovie.genre}` : ''}
          </p>
          {currentUser ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={markWatched}
              disabled={selectedMovie.watchedBy.includes(currentUser)}
            >
              {selectedMovie.watchedBy.includes(currentUser)
                ? `Already watched by ${currentUser}`
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
          {isLoading ? 'Loading movies...' : 'Spin to pick a movie from your queue.'}
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
