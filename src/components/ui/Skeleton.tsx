import React from 'react';
import { colors, radius, spacing } from '../../design-system/tokens';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'poster';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton loading placeholder with animated shimmer effect.
 */
const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      width: width || '100%',
      height: height || '1em',
      borderRadius: radius.sm,
    },
    circular: {
      width: width || '40px',
      height: height || '40px',
      borderRadius: '50%',
    },
    rectangular: {
      width: width || '100%',
      height: height || '100px',
      borderRadius: radius.md,
    },
    poster: {
      width: width || '70px',
      height: height || '105px',
      borderRadius: radius.md,
      aspectRatio: '2/3',
    },
  };

  return (
    <div
      className={`skeleton ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        boxShadow: `inset 0 0 20px ${colors.accent}10`,
        ...variantStyles[variant],
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton for movie cards in grid layout.
 */
export const MovieCardSkeleton: React.FC = () => (
  <div
    style={{
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      border: `1px solid ${colors.border}`,
    }}
  >
    <Skeleton variant="poster" width="100%" height="auto" style={{ aspectRatio: '2/3' }} />
    <div style={{ padding: spacing.sm }}>
      <Skeleton variant="text" width="80%" style={{ marginBottom: spacing.xs }} />
      <Skeleton variant="text" width="40%" height="0.75em" />
    </div>
  </div>
);

/**
 * Skeleton for suggestion items.
 */
export const SuggestionSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing.lg,
      backgroundColor: 'rgba(27, 40, 69, 0.6)',
      borderRadius: radius.md,
      border: `1px solid ${colors.borderSecondary}40`,
    }}
  >
    <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height="1.5em" style={{ marginBottom: spacing.sm }} />
        <Skeleton variant="text" width="40%" height="0.9em" />
      </div>
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <Skeleton variant="rectangular" width="70px" height="32px" />
        <Skeleton variant="rectangular" width="70px" height="32px" />
      </div>
    </div>
  </div>
);

export default Skeleton;
