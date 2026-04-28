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
import MediaPoster from '@/ui/MediaPoster';
import { CardActionRail, CardActionButton } from '@/ui/CardActionRail';
import MediaCardWatcherStack from '@/ui/MediaCardWatcherStack';
import MediaCardMetadata from '@/ui/MediaCardMetadata';

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
          <MediaPoster
            title={movie.title}
            posterUrl={movie.posterUrl}
            year={movie.year}
            id={movie.id}
          />

          <MediaCardWatcherStack
            watchers={movie.watchedBy}
            className="movie-item-watchers"
          />

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
              <MediaCardMetadata
                items={[movie.year, movie.runtime]}
                badge={movie.category}
                chips={movie.genre ? [movie.genre.split(',')[0].trim()] : []}
                className="movie-metadata"
              />
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
    <CardActionRail
      className="movie-actions"
      primary={
        actionState.showWatchedAction && (
          <Button
            type="button"
            onClick={handlePrimaryAction}
            variant={actionState.watchedByCurrentUser ? 'primary' : 'secondary'}
            size="sm"
            isLoading={isUpdating}
            loadingText="Updating..."
            aria-pressed={actionState.watchedByCurrentUser}
            aria-label={actionState.primaryActionAriaLabel ?? undefined}
            className={`workspace-card-action workspace-card-action--primary movie-item-primary-action ${
              actionState.watchedByCurrentUser
                ? 'movie-item-primary-action--watched'
                : 'movie-item-primary-action--unwatched'
            }`}
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
        )
      }
      secondary={
        actionState.showNotesAction && (
          <CardActionButton
            isExpansive
            onClick={handleToggleNotes}
            leftIcon={<NoteIcon className="movie-item-note-action__icon" style={{ width: '15px', height: '15px' }} />}
            aria-label={actionState.notesButtonAriaLabel ?? undefined}
            disabled={isUpdating}
            className="movie-item-memory-toggle movie-item-note-action"
          >
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
          </CardActionButton>
        )
      }
      cluster={
        !actionState.isGuest && onEdit && (
          <CardActionButton
            isCompact
            onClick={handleEditAction}
            title={`Edit title for "${movie.title}"`}
            aria-label={`Edit title for "${movie.title}"`}
            leftIcon={<EditIcon style={{ width: '15px', height: '15px' }} />}
            disabled={isUpdating}
            className="movie-icon-action--edit"
          >
            Edit
          </CardActionButton>
        )
      }
    />
  );
};
