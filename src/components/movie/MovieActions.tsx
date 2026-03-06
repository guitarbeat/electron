import React from 'react';
import { Movie } from '@/types';
import { EyeIcon, EyeOffIcon, MagicWandIcon, TrashIcon } from '../common/icons';
import Button from '@/ui/Button';
import IconButton from '@/ui/IconButton';
import { spacing, colors, radius } from '@/design-system/tokens';

interface MovieActionsProps {
  movie: Movie;
  currentUser: string | null;
  watchedByCurrentUser: boolean;
  isUpdating: boolean;
  isMobile: boolean;
  onToggle: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  onCloseBottomSheet?: () => void;
}

const MovieActions: React.FC<MovieActionsProps> = ({
  movie,
  currentUser,
  watchedByCurrentUser,
  isUpdating,
  isMobile,
  onToggle,
  onDelete,
  onFixMatch,
  onCloseBottomSheet,
}) => {
  const isGuest = !currentUser;

  const handleAction = (action: () => void) => {
    action();
    onCloseBottomSheet?.();
  };

  const primaryButton = (
    <Button
      type="button"
      onClick={() =>
        isMobile && onCloseBottomSheet ? handleAction(() => onToggle(movie)) : onToggle(movie)
      }
      variant={watchedByCurrentUser ? 'primary' : 'secondary'}
      size={isMobile ? 'md' : 'sm'}
      isLoading={isUpdating}
      loadingText="Updating..."
      disabled={isGuest}
      aria-label={
        watchedByCurrentUser
          ? `Mark "${movie.title}" as unwatched`
          : `Mark "${movie.title}" as watched`
      }
      className="movie-item-primary-action"
      style={{
        backgroundColor: watchedByCurrentUser ? colors.success : 'rgba(0,0,0,0.62)',
        borderColor: watchedByCurrentUser ? colors.success : 'rgba(255,255,255,0.28)',
        opacity: isGuest ? 0.5 : 1,
        ...(isMobile && {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        }),
      }}
    >
      {watchedByCurrentUser ? (
        <EyeIcon style={{ width: '12px' }} />
      ) : (
        <EyeOffIcon style={{ width: '12px' }} />
      )}
      <span className="movie-item-primary-action-label">
        {watchedByCurrentUser ? 'Watched' : 'Mark Watched'}
      </span>
    </Button>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {primaryButton}

        <Button
          type="button"
          onClick={() => handleAction(() => onFixMatch?.(movie))}
          variant="ghost"
          disabled={isGuest}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            color: colors.accent,
            borderColor: `${colors.accent}40`,
            opacity: isGuest ? 0.5 : 1,
          }}
        >
          <MagicWandIcon />
          Fix Details
        </Button>

        <Button
          type="button"
          onClick={() => handleAction(() => onDelete(movie))}
          variant="ghost"
          disabled={isGuest}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            color: colors.error,
            borderColor: `${colors.error}40`,
            opacity: isGuest ? 0.5 : 1,
          }}
        >
          <TrashIcon />
          Remove from Watchlist
        </Button>
      </div>
    );
  }

  return (
    <div className="movie-actions">
      {primaryButton}

      <div className="movie-secondary-actions">
        <IconButton
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onFixMatch?.(movie);
          }}
          variant="ghost"
          size="sm"
          disabled={isGuest}
          title="Fix Metadata Match"
          aria-label={`Fix metadata for "${movie.title}"`}
          style={{
            padding: 0,
            width: '44px',
            height: '44px',
            backgroundColor: 'rgba(0,0,0,0.62)',
            borderRadius: radius.md,
            color: colors.accent,
            border: `1px solid ${colors.accent}45`,
            opacity: isGuest ? 0.5 : 1,
            cursor: isGuest ? 'not-allowed' : 'pointer',
          }}
        >
          <MagicWandIcon style={{ width: '14px', height: '14px' }} />
        </IconButton>

        <IconButton
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(movie);
          }}
          variant="ghost"
          size="sm"
          disabled={isGuest}
          title="Delete Movie"
          aria-label={`Delete "${movie.title}"`}
          style={{
            padding: 0,
            width: '44px',
            height: '44px',
            backgroundColor: 'rgba(0,0,0,0.62)',
            borderRadius: radius.md,
            color: colors.error,
            border: `1px solid ${colors.error}45`,
            opacity: isGuest ? 0.5 : 1,
            cursor: isGuest ? 'not-allowed' : 'pointer',
          }}
        >
          <TrashIcon style={{ width: '14px', height: '14px' }} />
        </IconButton>
      </div>
    </div>
  );
};

export default MovieActions;
