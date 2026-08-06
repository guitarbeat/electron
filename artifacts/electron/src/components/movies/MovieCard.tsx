
import React from 'react';
import { useCardTilt } from '@/hooks/useCardTilt';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { executeAction, getErrorMessage, consoleError } from '@/utils';
import Card from '@/ui/LegacyCard';
import CardTiltShell, { CardTiltSheen } from "@/ui/CardTiltShell";
import {
  MediaCardPosterWrap,
  MediaCardTitle,
  MediaCardRatingBadge,
} from "@/ui/MediaCard";
import { CheckIcon, EditIcon, PlayIcon, BookmarkIcon } from "@/common/Icons";
import {
  getMovieActionState,
  type MovieActionState,
} from "./lib/movieActionState";
import MovieTitleEditModal from "./MovieTitleEditModal";
const MovieDetailsModal = React.lazy(() => import("./MovieDetailsModal"));
import MediaPoster from "@/ui/MediaPoster";
import { CardActionRail, CardActionButton } from "@/ui/CardActionRail";
import MediaCardWatcherStack from "@/ui/MediaCardWatcherStack";

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
  isCompact?: boolean;
  priorityPoster?: boolean;
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
  isCompact = false,
  priorityPoster = false,
}) => {
  const [isTitleEditorOpen, setIsTitleEditorOpen] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [detailsOrigin, setDetailsOrigin] =
    React.useState<MovieTransitionOrigin | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const posterRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = isCompact;
  const isGuest = !currentUser;
  const watchedByBoth = movie.watchedBy.length === 2;
  const actionState = React.useMemo(
    () =>
      getMovieActionState({
        movie,
        currentUser,
        memoriesCount: memories.length,
      }),
    [currentUser, memories.length, movie],
  );
  const handleOpenDetails = () => {
    const rect =
      posterRef.current?.getBoundingClientRect() ??
      cardRef.current?.getBoundingClientRect();
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
      consoleError("Failed to toggle watched status", error);
      onToggleError?.(
        getErrorMessage(error, "Failed to update watched status."),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div
        className={`movie-item-container ${watchedByBoth ? "movie-item-container--watched" : ""} ${isHighlighted ? "movie-item-container--highlighted" : ""}`}
        data-movie-id={movie.id}
      >
        <CardTiltShell disabled={isCompact}>
          <Card
            ref={cardRef}
            variant="default"
            className="movie-item-card chroma-card"
            data-added-by={movie.addedBy}
            style={{
              padding: 0,
              marginBottom: "0.75rem",
              overflow: "hidden",
            }}
          >
            <CardTiltSheen />
            <MediaCardPosterWrap
              ref={posterRef}
              className="movie-item-poster-wrap"
            >
              <MediaPoster
                title={movie.title}
                posterUrl={movie.posterUrl}
                year={movie.year}
                id={movie.id}
                priority={priorityPoster}
              />

              <MediaCardWatcherStack
                watchers={movie.watchedBy}
                className="movie-item-watchers"
              />

              {movie.imdbRating &&
              !isHighlighted &&
              /^\d/.test(movie.imdbRating) ? (
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
        </CardTiltShell>

        <div className="movie-item-info-external">
          <MediaCardTitle className="movie-item-title-external">
            {movie.title}
          </MediaCardTitle>

          {(movie.year || movie.imdbRating) && (
            <div className="movie-item-meta-external">
              {movie.year && <span className="movie-item-meta__year">{movie.year}</span>}
              {movie.imdbRating && /^\d/.test(movie.imdbRating) && (
                <span className="movie-item-meta__rating">★ {movie.imdbRating}</span>
              )}
            </div>
          )}

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

      <React.Suspense fallback={null}>
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
      </React.Suspense>
    </>
  );
};

export default React.memo(MovieCard);

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
            aria-label={
              actionState.primaryActionAriaLabel ??
              actionState.primaryActionLabel
            }
            leftIcon={
              actionState.watchedByCurrentUser ? <CheckIcon /> : <PlayIcon />
            }
            className="movie-action-btn--watch"
            disabled={isUpdating}
          >
            {actionState.primaryActionCompactLabel}
          </CardActionButton>
        )
      }
      secondary={
        actionState.showNotesAction ? (
          <CardActionButton
            variant="outline"
            onClick={handleToggleNotes}
            leftIcon={<BookmarkIcon />}
            className="movie-action-btn--bookmark"
            disabled={isUpdating}
            aria-label={
              actionState.notesButtonAriaLabel ?? actionState.notesButtonLabel
            }
            title={actionState.notesButtonLabel}
          />
        ) : null
      }
      cluster={
        onEdit && !actionState.isGuest ? (
          <CardActionButton
            variant="outline"
            onClick={handleEditAction}
            leftIcon={<EditIcon />}
            className="movie-action-btn--star"
            disabled={isUpdating}
            aria-label={`Edit "${movie.title}"`}
          />
        ) : null
      }
    />
  );
};
