import React from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { executeAction, getErrorMessage } from '@/utils';
import Card from '@/ui/Card';
import MediaCard from '@/ui/MediaCard';
import Button from '@/ui/Button';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';
import { colors, spacing, typography } from '@/theme/tokens';
import { CheckIcon, EditIcon, EyeIcon, NoteIcon } from '@/common/icons';
import { MAX_MOVIE_NOTE_LENGTH } from './watchlistConstants';
import { getMovieActionState, type MovieActionState } from './movieActionState';
import MovieTitleEditModal from './MovieTitleEditModal';
import MovieDetailsModal from './MovieDetailsModal';
import { INITIAL_VISIBLE_COUNT } from '@/memories/memoryUtils';

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onToggleError?: (message: string) => void;
  onDelete: () => void;
  onRename?: (title: string) => Promise<void>;
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
  const [hasImageError, setHasImageError] = React.useState(false);
  const sources = USER_PHOTOS[user] ?? [];

  React.useEffect(() => {
    setIndex(0);
    setHasImageError(false);
  }, [user]);

  const handleError = () => {
    if (index < sources.length - 1) {
      setIndex((current) => current + 1);
      return;
    }

    setHasImageError(true);
  };

  if (hasImageError || sources.length === 0 || index >= sources.length) {
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
      {showLabel ? <span className="watcher-badge__label">{user}</span> : null}
    </div>
  );
};

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  currentUser,
  onToggle,
  onToggleError,
  onDelete,
  onRename,
  animationDelay,
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
}) => {
  const [showMemories, setShowMemories] = React.useState(false);
  const [isTitleEditorOpen, setIsTitleEditorOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isGuest = !currentUser;
  const watchedByBoth = movie.watchedBy.length === 2;
  const actionState = React.useMemo(
    () =>
      getMovieActionState({
        movie,
        currentUser,
        memoriesCount: memories.length,
      }),
    [currentUser, memories.length, movie]
  );

  const handleToggleMemories = () => {
    setShowMemories((current) => !current);
  };

  const handleOpenDetails = () => {
    setIsDetailsOpen(true);
  };

  const handleToggle = async () => {
    if (isGuest) {
      return;
    }

    setIsUpdating(true);
    try {
      await onToggle();
    } catch (error) {
      console.error('Failed to toggle watched status', error);
      onToggleError?.(getErrorMessage(error, 'Failed to update watched status.'));
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
        <MediaCard.PosterWrap className="movie-item-poster-wrap">
          <MoviePoster movie={movie} />

          {movie.watchedBy.length > 0 ? (
            <div className="movie-item-watchers">
              {movie.watchedBy.includes('Aaron') ? <WatcherBadge user="Aaron" size="md" /> : null}
              {movie.watchedBy.includes('Electra') ? <WatcherBadge user="Electra" size="md" /> : null}
            </div>
          ) : null}

          {isHighlighted ? (
            <div className="movie-item-success-badge" aria-hidden>
              <span className="movie-item-success-badge__icon">
                <CheckIcon size={12} />
              </span>
              <span className="movie-item-success-badge__copy">
                <span className="movie-item-success-badge__eyebrow">Queued</span>
                <span className="movie-item-success-badge__title">Just added</span>
              </span>
            </div>
          ) : null}

          <button
            type="button"
            className="movie-item-details-hit-area"
            onClick={handleOpenDetails}
            aria-label={`View details for "${movie.title}"`}
          >
            <span className="sr-only">{`View details for "${movie.title}"`}</span>
          </button>

          <MediaCard.Overlay
            className={`movie-item-overlay ${isHighlighted ? 'movie-item-overlay--success' : ''}`.trim()}
          >
            <MediaCard.Info>
              <MediaCard.Title
                className={`movie-item-title ${movie.posterUrl ? '' : 'movie-item-title--fallback'}`}
              >
                {movie.title}
              </MediaCard.Title>
              <MovieMetadata movie={movie} />
            </MediaCard.Info>
          </MediaCard.Overlay>
        </MediaCard.PosterWrap>

        {actionState.showActionRail ? (
          <div
            className={`movie-item-action-rail ${actionState.isGuest ? 'movie-item-action-rail--guest' : ''}`.trim()}
          >
            <MovieActions
              movie={movie}
              actionState={actionState}
              isUpdating={isUpdating}
              onToggle={handleToggle}
              onToggleNotes={handleToggleMemories}
              onEdit={onRename ? () => setIsTitleEditorOpen(true) : undefined}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </Card>

      {showMemories ? (
        <MovieMemories
          movie={movie}
          memories={memories}
          currentUser={currentUser}
          isMobile={isMobile}
          onClose={handleToggleMemories}
          onAddMemory={onAddMemory}
          onUpdateMemory={onUpdateMemory}
          onDeleteMemory={onDeleteMemory}
          onTogglePin={onTogglePin}
        />
      ) : null}

      {onRename ? (
        <MovieTitleEditModal
          movie={movie}
          isOpen={isTitleEditorOpen}
          isMobile={isMobile}
          onClose={() => setIsTitleEditorOpen(false)}
          onSubmit={onRename}
          onDelete={onDelete}
        />
      ) : null}

      <MovieDetailsModal movie={movie} isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
    </>
  );
};

export default MovieCard;

const MoviePoster: React.FC<{ movie: Movie; className?: string }> = ({ movie, className = '' }) => {
  const [hasImageError, setHasImageError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(false);
    setHasCatError(false);
  }, [movie.posterUrl]);

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasImageError;
  const catUrl = `https://cataas.com/cat?width=300&height=450&_id=${encodeURIComponent(movie.id || movie.title || 'cat')}`;

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
      ) : !hasCatError ? (
        <>
          <img
            src={catUrl}
            alt={`A cat representing ${movie.title}`}
            loading="lazy"
            className="movie-poster movie-poster--cat-fallback"
            onError={() => setHasCatError(true)}
          />
          <div className="movie-poster-cat-title" aria-hidden="true">
            {movie.title}
          </div>
        </>
      ) : (
        <div className="movie-poster-fallback">
          <div className="movie-poster-fallback__inner">
            <h3 className="movie-poster-fallback__title">{movie.title}</h3>
            {movie.year ? <span className="movie-poster-fallback__year">{movie.year}</span> : null}
          </div>
        </div>
      )}
    </div>
  );
};

const MovieMetadata: React.FC<{ movie: Movie; className?: string }> = ({ movie, className = '' }) => {
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
            {index > 0 ? <span className="movie-meta-separator">&bull;</span> : null}
            <span className="movie-meta-item">{item}</span>
          </React.Fragment>
        ))}
        {movie.category ? (
          <span className="movie-category" aria-label={`Category: ${movie.category}`}>
            {movie.category}
          </span>
        ) : null}
      </div>
    </div>
  );
};

interface MovieActionsProps {
  movie: Movie;
  actionState: MovieActionState;
  isUpdating: boolean;
  onToggle: () => void;
  onToggleNotes: () => void;
  onEdit?: () => void;
  onDelete: () => void;
}

const MovieActions: React.FC<MovieActionsProps> = ({
  movie,
  actionState,
  isUpdating,
  onToggle,
  onToggleNotes,
  onEdit,
}) => {
  const iconActionClassName = (modifierClassName: string) =>
    `movie-item-icon-action ${modifierClassName}${isUpdating ? ' is-disabled' : ''}`;

  const handlePrimaryAction = () => {
    executeAction(onToggle);
  };

  const handleToggleNotes = () => {
    executeAction(onToggleNotes);
  };

  const handleEditAction = () => {
    if (actionState.isGuest || !onEdit) {
      return;
    }

    executeAction(onEdit);
  };

  if (!actionState.showActionRail) {
    return null;
  }

  return (
    <div className="movie-actions">
      {actionState.showWatchedAction ? (
        <div className="movie-actions__row movie-actions__row--primary">
          <Button
            type="button"
            onClick={handlePrimaryAction}
            variant={actionState.watchedByCurrentUser ? 'primary' : 'secondary'}
            size="sm"
            isLoading={isUpdating}
            loadingText="Updating..."
            aria-pressed={actionState.watchedByCurrentUser}
            aria-label={actionState.primaryActionAriaLabel ?? undefined}
            className={`movie-item-primary-action ${
              actionState.watchedByCurrentUser
                ? 'movie-item-primary-action--watched'
                : 'movie-item-primary-action--unwatched'
            }`}
            style={
              actionState.watchedByCurrentUser
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
            {actionState.watchedByCurrentUser ? (
              <CheckIcon style={{ width: '15px' }} />
            ) : (
              <EyeIcon style={{ width: '15px' }} />
            )}
            <span className="movie-item-primary-action-label">
              <span className="movie-item-primary-action-label--long">
                {actionState.primaryActionLabel}
              </span>
              <span className="movie-item-primary-action-label--short" aria-hidden>
                {actionState.primaryActionCompactLabel}
              </span>
            </span>
          </Button>
        </div>
      ) : null}

      <div className="movie-actions__row movie-actions__row--secondary">
        {actionState.showNotesAction ? (
          <button
            type="button"
            onClick={handleToggleNotes}
            className="movie-item-memory-toggle movie-item-note-action"
            aria-label={actionState.notesButtonAriaLabel ?? undefined}
            disabled={isUpdating}
          >
            <NoteIcon className="movie-item-note-action__icon" style={{ width: '15px', height: '15px' }} />
            <span className="movie-item-note-action__label">
              <span className="movie-item-note-action__label--long">
                {actionState.notesButtonLabel}
              </span>
              <span className="movie-item-note-action__label--short" aria-hidden>
                {actionState.notesButtonCompactLabel}
              </span>
            </span>
            {actionState.notesBadgeText ? (
              <span className="movie-item-note-action__count" aria-hidden>
                {actionState.notesBadgeText}
              </span>
            ) : null}
          </button>
        ) : null}

        {!actionState.isGuest ? (
          <div className="movie-secondary-actions">
            {onEdit ? (
              <button
                type="button"
                onClick={handleEditAction}
                title={`Edit title for "${movie.title}"`}
                aria-label={`Edit title for "${movie.title}"`}
                className={iconActionClassName('movie-icon-action--edit')}
                disabled={isUpdating}
              >
                <EditIcon style={{ width: '15px', height: '15px' }} />
              </button>
            ) : null}

          </div>
        ) : null}
      </div>
    </div>
  );
};

interface MovieMemoriesProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  isMobile: boolean;
  onClose: () => void;
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
  onClose,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState('');
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(() =>
    Math.min(INITIAL_VISIBLE_COUNT, memories.length)
  );
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const memoriesListRef = React.useRef<HTMLDivElement>(null);
  const remainingChars = MAX_MOVIE_NOTE_LENGTH - draftNote.length;
  const canSubmitNote =
    !isSubmittingMemory && draftNote.trim().length > 0 && remainingChars >= 0;

  React.useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
  }, [memories.length, movie.id]);

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) {
      return;
    }

    const trimmedNote = draftNote.trim();
    if (!trimmedNote) {
      return;
    }

    setIsSubmittingMemory(true);
    try {
      await onAddMemory(trimmedNote);
      setDraftNote('');
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        noteInputRef.current?.focus();
        if (memoriesListRef.current) {
          memoriesListRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 1200);
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
        background: `linear-gradient(180deg, ${colors.surface2} 0%, ${colors.surface1} 42%, ${colors.surface0} 100%)`,
        border: `1px solid ${colors.borderSubtle}`,
        borderTop: 'none',
        borderLeft: `3px solid ${colors.accentMuted}`,
        boxShadow: '0 18px 34px rgba(18, 11, 7, 0.24)',
        position: 'relative',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notes panel"
        style={{
          position: 'absolute',
          top: spacing.sm,
          right: spacing.sm,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: `1px solid ${colors.borderSubtle}`,
          background: 'rgba(255,255,255,0.07)',
          color: colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          lineHeight: 1,
          padding: 0,
        }}
      >
        &times;
      </button>

      {currentUser && onAddMemory ? (
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
            successMessage={submitSuccess ? 'Saved!' : null}
            noteInputRef={noteInputRef}
          />
        </div>
      ) : null}

      {memories.length > 0 ? (
        <div ref={memoriesListRef}>
          <MemoryList
            memories={memories}
            visibleMemories={memories.slice(0, visibleCount)}
            sortedMemories={memories}
            contextMovieTitle={movie.title}
            currentUser={currentUser}
            isMobile={isMobile}
            onEditMemory={async (memory, note) => {
              if (onUpdateMemory) {
                await onUpdateMemory(memory.id, note);
              }
            }}
            onDeleteMemory={async (memory) => {
              if (onDeleteMemory) {
                await onDeleteMemory(memory.id);
              }
            }}
            onTogglePin={async (memory) => {
              if (onTogglePin) {
                await onTogglePin(memory.id);
              }
            }}
            movieFilterOptions={[]}
            activeMovieFilter={movie.id}
            onActiveMovieFilterChange={() => {}}
            sortMode="newest"
            onSortModeChange={() => {}}
            onShowMore={() => {
              setVisibleCount((current) =>
                Math.min(current + INITIAL_VISIBLE_COUNT, memories.length)
              );
            }}
            onShowLess={() => {
              setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
            }}
            visibleCount={visibleCount}
            isLoading={false}
            memoriesError={null}
            onJumpToMovie={() => {}}
          />
        </div>
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
