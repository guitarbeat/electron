import { MovieDetailsModal } from "./MovieDetailsModal";
import { MovieEditModal } from "./MovieEditModal";

import React from "react";
import type {
  Movie,
  User,
} from "@/shared/types";

import {
  MediaPoster,
  MediaCardPosterWrap,
  MediaCardTitle,
  MediaCardWatcherStack,
  CardTiltShell,
  CardTiltSheen,
  Card,
} from "@/components/ui";

import {
  getErrorMessage,
  consoleError,
} from "@/utils";

import {
MovieTransitionOrigin
} from "./shared";

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onToggleError?: (message: string) => void;
  onDelete: () => void;
  onEditMetadata?: (updates: {
    title: string;
    customPosterUrl?: string;
  }) => Promise<void>;
  isHighlighted?: boolean;
  isCompact?: boolean;
  priorityPoster?: boolean;
  onOpenDetails?: (movie: Movie, origin?: MovieTransitionOrigin | null) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  currentUser,
  onToggle,
  onToggleError,
  onDelete,
  onEditMetadata,
  isHighlighted = false,
  isCompact = false,
  priorityPoster = false,
  onOpenDetails,
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

  const handleOpenDetails = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const rect =
      posterRef.current?.getBoundingClientRect() ??
      cardRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }
      : null;
    if (origin) {
      setDetailsOrigin(origin);
    }
    setIsTitleVisible(true);
    if (onOpenDetails) {
      onOpenDetails(movie, origin);
    } else {
      setIsDetailsOpen(true);
    }
  };

  const handlePosterClick = (e?: React.MouseEvent) => {
    handleOpenDetails(e);
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
        className={`movie-item-container ${watchedByBoth ? "movie-item-container--watched" : ""} ${isHighlighted ? "movie-item-container--highlighted" : ""} ${isTitleVisible ? "movie-item-container--title-visible" : ""} ${isDetailsOpen ? "movie-item-container--details-open" : ""}`}
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
                posterUrl={movie.customPosterUrl || movie.posterUrl}
                year={movie.year}
                id={movie.id}
                priority={priorityPoster}
              />

              <MediaCardWatcherStack
                watchers={movie.watchedBy}
                className="movie-item-watchers"
              />

              <div className="movie-item-title-overlay" aria-hidden="true">
                <MediaCardTitle className="movie-item-title-overlay__title">
                  {movie.title}
                </MediaCardTitle>
                {movie.year && (
                  <div className="movie-item-title-overlay__meta">
                    <span className="movie-item-meta__year">{movie.year}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="movie-item-details-hit-area"
                onClick={handlePosterClick}
                aria-expanded={isDetailsOpen}
                aria-label={`View details for "${movie.title}"`}
              />
            </MediaCardPosterWrap>
          </Card>
        </CardTiltShell>
      </div>

      {onEditMetadata ? (
        <MovieEditModal
          movie={movie}
          isOpen={isTitleEditorOpen}
          isMobile={isMobile}
          onClose={() => setIsTitleEditorOpen(false)}
          onSubmit={onEditMetadata}
          onDelete={onDelete}
        />
      ) : null}

      <React.Suspense fallback={null}>
        <MovieDetailsModal
          movie={movie}
          isOpen={isDetailsOpen}
          origin={detailsOrigin}
          currentUser={currentUser}
          onToggleWatched={currentUser ? handleToggle : undefined}
          isWatchedByCurrentUser={Boolean(
            currentUser && movie.watchedBy.includes(currentUser),
          )}
          isUpdatingWatchStatus={isUpdating}
          onEdit={
            onEditMetadata
              ? () => {
                  setIsTitleEditorOpen(true);
                }
              : undefined
          }
          onClose={() => setIsDetailsOpen(false)}
        />
      </React.Suspense>
    </>
  );
};

