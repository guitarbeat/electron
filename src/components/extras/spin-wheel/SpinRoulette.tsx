import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '@/types;
import { colors, typography } from '@/design-system/tokens;
import ImageWithFallback from '@/common/ImageWithFallback;
import './SpinRoulette.css';

const FULL_TURNS = 4 + Math.floor(Math.random() * 2); // 4-5 full spins
const SPIN_DURATION_MS = 2800;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

export interface SpinRouletteProps {
  movies: Movie[];
  disabled?: boolean;
  onSpinStart?: () => void;
  onSpinComplete: (movie: Movie) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const SpinRoulette: React.FC<SpinRouletteProps> = ({
  movies,
  disabled = false,
  onSpinStart,
  onSpinComplete,
  className = '',
  style,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const n = movies.length;
  const anglePerSegment = n > 0 ? 360 / n : 0;

  const handleSpin = () => {
    if (isSpinning || disabled || n === 0) return;
    const winnerIndex = Math.floor(Math.random() * n);
    const winner = movies[winnerIndex];

    onSpinStart?.();
    setIsSpinning(true);

    const currentNorm = ((rotation % 360) + 360) % 360;
    const targetNorm = (((360 - winnerIndex * anglePerSegment) % 360) + 360) % 360;
    const diff = (targetNorm - currentNorm + 360) % 360;
    const finalRotation = rotation + diff + 360 * FULL_TURNS;

    setRotation(finalRotation);

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsSpinning(false);
      onSpinComplete(winner);
    }, SPIN_DURATION_MS);
  };

  if (n === 0) {
    return (
      <div className={`spin-roulette spin-roulette--empty ${className}`} style={style}>
        <p
          className="spin-roulette__empty-msg"
          style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}
        >
          Add movies to your queue to spin.
        </p>
      </div>
    );
  }

  const wheelStyle: React.CSSProperties & Record<string, string | number> = {
    '--n': n,
    '--rotation': `${rotation}deg`,
  };

  return (
    <div
      className={`spin-roulette ${className}`}
      style={style}
      data-spinning={isSpinning || undefined}
    >
      <div className="spin-roulette__wrapper">
        <div className="spin-roulette__indicator" aria-hidden />

        <div className="spin-roulette__scene">
          <div
            className="spin-roulette__a3d"
            style={{
              ...wheelStyle,
              transition: isSpinning ? `transform ${SPIN_DURATION_MS}ms ${EASE_OUT}` : 'none',
            }}
          >
            {movies.map((movie, i) => (
              <div
                key={movie.id}
                className="spin-roulette__card"
                style={
                  {
                    '--i': i,
                  } as React.CSSProperties
                }
                title={movie.title}
                aria-label={movie.title}
              >
                <div className="spin-roulette__card-poster-wrap">
                  {movie.posterUrl ? (
                    <ImageWithFallback
                      sources={[movie.posterUrl]}
                      alt={movie.title}
                      className="spin-roulette__card-poster"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="spin-roulette__card-poster spin-roulette__card-poster--fallback">
                      <span>{movie.title.slice(0, 2)}</span>
                    </div>
                  )}
                </div>
                <span
                  className="spin-roulette__card-label"
                  style={{ fontFamily: typography.fontFamily.heading.join(', ') }}
                >
                  {movie.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="spin-roulette__hub">
          <div className="spin-roulette__glass-wrap">
            <div className="spin-roulette__glass-shadow" aria-hidden />
            <button
              type="button"
              className="spin-roulette__btn spin-roulette__glass-btn"
              onClick={handleSpin}
              disabled={disabled || isSpinning || n === 0}
              aria-label="Spin the wheel"
              style={
                {
                  '--spin-btn-a': colors.accent,
                  '--spin-btn-b': colors.secondary,
                } as React.CSSProperties
              }
            >
              <span>{isSpinning ? '…' : 'SPIN'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
