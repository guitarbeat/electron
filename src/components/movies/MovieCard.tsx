import React from 'react';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { executeAction, getErrorMessage, consoleError } from '@/utils';
import Card from '@/ui/Card';
import {
  MediaCardInfo,
  MediaCardOverlay,
  MediaCardPosterWrap,
  MediaCardTitle,
} from '@/ui/MediaCard';
import Button from '@/ui/Button';
import { colors } from '@/theme/tokens';
import { CheckIcon, EditIcon, EyeIcon, NoteIcon } from '@/common/Icons';
import { getMovieActionState, type MovieActionState } from './lib/movieActionState';
import MovieTitleEditModal from './MovieTitleEditModal';
import MovieDetailsModal from './MovieDetailsModal';

export interface MovieTransitionOrigin {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onToggleError?: (message: string) => void;
  onDelete: () => void;
  onRename?: (title: string) => Promise<void>;
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
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
}) => {
  const [isTitleEditorOpen, setIsTitleEditorOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [detailsOrigin, setDetailsOrigin] = React.useState<MovieTransitionOrigin | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const posterRef = React.useRef<HTMLDivElement | null>(null);
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
  const featuredMemory = React.useMemo(
    () => memories.find((memory) => memory.isPinned) ?? memories[0] ?? null,
    [memories]
  );

  const handleOpenDetails = () => {
    const rect = posterRef.current?.getBoundingClientRect() ?? cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDetailsOrigin({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
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
      consoleError('Failed to toggle watched status', error);
      onToggleError?.(getErrorMessage(error, 'Failed to update watched status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card
        ref={cardRef}
        variant={watchedByBoth ? 'elevated' : 'default'}
        glow={watchedByBoth || isHighlighted}
        className={`movie-item-card ${
          watchedByBoth ? 'movie-item-card--watched' : ''
        } ${isHighlighted ? 'movie-item-card--highlighted' : ''} ${
          isDetailsOpen ? 'movie-item-card--opening-details' : ''
        }`}
        data-movie-id={movie.id}
        data-added-by={movie.addedBy}
        style={{
          padding: 0,
          marginBottom: 0,
          borderColor: watchedByBoth ? colors.accent : colors.border,
        }}
      >
        <MediaCardPosterWrap ref={posterRef} className="movie-item-poster-wrap">
          <MoviePoster movie={movie} />

          {movie.watchedBy.length > 0 ? (
            <div className="movie-item-watchers">
              {movie.watchedBy.includes('Aaron') ? <WatcherBadge user="Aaron" size="md" /> : null}
              {movie.watchedBy.includes('Electra') ? <WatcherBadge user="Electra" size="md" /> : null}
            </div>
          ) : null}

          {movie.imdbRating && !isHighlighted && /^\d/.test(movie.imdbRating) ? (
            <div className="movie-item-imdb-badge" aria-label={`IMDb rating: ${movie.imdbRating}`}>
              <span className="movie-item-imdb-badge__star">⭐</span>
              <span className="movie-item-imdb-badge__score">{movie.imdbRating}</span>
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

          <MediaCardOverlay
            className={`movie-item-overlay ${isHighlighted ? 'movie-item-overlay--success' : ''}`.trim()}
          >
            {featuredMemory ? (
              <MovieMemoryPreview
                memory={featuredMemory}
                additionalCount={Math.max(memories.length - 1, 0)}
                isExpanded={false}
              />
            ) : null}
            <MediaCardInfo>
              <MediaCardTitle
                className={`movie-item-title ${movie.posterUrl ? '' : 'movie-item-title--fallback'}`}
              >
                {movie.title}
              </MediaCardTitle>
              <MovieMetadata movie={movie} />
            </MediaCardInfo>
          </MediaCardOverlay>
        </MediaCardPosterWrap>

        {actionState.showActionRail ? (
          <div
            className={`movie-item-action-rail ${actionState.isGuest ? 'movie-item-action-rail--guest' : ''}`.trim()}
          >
            <MovieActions
              movie={movie}
              actionState={actionState}
              isUpdating={isUpdating}
              onToggle={handleToggle}
              onToggleNotes={handleOpenDetails}
              onEdit={onRename ? () => setIsTitleEditorOpen(true) : undefined}
            />
          </div>
        ) : null}
      </Card>

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

      <MovieDetailsModal
        movie={movie}
        memories={memories}
        isOpen={isDetailsOpen}
        origin={detailsOrigin}
        currentUser={currentUser}
        onAddMemory={onAddMemory}
        onUpdateMemory={onUpdateMemory}
        onDeleteMemory={onDeleteMemory}
        onTogglePin={onTogglePin}
        onClose={() => setIsDetailsOpen(false)}
      />
    </>
  );
};

export default MovieCard;

const getMemoryPreviewText = (note: string): string => {
  const trimmed = note.trim();
  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117).trimEnd()}...`;
};

const MovieMemoryPreview: React.FC<{
  memory: SharedMemory;
  additionalCount: number;
  isExpanded: boolean;
}> = ({ memory, additionalCount, isExpanded }) => (
  <div
    className={`movie-item-memory-preview${isExpanded ? ' is-expanded' : ''}`}
    aria-hidden="true"
  >
    <div className="movie-item-memory-preview__topline">
      <span className="movie-item-memory-preview__author">{memory.author}</span>
      <span className="movie-item-memory-preview__count">
        {additionalCount > 0 ? `+${additionalCount} more` : '1 note'}
      </span>
    </div>
    <p className="movie-item-memory-preview__note">{getMemoryPreviewText(memory.note)}</p>
  </div>
);

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
  ].filter(Boolean) as string[];

  const firstGenre = movie.genre?.split(',')[0]?.trim();

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
      {firstGenre ? (
        <div className="movie-meta-genre-row">
          <span className="movie-item-genre-chip">{firstGenre}</span>
        </div>
      ) : null}
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
