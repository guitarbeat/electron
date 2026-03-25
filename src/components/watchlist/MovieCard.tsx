import React from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { executeAction } from '@/utils';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';
import { colors, spacing, typography } from '@/theme/tokens';
import { CheckIcon, EyeIcon, TrashIcon } from '@/common/icons';
import { MAX_MOVIE_NOTE_LENGTH } from './watchlistConstants';

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onDelete: () => void;
  animationDelay: string;
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
}

const USER_PHOTOS: Record<string, string[]> = {
  Aaron: [
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa2Qa_ao3GRvb5R5TyT7lET-s_0iqlHUxWMg&s',
    'https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg',
    'https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941',
  ],
  Electra: [
    'https://i.redd.it/vkmos70wqw641.jpg',
    'https://i.pinimg.com/236x/3e/5b/8d/3e5b8d5105f7570eac355fea06998ba0.jpg',
    'https://preview.redd.it/rbdzmbhsxbw11.png?width=315&format=png&auto=webp&s=6282a8216d66d51684af9efc992b8b423463c941',
  ],
};

interface WatcherBadgeProps {
  user: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'text';
  showLabel?: boolean;
  className?: string;
}

const WatcherBadgePhoto: React.FC<{ user: string }> = ({ user }) => {
  const [index, setIndex] = React.useState(0);
  const sources = USER_PHOTOS[user] ?? [];

  const handleError = () => {
    if (index < sources.length - 1) setIndex((i) => i + 1);
  };

  if (sources.length === 0 || index >= sources.length) {
    return <span className="watcher-badge__avatar-initial">{user.charAt(0).toUpperCase()}</span>;
  }

  return (
    <img
      src={sources[index]}
      alt={user}
      className="watcher-badge__avatar-photo"
      onError={handleError}
      draggable={false}
    />
  );
};

const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
}) => {
  const badgeClassName = [
    'watcher-badge',
    `watcher-badge--${variant}`,
    `watcher-badge--${size}`,
    `watcher-badge--${user.toLowerCase()}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={badgeClassName}>
      <div className="watcher-badge__avatar">
        <WatcherBadgePhoto user={user} />
      </div>
      {showLabel && <span className="watcher-badge__label">{user}</span>}
    </div>
  );
};

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  currentUser,
  onToggle,
  onDelete,
  animationDelay,
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
}) => {
  const [showMemories, setShowMemories] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isGuest = !currentUser;

  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const hasSharedMemories = memories.length > 0;
  const canOpenNotes = hasSharedMemories || Boolean(currentUser);
  const memoryCountText = `${memories.length} note${memories.length === 1 ? '' : 's'}`;

  const handleToggleMemories = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setShowMemories((current) => !current);
  };

  const handleToggle = async () => {
    if (isGuest) return;
    setIsUpdating(true);
    try {
      await onToggle();
    } catch (error) {
      console.error('Failed to toggle watched status', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card
        variant={watchedByBoth ? 'elevated' : 'default'}
        glow={watchedByBoth || isHighlighted}
        className={`movie-item-card slide-up ${
          watchedByBoth ? 'movie-item-card--watched' : ''
        } ${isHighlighted ? 'movie-item-card--highlighted' : ''}`}
        data-movie-id={movie.id}
        style={{
          padding: 0,
          marginBottom: 0,
          animationDelay,
          borderColor: watchedByBoth ? colors.accent : colors.border,
        }}
      >
        <div className="movie-item-poster-wrap">
          <MoviePoster movie={movie} />

          {movie.watchedBy.length > 0 && (
            <div className="movie-item-watchers">
              {movie.watchedBy.includes('Aaron') && <WatcherBadge user="Aaron" size="md" />}
              {movie.watchedBy.includes('Electra') && <WatcherBadge user="Electra" size="md" />}
            </div>
          )}

          {isHighlighted && (
            <div className="movie-item-success-badge" aria-hidden>
              Added
            </div>
          )}

          <div className={`movie-item-overlay ${isHighlighted ? 'movie-item-overlay--success' : ''}`.trim()}>
            <div>
              <h3 className={`movie-item-title ${movie.posterUrl ? '' : 'movie-item-title--fallback'}`}>
                {movie.title}
              </h3>
              <MovieMetadata movie={movie} />
            </div>

            {canOpenNotes && (
              <button
                type="button"
                onClick={handleToggleMemories}
                className="movie-item-memory-toggle"
                aria-label={
                  hasSharedMemories
                    ? `View notes for "${movie.title}"`
                    : `Add note to "${movie.title}"`
                }
              >
                {hasSharedMemories ? memoryCountText : 'Add note'}
              </button>
            )}

            <MovieActions
              movie={movie}
              currentUser={currentUser}
              watchedByCurrentUser={watchedByCurrentUser}
              isUpdating={isUpdating}
              onToggle={handleToggle}
              onDelete={onDelete}
            />
          </div>
        </div>
      </Card>

      {showMemories && (
        <MovieMemories
          movie={movie}
          memories={memories}
          currentUser={currentUser}
          isMobile={isMobile}
          onAddMemory={onAddMemory}
          onUpdateMemory={onUpdateMemory}
          onDeleteMemory={onDeleteMemory}
          onTogglePin={onTogglePin}
        />
      )}
    </>
  );
};

export default MovieCard;

const MoviePoster: React.FC<{ movie: Movie; className?: string }> = ({ movie, className = '' }) => {
  const [hasImageError, setHasImageError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(false);
  }, [movie.posterUrl]);

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasImageError;

  return (
    <div className={`movie-poster-wrap ${className}`}>
      {shouldShowPoster ? (
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="movie-poster"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="movie-poster-fallback">
          <div className="movie-poster-fallback__inner">
            <h3 className="movie-poster-fallback__title">{movie.title}</h3>
            {movie.year && <span className="movie-poster-fallback__year">{movie.year}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const MovieMetadata: React.FC<{ movie: Movie; className?: string }> = ({
  movie,
  className = '',
}) => {
  const metadataItems = [
    movie.year,
    movie.runtime,
    movie.imdbRating ? `${movie.imdbRating} IMDb` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`movie-metadata ${className}`}>
      <div className="movie-meta-row">
        {metadataItems.map((item, index) => (
          <React.Fragment key={`${movie.id}-meta-${item}`}>
            {index > 0 && <span className="movie-meta-separator">•</span>}
            <span className="movie-meta-item">{item}</span>
          </React.Fragment>
        ))}
        {movie.category && (
          <span className="movie-category" aria-label={`Category: ${movie.category}`}>
            {movie.category}
          </span>
        )}
      </div>
    </div>
  );
};

interface MovieActionsProps {
  movie: Movie;
  currentUser: User | null;
  watchedByCurrentUser: boolean;
  isUpdating: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

interface MovieIconActionButtonProps {
  title: string;
  disabled: boolean;
  color: string;
  borderColor: string;
  className?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const MovieIconActionButton: React.FC<MovieIconActionButtonProps> = ({
  title,
  disabled,
  color,
  borderColor,
  className = '',
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    style={
      {
        '--movie-action-color': color,
        '--movie-action-border': borderColor,
      } as React.CSSProperties
    }
    className={`movie-item-icon-action ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
  >
    {children}
  </button>
);

const MovieActions: React.FC<MovieActionsProps> = ({
  movie,
  currentUser,
  watchedByCurrentUser,
  isUpdating,
  onToggle,
  onDelete,
}) => {
  const isGuest = !currentUser;
  const primaryActionLabel = watchedByCurrentUser ? 'Watched' : 'Mark watched';
  const primaryActionLabelShort = watchedByCurrentUser ? 'Watched ✓' : 'Watch';

  const stopActionPropagation = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    executeAction(onToggle);
  };

  const handleDeleteAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    executeAction(onDelete);
  };

  const primaryButton = (
    <Button
      type="button"
      onClick={handlePrimaryAction}
      variant={watchedByCurrentUser ? 'primary' : 'secondary'}
      size="sm"
      isLoading={isUpdating}
      loadingText="Updating..."
      disabled={isGuest}
      aria-pressed={watchedByCurrentUser}
      aria-label={
        watchedByCurrentUser
          ? `Mark "${movie.title}" as unwatched`
          : `Mark "${movie.title}" as watched`
      }
      className={`movie-item-primary-action ${watchedByCurrentUser ? 'movie-item-primary-action--watched' : 'movie-item-primary-action--unwatched'}`}
      style={
        watchedByCurrentUser
          ? {
              background: 'linear-gradient(180deg, rgba(30,50,36,0.88) 0%, rgba(18,32,22,0.92) 100%)',
              color: 'rgba(220,240,225,0.9)',
              border: '1px solid rgba(74,160,96,0.35)',
            }
          : {
              background: 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
              color: '#fff',
              border: '1px solid rgba(34,197,94,0.5)',
              boxShadow: '0 6px 18px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
            }
      }
    >
      {watchedByCurrentUser ? (
        <CheckIcon style={{ width: '15px' }} />
      ) : (
        <EyeIcon style={{ width: '15px' }} />
      )}
      <span className="movie-item-primary-action-label">
        <span className="movie-item-primary-action-label--long">
          {primaryActionLabel}
        </span>
        <span className="movie-item-primary-action-label--short" aria-hidden>
          {primaryActionLabelShort}
        </span>
      </span>
    </Button>
  );

  return (
    <div className="movie-actions">
      {primaryButton}

      <button
        type="button"
        onClick={handleDeleteAction}
        disabled={isGuest}
        title={`Remove "${movie.title}"`}
        aria-label={`Remove "${movie.title}" from list`}
        className="movie-item-remove-link"
      >
        <TrashIcon style={{ width: '15px', height: '15px' }} />
      </button>
    </div>
  );
};

interface MovieMemoriesProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  isMobile: boolean;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
}

const MovieMemories: React.FC<MovieMemoriesProps> = ({
  movie,
  memories,
  currentUser,
  isMobile,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState('');
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const remainingChars = MAX_MOVIE_NOTE_LENGTH - draftNote.length;
  const canSubmitNote = !isSubmittingMemory && draftNote.trim().length > 0 && remainingChars >= 0;

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) return;
    const trimmedNote = draftNote.trim();
    if (!trimmedNote) return;

    setIsSubmittingMemory(true);
    try {
      await onAddMemory(trimmedNote);
      setDraftNote('');
      noteInputRef.current?.focus();
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  if (memories.length === 0 && !currentUser) {
    return null;
  }

  return (
    <div
      className="movie-memory-panel"
      style={{
        marginTop: `-${spacing.sm}`,
        marginBottom: spacing.md,
        padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
        borderRadius: '0 0 16px 16px',
        background:
          `linear-gradient(180deg, ${colors.surface2} 0%, ${colors.surface1} 42%, ${colors.surface0} 100%)`,
        border: `1px solid ${colors.borderSubtle}`,
        borderTop: 'none',
        borderLeft: `3px solid ${colors.accentMuted}`,
        boxShadow: '0 18px 34px rgba(18, 11, 7, 0.24)',
      }}
    >
      <div
        style={{
          marginBottom: spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}
      >
        <p
          style={{
            margin: 0,
            ...typography.presets.eyebrow,
            color: colors.accentLight,
          }}
        >
          Notes on this movie
        </p>
        <h4
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          {movie.title}
        </h4>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          Quotes, reactions, and tiny thoughts worth keeping with this one.
        </p>
      </div>

      {currentUser && onAddMemory && (
        <div style={{ marginBottom: spacing.md }}>
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={handleMemorySubmit}
            isSubmitting={isSubmittingMemory}
            canSubmit={canSubmitNote}
            isMobile={isMobile}
            note={draftNote}
            onNoteChange={(nextNote) => setDraftNote(nextNote.slice(0, MAX_MOVIE_NOTE_LENGTH))}
            isComposerOpen
            onComposerToggle={() => {}}
            remainingChars={remainingChars}
            error={null}
            successMessage={null}
            noteInputRef={noteInputRef}
          />
        </div>
      )}

      {memories.length > 0 ? (
        <MemoryList
          memories={memories}
          visibleMemories={memories}
          sortedMemories={memories}
          contextMovieTitle={movie.title}
          currentUser={currentUser}
          isMobile={isMobile}
          onEditMemory={async (memory, note) => {
            if (onUpdateMemory) await onUpdateMemory(memory.id, note);
          }}
          onDeleteMemory={async (memory) => {
            if (onDeleteMemory) await onDeleteMemory(memory.id);
          }}
          onTogglePin={async (memory) => {
            if (onTogglePin) await onTogglePin(memory.id);
          }}
          movieFilterOptions={[]}
          activeMovieFilter={movie.id}
          onActiveMovieFilterChange={() => {}}
          sortMode="newest"
          onSortModeChange={() => {}}
          onShowMore={() => {}}
          onShowLess={() => {}}
          visibleCount={100}
          isLoading={false}
          memoriesError={null}
          onJumpToMovie={() => {}}
        />
      ) : (
        <p
          style={{
            textAlign: 'center',
            color: colors.textTertiary,
            fontSize: typography.fontSize.xs,
            fontStyle: 'italic',
            padding: spacing.sm,
          }}
        >
          No notes on this movie yet. Leave the first one above.
        </p>
      )}
    </div>
  );
};
