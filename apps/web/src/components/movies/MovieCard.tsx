
import React from 'react';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { getErrorMessage, consoleError } from '@/utils';
import Card from '@/ui/Card';
import CardTiltShell, { CardTiltSheen } from "@/ui/CardTiltShell";
import {
  MediaCardPosterWrap,
  MediaCardTitle,
  MediaCardRatingBadge,
} from "@/ui/MediaCard";
import MovieTitleEditModal from "./MovieTitleEditModal";
const MovieDetailsModal = React.lazy(() => import("./MovieDetailsModal"));
import MediaPoster from "@/ui/MediaPoster";
import MediaCardWatcherStack from "@/ui/MediaCardWatcherStack";
import { nextPosterClickAction } from "./lib/index";

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
  const [isTitleVisible, setIsTitleVisible] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [detailsOrigin, setDetailsOrigin] =
    React.useState<MovieTransitionOrigin | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const posterRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = isCompact;
  const isGuest = !currentUser;
  const watchedByBoth = movie.watchedBy.length === 2;
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
    setIsTitleVisible(true);
    setIsDetailsOpen(true);
  };

  const handlePosterClick = () => {
    if (nextPosterClickAction(isTitleVisible) === "reveal-title") {
      setIsTitleVisible(true);
      return;
    }
    handleOpenDetails();
  };

  React.useEffect(() => {
    if (!isTitleVisible || isDetailsOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as Node)) {
        setIsTitleVisible(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isDetailsOpen, isTitleVisible]);

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
        className={`movie-item-container ${watchedByBoth ? "movie-item-container--watched" : ""} ${isHighlighted ? "movie-item-container--highlighted" : ""} ${isTitleVisible ? "movie-item-container--title-visible" : ""}`}
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

              <div className="movie-item-title-overlay" aria-hidden="true">
                <MediaCardTitle className="movie-item-title-overlay__title">
                  {movie.title}
                </MediaCardTitle>
                {(movie.year || movie.imdbRating) && (
                  <div className="movie-item-title-overlay__meta">
                    {movie.year && (
                      <span className="movie-item-meta__year">{movie.year}</span>
                    )}
                    {movie.imdbRating && /^\d/.test(movie.imdbRating) && (
                      <span className="movie-item-meta__rating">
                        ★ {movie.imdbRating}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="movie-item-details-hit-area"
                onClick={handlePosterClick}
                aria-expanded={isTitleVisible}
                aria-label={
                  isTitleVisible
                    ? `View details for "${movie.title}"`
                    : `Show title for "${movie.title}"`
                }
              />
            </MediaCardPosterWrap>
          </Card>
        </CardTiltShell>
      </div>

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

      <React.Suspense fallback={null}>
        <MovieDetailsModal
          movie={movie}
          memories={memories}
          isOpen={isDetailsOpen}
          origin={detailsOrigin}
          currentUser={currentUser}
          onToggleWatched={currentUser ? handleToggle : undefined}
          isWatchedByCurrentUser={Boolean(
            currentUser && movie.watchedBy.includes(currentUser),
          )}
          isUpdatingWatchStatus={isUpdating}
          onEdit={
            onRename
              ? () => {
                  setIsDetailsOpen(false);
                  setIsTitleEditorOpen(true);
                }
              : undefined
          }
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
