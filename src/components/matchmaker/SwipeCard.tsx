import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import type { Movie } from '@/types';
import Card from '@/ui/Card';
import { colors, radius, spacing, typography, shadows } from '@/design-system/tokens';

interface SwipeCardHandle {
  swipe: (direction: 'left' | 'right') => void;
}

interface SwipeCardProps {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  active: boolean;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(({ movie, onSwipe, active }, ref) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => {
        if (!active || isAnimating) return;
        setIsAnimating(true);
        setAnimationDirection(direction);
        window.setTimeout(() => {
          onSwipe(direction);
          setIsAnimating(false);
          setAnimationDirection(null);
        }, 220);
      },
    }),
    [active, isAnimating, onSwipe]
  );

  const transform = useMemo(() => {
    if (!active) return 'scale(0.98) translateY(10px)';
    if (!isAnimating || !animationDirection) return 'scale(1)';
    return animationDirection === 'left'
      ? 'translateX(-120%) rotate(-10deg)'
      : 'translateX(120%) rotate(10deg)';
  }, [active, animationDirection, isAnimating]);

  const overlay = useMemo(() => {
    if (!isAnimating || !animationDirection) return null;
    return animationDirection === 'right'
      ? { label: 'LIKE', color: colors.success }
      : { label: 'NOPE', color: colors.error };
  }, [animationDirection, isAnimating]);

  return (
    <div
      style={{
        position: active ? 'absolute' : 'absolute',
        width: 'min(420px, 92vw)',
        maxWidth: '100%',
        transition: active ? 'transform 0.22s ease, opacity 0.22s ease' : 'transform 0.22s ease',
        transform,
        opacity: active ? 1 : 0.75,
        zIndex: active ? 2 : 1,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <Card
        style={{
          padding: spacing.lg,
          borderRadius: radius.card,
          border: `2px solid ${colors.borderSecondary}40`,
          background: colors.surface,
          boxShadow: active ? shadows.cardElevated : shadows.card,
        }}
      >
        {overlay && (
          <div
            style={{
              position: 'absolute',
              top: spacing.lg,
              left: spacing.lg,
              padding: '6px 10px',
              borderRadius: radius.full,
              border: `2px solid ${overlay.color}`,
              color: overlay.color,
              fontWeight: typography.fontWeight.bold,
              letterSpacing: '0.08em',
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            {overlay.label}
          </div>
        )}

        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: 92,
                height: 132,
                objectFit: 'cover',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}35`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 92,
                height: 132,
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}35`,
                background: `${colors.borderSecondary}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
                flexShrink: 0,
              }}
            >
              No poster
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                marginBottom: spacing.xs,
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.heading.join(', '),
                fontSize: typography.fontSize.lg,
                textShadow: shadows.textGlow,
              }}
            >
              {movie.title}
            </h3>

            <div style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm }}>
              {movie.year ? <span>{movie.year}</span> : null}
              {movie.runtime ? (
                <span>
                  {movie.year ? ' • ' : ''}
                  {movie.runtime}
                </span>
              ) : null}
            </div>

            {(movie.genre || movie.category) && (
              <div
                style={{
                  marginTop: spacing.sm,
                  color: colors.textTertiary,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {[movie.category, movie.genre].filter(Boolean).join(' • ')}
              </div>
            )}

            {movie.plot && (
              <p
                style={{
                  marginTop: spacing.sm,
                  marginBottom: 0,
                  color: colors.textSecondary,
                  fontSize: typography.fontSize.sm,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {movie.plot}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

SwipeCard.displayName = 'SwipeCard';

export default SwipeCard;
