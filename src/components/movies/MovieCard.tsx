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
  MediaCardRatingBadge,
  MediaCardSuccessBadge,
} from '@/ui/MediaCard';
import Button from '@/ui/Button';
import { colors } from '@/theme/tokens';
import { CheckIcon, EditIcon, EyeIcon, NoteIcon, PlusIcon, PlayIcon, BookmarkIcon, StarIcon } from '@/common/Icons';
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
      <div 
        className={`movie-item-container ${watchedByBoth ? 'movie-item-container--watched' : ''} ${isHighlighted ? 'movie-item-container--highlighted' : ''}`}
        data-movie-id={movie.id}
      >
        <Card
          ref={cardRef}
          variant="default"
          className="movie-item-card"
          style={{
            padding: 0,
            marginBottom: '0.75rem',
            overflow: 'hidden',
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
              <MediaCardRatingBadge
                rating={movie.imdbRating}
                className="movie-item-imdb-badge"
              />
            ) : null}

            <button
              type="button"
              className="movie-item-details-hit-area"
              onClick={handleOpenDetails}
              aria-label={`View details for "${movie.title}"`}
            >
              <span className="sr-only">{`View details for "${movie.title}"`}</span>
            </button>
          </MediaCardPosterWrap>
        </Card>

        <div className="movie-item-info-external">
          <MediaCardTitle className="movie-item-title-external">
            {movie.title}
          </MediaCardTitle>
          
          <div className="movie-item-actions-external">
            <MovieActions
              movie={movie}
              actionState={actionState}
              isUpdating={isUpdating}
              onToggle={handleToggle}
              onToggleNotes={handleOpenDetails}
              onEdit={onRename ? () => setIsTitleEditorOpen(true) : undefined}
            />
          </div>
        </div>
      </div>

      {onRename ? (
// ...
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
      className="movie-actions-external"
      variant="external"
      primary={
        actionState.showWatchedAction && (
          <CardActionButton
            variant="primary"
            onClick={handlePrimaryAction}
            aria-pressed={actionState.watchedByCurrentUser}
            leftIcon={<PlayIcon />}
            className="movie-action-btn--watch"
            disabled={isUpdating}
          >
            Watch
          </CardActionButton>
        )
      }
      secondary={
        <CardActionButton
          variant="outline"
          onClick={handleToggleNotes}
          leftIcon={<BookmarkIcon />}
          className="movie-action-btn--bookmark"
          disabled={isUpdating}
          aria-label="Bookmark"
        />
      }
      cluster={
        <CardActionButton
          variant="outline"
          onClick={handleEditAction}
          leftIcon={<StarIcon />}
          className="movie-action-btn--star"
          disabled={isUpdating}
          aria-label="Rate"
        />
      }
    />
  );
};
