import React, { memo } from 'react';
import { Movie, User } from '../types';
import {
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  TicketIcon,
  MagicWandIcon,
  Spinner,
  FilmIcon,
} from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import FixMatchDialog from './FixMatchDialog';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';

interface MovieItemProps {
  movie: Movie;
  currentUser: User;
  onToggle: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  animationDelay: string;
  layout?: 'list' | 'grid';
}

const getWatchedStatus = (movie: Movie) => {
  const aaronWatched = movie.watchedBy.includes('Aaron');
  const electraWatched = movie.watchedBy.includes('Electra');
  if (aaronWatched && electraWatched) return 'Watched by both';
  if (aaronWatched) return 'Watched by Aaron';
  if (electraWatched) return 'Watched by Electra';
  return 'Not watched yet';
};

const MovieItem: React.FC<MovieItemProps> = ({
  movie,
  currentUser,
  onToggle,
  onDelete,
  onFixMatch,
  animationDelay,
  layout = 'list',
}) => {
  const watchedByCurrentUser = movie.watchedBy.includes(currentUser);
  const watchedByBoth = movie.watchedBy.length === 2;
  const [isUpdating, setIsUpdating] = React.useState(false);

  return (
    <Card
      variant={watchedByBoth ? 'elevated' : 'default'}
      className={`${watchedByBoth ? 'animate-pink-glow' : 'movie-card'} slide-up`}
      style={{
        padding: 0,
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: layout === 'grid' ? spacing.sm : spacing.md,
        borderWidth: watchedByBoth ? (layout === 'grid' ? '2px' : '3px') : '1px',
        borderColor: watchedByBoth ? colors.accent : colors.border,
        position: 'relative',
        overflow: 'hidden',
        animationDelay,
        display: 'flex',
        flexDirection: layout === 'grid' ? 'column' : 'row',
        minHeight: layout === 'grid' ? 'auto' : '160px',
        boxShadow: layout === 'grid' ? '0 4px 12px rgba(0,0,0,0.5)' : shadows.card,
        backgroundColor: colors.surfaceElevated,
      }}
    >
      {/* Poster Image or Text Fallback */}
      <div
        style={{
          width: layout === 'grid' ? '100%' : '110px',
          height: layout === 'grid' ? 'auto' : 'auto',
          aspectRatio: layout === 'grid' ? '2/3' : 'unset',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            !movie.posterUrl && layout === 'grid'
              ? `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`
              : colors.background,
        }}
      >
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
          />
        ) : layout === 'grid' ? (
          <div
            style={{
              padding: spacing.md,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.sm,
              zIndex: 1,
            }}
          >
            <FilmIcon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.2)' }} />
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.textPrimary,
                margin: 0,
                lineHeight: 1.2,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {movie.title}
            </h3>
          </div>
        ) : null}

        {/* Watcher Badges - Floating on Top-Left */}
        <div
          style={{
            position: 'absolute',
            top: spacing.sm,
            left: spacing.sm,
            display: 'flex',
            gap: '4px',
            zIndex: 10,
          }}
        >
          {movie.watchedBy.includes('Aaron') && (
            <div
              title="Watched by Aaron"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: colors.secondary,
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: colors.background,
                boxShadow: `0 0 10px ${colors.secondary}80`,
                textShadow: 'none',
              }}
            >
              A
            </div>
          )}
          {movie.watchedBy.includes('Electra') && (
            <div
              title="Watched by Electra"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: colors.accent,
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: `0 0 10px ${colors.accent}80`,
                textShadow: 'none',
              }}
            >
              E
            </div>
          )}
        </div>

        {/* Grid View Overlay */}
        {layout === 'grid' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: movie.posterUrl
                ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: spacing.sm,
              opacity: 1,
              zIndex: 2,
            }}
          >
            {movie.posterUrl && (
              <h3
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.textPrimary,
                  margin: 0,
                  marginBottom: '2px',
                  lineHeight: 1.2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                {movie.title}
              </h3>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  color: colors.textSecondary,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {movie.year || ''}
              </span>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(movie);
                  }}
                  variant={watchedByCurrentUser ? 'primary' : 'secondary'}
                  size="sm"
                  aria-label={
                    watchedByCurrentUser
                      ? `Mark "${movie.title}" as unwatched`
                      : `Mark "${movie.title}" as watched`
                  }
                  style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    height: '28px',
                    fontSize: '10px',
                    backgroundColor: watchedByCurrentUser ? colors.success : 'rgba(0,0,0,0.6)',
                    borderColor: watchedByCurrentUser ? colors.success : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flex: 1,
                  }}
                >
                  {watchedByCurrentUser ? (
                    <EyeIcon style={{ width: '12px' }} />
                  ) : (
                    <EyeOffIcon style={{ width: '12px' }} />
                  )}
                  {watchedByCurrentUser ? 'Watched' : 'Mark Watched'}
                </Button>

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onFixMatch?.(movie);
                  }}
                  variant="ghost"
                  size="sm"
                  title="Fix Metadata Match"
                  style={{
                    padding: 0,
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: radius.md,
                    color: colors.accent,
                    border: `1px solid ${colors.accent}40`,
                  }}
                >
                  <MagicWandIcon style={{ width: '14px', height: '14px' }} />
                </IconButton>

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(movie);
                  }}
                  variant="ghost"
                  size="sm"
                  title="Delete Movie"
                  style={{
                    padding: 0,
                    width: '28px',
                    height: '28px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: radius.md,
                    color: colors.error,
                    border: `1px solid ${colors.error}40`,
                  }}
                >
                  <TrashIcon style={{ width: '14px', height: '14px' }} />
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List View Content (Only if NOT grid) */}
      {layout !== 'grid' && (
        <div
          style={{
            flex: 1,
            padding: spacing.md,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            minWidth: 0,
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: spacing.sm,
              }}
            >
              <h3
                className="movie-title"
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: watchedByBoth ? colors.textSecondary : colors.textPrimary,
                  textDecoration: watchedByBoth ? 'line-through' : 'none',
                  margin: 0,
                  marginBottom: spacing.xs,
                  wordBreak: 'break-word',
                  lineHeight: typography.lineHeight.tight,
                  textShadow: watchedByBoth ? 'none' : shadows.textGlow,
                  maxWidth: '90%',
                }}
              >
                {movie.title}
              </h3>
              {watchedByBoth && (
                <div
                  style={{
                    color: colors.accent,
                    flexShrink: 0,
                    filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.6))',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                >
                  <TicketIcon style={{ width: '24px', height: '24px' }} />
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                fontSize: typography.fontSize.sm,
                color: colors.textTertiary,
                marginBottom: spacing.md,
                flexWrap: 'wrap',
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {movie.year && <span style={{ color: colors.textSecondary }}>{movie.year}</span>}
              {movie.year && (movie.imdbRating || movie.runtime) && <span>•</span>}

              {movie.imdbRating && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: colors.yellow,
                    fontWeight: typography.fontWeight.bold,
                    textShadow: '0 0 10px rgba(255, 235, 59, 0.3)',
                  }}
                >
                  ★ {movie.imdbRating}
                </span>
              )}
              {movie.imdbRating && movie.runtime && (
                <span style={{ color: colors.textTertiary }}>•</span>
              )}

              {movie.runtime && <span>{movie.runtime}</span>}
            </div>

            {movie.plot && (
              <p
                style={{
                  fontSize: typography.fontSize.base,
                  color: colors.textSecondary,
                  opacity: 0.9,
                  margin: 0,
                  marginBottom: spacing.lg,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: typography.lineHeight.normal,
                }}
              >
                {movie.plot}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
              flexWrap: 'wrap',
              gap: spacing.md,
              borderTop: `1px solid ${colors.borderInset}`,
              paddingTop: spacing.sm,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: colors.textTertiary,
                    fontWeight: typography.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: `2px 6px`,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.borderInset}`,
                  }}
                >
                  {movie.addedBy}
                </span>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: watchedByBoth ? colors.textTertiary : colors.secondary,
                    fontStyle: watchedByBoth ? 'italic' : 'normal',
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {getWatchedStatus(movie)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <IconButton
                onClick={() => onToggle(movie)}
                variant="ghost"
                title={watchedByCurrentUser ? 'Mark as unwatched' : 'Mark as watched'}
                aria-label={
                  watchedByCurrentUser
                    ? `Mark "${movie.title}" as unwatched`
                    : `Mark "${movie.title}" as watched`
                }
                style={{
                  backgroundColor: watchedByCurrentUser ? colors.success + '20' : 'transparent',
                  border: watchedByCurrentUser
                    ? `1px solid ${colors.success}40`
                    : '1px solid transparent',
                }}
              >
                {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
              </IconButton>

              <IconButton
                onClick={() => onFixMatch?.(movie)}
                variant="ghost"
                title="Fix Incorrect Match"
                style={{
                  border: `1px solid ${colors.borderSecondary}40`,
                  color: colors.accent,
                }}
              >
                <MagicWandIcon />
              </IconButton>

              <IconButton
                onClick={() => onDelete(movie)}
                variant="ghost"
                title="Delete Movie"
                style={{
                  border: `1px solid ${colors.error}40`,
                  color: colors.error,
                }}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default memo(MovieItem);
