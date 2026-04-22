import React from 'react';
import { colors, radius, spacing, shadows } from '@/theme/tokens';

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
      borderRadius: radius.full,
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
        backgroundColor: colors.surfaceElevated,
        backgroundImage: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)`,
        backgroundSize: '200% 100%',
        boxShadow: `inset 0 0 20px ${colors.accent}05`,
        animation: `skeleton-shimmer 2s infinite linear`,
        ...variantStyles[variant],
        ...style,
      }}
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes skeleton-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
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
      backgroundColor: colors.surface1,
      border: `1px solid ${colors.borderSubtle}`,
      boxShadow: shadows.card,
    }}
  >
    <Skeleton variant="poster" width="100%" height="auto" style={{ aspectRatio: '2/3' }} />
    <div style={{ padding: spacing.sm }}>
      <Skeleton variant="text" width="80%" style={{ marginBottom: spacing.xs }} />
      <Skeleton variant="text" width="40%" height="0.75em" />
    </div>
  </div>
);

export default Skeleton;

