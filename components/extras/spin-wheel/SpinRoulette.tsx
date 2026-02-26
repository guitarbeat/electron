import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '../../../types';
import { colors, typography } from '../../../design-system/tokens';
import './SpinRoulette.css';

const DEG = Math.PI / 180;
const FULL_TURNS = 4 + Math.floor(Math.random() * 2); // 4-5 full spins
const SPIN_DURATION_MS = 2800;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

function wedgeClipPath(
  segmentIndex: number,
  total: number,
  innerRadiusPct: number,
  outerRadiusPct: number
): string {
  if (total <= 0) return 'none';
  const start = segmentIndex * (360 / total);
  const end = (segmentIndex + 1) * (360 / total);
  const cx = 50;
  const cy = 50;
  const toX = (deg: number, r: number) => cx + r * Math.cos((deg - 90) * DEG);
  const toY = (deg: number, r: number) => cy + r * Math.sin((deg - 90) * DEG);
  const o1 = `${toX(start, outerRadiusPct)}% ${toY(start, outerRadiusPct)}%`;
  const o2 = `${toX(end, outerRadiusPct)}% ${toY(end, outerRadiusPct)}%`;
  const i2 = `${toX(end, innerRadiusPct)}% ${toY(end, innerRadiusPct)}%`;
  const i1 = `${toX(start, innerRadiusPct)}% ${toY(start, innerRadiusPct)}%`;
  return `polygon(50% 50%, ${o1}, ${o2}, ${i2}, ${i1})`;
}

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
  const innerRadiusPct = 28;
  const outerRadiusPct = 48;
  const labelRadiusPct = 38;

  const labelPosition = (i: number) => {
    const angleDeg = (i + 0.5) * anglePerSegment - 90;
    const rad = angleDeg * DEG;
    return {
      left: `${50 + labelRadiusPct * Math.cos(rad)}%`,
      top: `${50 + labelRadiusPct * Math.sin(rad)}%`,
      transform: `translate(-50%, -50%) rotate(${(i + 0.5) * anglePerSegment}deg)`,
    };
  };

  const handleSpin = () => {
    if (isSpinning || disabled || n === 0) return;
    const winnerIndex = Math.floor(Math.random() * n);
    const winner = movies[winnerIndex];

    onSpinStart?.();
    setIsSpinning(true);

    const currentNorm = ((rotation % 360) + 360) % 360;
    const winnerAngle = winnerIndex * anglePerSegment;
    const diff = (360 - winnerAngle + 360 - currentNorm) % 360;
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
        <p className="spin-roulette__empty-msg" style={{ color: colors.textTertiary, fontSize: typography.fontSize.sm }}>
          Add movies to your queue to spin.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`spin-roulette ${className}`}
      style={style}
      data-spinning={isSpinning || undefined}
    >
      <div className="spin-roulette__wrapper">
        <div
          className="spin-roulette__indicator"
          aria-hidden
        />
        <div
          className="spin-roulette__wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS}ms ${EASE_OUT}`
              : 'none',
          }}
        >
          {movies.map((movie, i) => (
            <div
              key={movie.id}
              className="spin-roulette__segment"
              style={{
                clipPath: wedgeClipPath(i, n, innerRadiusPct, outerRadiusPct),
                background: i % 2 === 0
                  ? 'rgba(255, 105, 180, 0.18)'
                  : 'rgba(135, 206, 250, 0.18)',
              }}
            >
              <span
                className="spin-roulette__label"
                style={{
                  ...labelPosition(i),
                  fontFamily: typography.fontFamily.heading.join(', '),
                }}
              >
                {movie.title}
              </span>
            </div>
          ))}
        </div>
        <div className="spin-roulette__hub">
          <button
            type="button"
            className="spin-roulette__btn"
            onClick={handleSpin}
            disabled={disabled || isSpinning || n === 0}
            aria-label="Spin the wheel"
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.secondary})`,
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          >
            {isSpinning ? '…' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
};
