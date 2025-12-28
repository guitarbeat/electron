import React, { memo } from 'react';
import { Movie, User } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon, SparkleHeartIcon } from './icons';
import Card from './ui/Card';
import IconButton from './ui/IconButton';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';

interface MovieItemProps {
  movie: Movie;
  currentUser: User;
  onToggleWatched: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  isSubmitting: boolean;
  showSeparator: boolean;
  index: number;
}

const MovieItem: React.FC<MovieItemProps> = memo(({
  movie,
  currentUser,
  onToggleWatched,
  onDelete,
  isSubmitting,
  showSeparator,
  index
}) => {
  const watchedByCurrentUser = movie.watchedBy.includes(currentUser);
  const watchedByBoth = movie.watchedBy.length === 2;

  const getWatchedStatus = (movie: Movie) => {
    const aaronWatched = movie.watchedBy.includes('Aaron');
    const electraWatched = movie.watchedBy.includes('Electra');
    if (aaronWatched && electraWatched) return "Watched by both";
    if (aaronWatched) return "Watched by Aaron";
    if (electraWatched) return "Watched by Electra";
    return "Not watched yet";
  };

  return (
    <React.Fragment>
      {showSeparator && (
        <div className="flex items-center my-6 animate-fade-in" style={{ margin: `${spacing['2xl']} 0 ${spacing.xl} 0` }}>
            <hr className="flex-grow border-pink-400 border-dashed" style={{
              flex: 1,
              height: '2px',
              borderColor: colors.accent,
              borderStyle: 'dashed',
              opacity: 0.5,
            }} />
            <span className="px-4 text-pink-300 font-heading" style={{
              padding: `0 ${spacing.lg}`,
              color: colors.accent, // * Fallback for browsers without gradient support
              background: shadows.textGradientPink,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 105, 180, 0.3)',
              letterSpacing: '0.05em',
              whiteSpace: 'normal', // * Changed from 'nowrap' to allow wrapping on small screens
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))',
            }}>
              Watched Together ✨
            </span>
            <hr className="flex-grow border-pink-400 border-dashed" style={{
              flex: 1,
              height: '2px',
              borderColor: colors.accent,
              borderStyle: 'dashed',
              opacity: 0.5,
            }} />
        </div>
      )}
      <Card
        variant={watchedByBoth ? 'elevated' : 'default'}
        className={`${watchedByBoth ? 'animate-pink-glow' : 'movie-card'} slide-up`}
        style={{
          padding: spacing.xl,
          opacity: watchedByCurrentUser && !watchedByBoth ? 0.75 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: spacing.md,
          borderWidth: watchedByBoth ? '3px' : '2px',
          borderColor: watchedByBoth ? colors.accent : colors.border,
          position: 'relative',
          overflow: 'visible',
          animationDelay: `${index * 0.05}s`,
        }}
      >
        {/* Status indicator bar */}
        {watchedByBoth && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: colors.gradientPink,
            borderRadius: `${radius.card} ${radius.card} 0 0`,
            boxShadow: `0 0 12px ${colors.accent}60`,
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          {watchedByBoth && (
            <div style={{
              color: colors.accent,
              flexShrink: 0,
              filter: 'drop-shadow(0 0 12px rgba(255, 105, 180, 0.8))',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}>
              <SparkleHeartIcon style={{ width: '32px', height: '32px' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <h3 className="movie-title" style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: watchedByBoth ? colors.textSecondary : colors.textPrimary,
              textDecoration: watchedByBoth ? 'line-through' : 'none',
              margin: 0,
              marginBottom: spacing.md,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              textShadow: watchedByBoth
                ? 'none'
                : '0 1px 2px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease-out',
              letterSpacing: '0.02em',
              lineHeight: typography.lineHeight.normal,
              padding: watchedByBoth ? `${spacing.xs} 0` : '0',
            }}>
              {movie.title}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
                fontWeight: typography.fontWeight.medium,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.full,
                border: `1px solid ${colors.borderInset}`,
              }}>
                {movie.addedBy}
              </span>
              <span style={{
                fontSize: typography.fontSize.sm,
                color: watchedByBoth ? colors.textTertiary : colors.textSecondary,
                margin: 0,
                letterSpacing: '0.01em',
                lineHeight: typography.lineHeight.normal,
                fontStyle: watchedByBoth ? 'italic' : 'normal',
              }}>
                {getWatchedStatus(movie)}
              </span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            flexShrink: 0,
            flexDirection: 'column',
          }}>
            <IconButton
              onClick={() => onToggleWatched(movie)}
              disabled={isSubmitting}
              variant="ghost"
              title={watchedByCurrentUser ? "Mark as unwatched" : "Mark as watched"}
              aria-label={watchedByCurrentUser ? `Mark "${movie.title}" as unwatched` : `Mark "${movie.title}" as watched`}
              style={{
                backgroundColor: watchedByCurrentUser ? colors.success + '20' : 'transparent',
                border: watchedByCurrentUser ? `1px solid ${colors.success}40` : 'none',
              }}
            >
              {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
            </IconButton>
            <IconButton
              onClick={() => onDelete(movie)}
              disabled={isSubmitting}
              variant="danger"
              title={`Delete "${movie.title}"`}
              aria-label={`Delete "${movie.title}"`}
            >
              <TrashIcon />
            </IconButton>
          </div>
        </div>
      </Card>
    </React.Fragment>
  );
});

MovieItem.displayName = 'MovieItem';

export default MovieItem;
