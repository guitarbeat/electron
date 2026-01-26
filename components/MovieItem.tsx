import React, { memo } from 'react';
import { Movie, User } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon, SparkleHeartIcon, MagicWandIcon, Spinner, DotsVerticalIcon } from './icons';
import Card from './ui/Card';
import IconButton from './ui/IconButton';
import FixMatchDialog from './FixMatchDialog';
import { Menu, MenuItem } from './ui/Menu';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';

interface MovieItemProps {
  movie: Movie;
  currentUser: User;
  onToggle: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onUpdateMetadata?: (movie: Movie, searchTerm?: string) => Promise<boolean>;
  animationDelay: string;
  layout?: 'list' | 'grid';
}

const MovieItem: React.FC<MovieItemProps> = ({
  movie,
  currentUser,
  onToggle,
  onDelete,
  onUpdateMetadata,
  animationDelay,
  layout = 'list',
}) => {
  const watchedByCurrentUser = movie.watchedBy.includes(currentUser);
  const watchedByBoth = movie.watchedBy.length === 2;
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showFixDialog, setShowFixDialog] = React.useState(false);

  const getWatchedStatus = (movie: Movie) => {
    const aaronWatched = movie.watchedBy.includes('Aaron');
    const electraWatched = movie.watchedBy.includes('Electra');
    if (aaronWatched && electraWatched) return "Watched by both";
    if (aaronWatched) return "Watched by Aaron";
    if (electraWatched) return "Watched by Electra";
    return "Not watched yet";
  };

  return (
    <Card
      variant={watchedByBoth ? 'elevated' : 'default'}
      className={`${watchedByBoth ? 'animate-pink-glow' : 'movie-card'} slide-up`}
      style={{
        padding: 0, // Removed padding to let image bleed to edge if desired, or handle internal padding
        opacity: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: spacing.md,
        borderWidth: watchedByBoth ? '3px' : '2px',
        borderColor: watchedByBoth ? colors.accent : colors.border,
        position: 'relative',
        overflow: 'hidden',
        animationDelay,
        display: 'flex',
        flexDirection: layout === 'grid' ? 'column' : 'row',
        minHeight: layout === 'grid' ? 'auto' : '160px', // Adjust height for grid
      }}
    >
      {/* Status indicator bar for Watched By Both */}
      {watchedByBoth && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: colors.gradientPink,
          zIndex: 10,
          boxShadow: `0 0 12px ${colors.accent}60`,
        }} />
      )}

      {/* Poster Image (Left Side) - Only if available */}
      {movie.posterUrl && (
        <div style={{
          width: layout === 'grid' ? '100%' : '110px',
          height: layout === 'grid' ? 'auto' : 'auto',
          aspectRatio: layout === 'grid' ? '2/3' : 'unset',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000',
        }}>
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
            // Simple zoom effect on hover could be added via CSS class, 
            // but inline styles are tricky for hover. 
          />
          {/* Gradient overlay on the image to blend it with content on small screens if needed, 
              but for a side-by-side layout, raw image is usually fine.
              Let's add a subtle inner shadow. */}
          <div style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* Content Side (Right) */}
      <div style={{
        flex: 1,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        minWidth: 0, 
        zIndex: 2
      }}>
        
        {/* Top Row: Title + Heart */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
              <h3 className="movie-title" style={{
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
              }}>
                {movie.title}
              </h3>
             {watchedByBoth && (
              <div style={{
                color: colors.accent,
                flexShrink: 0,
                filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.6))',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}>
                <SparkleHeartIcon style={{ width: '24px', height: '24px' }} />
              </div>
            )}
          </div>
            
          {/* Metadata Row: Year • Rating • Runtime */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            fontSize: typography.fontSize.sm,
            color: colors.textTertiary,
            marginBottom: spacing.md,
            flexWrap: 'wrap',
            fontWeight: typography.fontWeight.medium,
          }}>
            {movie.year && (
              <span style={{ color: colors.textSecondary }}>
                {movie.year}
              </span>
            )}
            {movie.year && (movie.imdbRating || movie.runtime) && <span>•</span>}
            
            {movie.imdbRating && (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: colors.yellow, 
                fontWeight: typography.fontWeight.bold,
                textShadow: '0 0 10px rgba(255, 235, 59, 0.3)',
              }}>
                ★ {movie.imdbRating}
              </span>
            )}
              {movie.imdbRating && movie.runtime && <span style={{ color: colors.textTertiary }}>•</span>}
              
              {movie.runtime && (
                <span>{movie.runtime}</span>
              )}
          </div>

          {/* Plot Summary (Truncated) */}
          {movie.plot && (
            <p style={{
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
            }}>
              {movie.plot}
            </p>
          )}
        </div>

        {/* Footer: Added By / Status / Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto', // Push to bottom
          flexWrap: 'wrap',
          gap: spacing.md,
          borderTop: `1px solid ${colors.borderInset}`,
          paddingTop: spacing.sm,
        }}>
          {/* User Status Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                 <span style={{
                    fontSize: '0.65rem',
                    color: colors.textTertiary,
                    fontWeight: typography.fontWeight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: `2px 6px`,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.borderInset}`,
                  }}>
                    {movie.addedBy}
                  </span>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: watchedByBoth ? colors.textTertiary : colors.secondary,
                    fontStyle: watchedByBoth ? 'italic' : 'normal',
                    fontWeight: typography.fontWeight.medium,
                  }}>
                    {getWatchedStatus(movie)}
                  </span>
              </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <IconButton
              onClick={() => onToggle(movie)}
              variant="ghost"
              title={watchedByCurrentUser ? "Mark as unwatched" : "Mark as watched"}
              aria-label={watchedByCurrentUser ? `Mark "${movie.title}" as unwatched` : `Mark "${movie.title}" as watched`}
              style={{
                backgroundColor: watchedByCurrentUser ? colors.success + '20' : 'transparent',
                border: watchedByCurrentUser ? `1px solid ${colors.success}40` : '1px solid transparent',
              }}
            >
              {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
            </IconButton>

            <Menu 
              trigger={
                <IconButton variant="ghost" aria-label="More options">
                  <DotsVerticalIcon />
                </IconButton>
              }
              align="right"
            >
              <MenuItem 
                onClick={() => setShowFixDialog(true)}
                icon={isUpdating ? <Spinner style={{width: '16px', height: '16px'}} /> : <MagicWandIcon style={{width: '16px', height: '16px'}} />}
              >
                {isUpdating ? 'Updating...' : 'Fix Incorrect Match'}
              </MenuItem>
              <MenuItem 
                onClick={() => onDelete(movie)}
                variant="danger"
                icon={<TrashIcon style={{width: '16px', height: '16px'}} />}
              >
                Delete Movie
              </MenuItem>
            </Menu>

            {onUpdateMetadata && (
              <FixMatchDialog
                isOpen={showFixDialog}
                movieTitle={movie.title}
                onClose={() => setShowFixDialog(false)}
                onSearch={async (term) => {
                  setIsUpdating(true);
                  return onUpdateMetadata(movie, term).finally(() => setIsUpdating(false));
                }}
              />
            )}
          </div>
        </div>
        
      </div>
    </Card>
  );
};

export default memo(MovieItem);
