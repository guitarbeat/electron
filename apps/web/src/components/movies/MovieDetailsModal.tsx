



import React from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "motion/react";
import type {
  Movie,
  User,
} from "@/shared/types";

import {
  useModalBase,
} from "@/components/ui";

import { useFeatureFonts, mediaBreakpoints, useMediaQuery } from "@/hooks";
import {
  formatMemoryTimestamp,
} from "@/utils";

import {
  clampMovieTransitionOrigin,
  getMovieDialogMetrics,
  getMovieWatchStatus,
  isTvSeries,
  PosterHero,
  MetadataHeader,
  MovieTransitionOrigin,
} from "./shared";

interface MovieDetailsModalProps {
  movie: Movie;
  isOpen: boolean;
  origin?: MovieTransitionOrigin | null;
  currentUser?: User | null;
  activeUsers?: User[];
  onToggleWatched?: () => void | Promise<void>;
  onToggleUserWatched?: (user: User) => void | Promise<void>;
  isWatchedByCurrentUser?: boolean;
  isUpdatingWatchStatus?: boolean;
  onEdit?: () => void;
  onClose: () => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isOpen,
  origin,
  activeUsers = [],
  onToggleWatched,
  onToggleUserWatched,
  isWatchedByCurrentUser = false,
  isUpdatingWatchStatus = false,
  onEdit,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [hasPosterError, setHasPosterError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);
  const closeTimeoutRef = React.useRef<number | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const dragControls = useDragControls();
  const { dialogRef, close } = useModalBase(
    isVisible,
    onClose,
  );

  useFeatureFonts();

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    setHasPosterError(false);
  }, [movie.posterUrl, movie.customPosterUrl]);

  React.useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
      setIsVisible(true);
      setIsEntering(false);
      let frame2: number | undefined;
      const frame = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => {
          setIsEntering(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(frame);
        if (frame2) window.cancelAnimationFrame(frame2);
      };
    }

    if (!isVisible) return undefined;

    setIsEntering(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 550);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isVisible]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [close, dialogRef, isOpen]);

  if (!isVisible) {
    return null;
  }

  const metadataItems = [
    isTvSeries(movie) ? "TV Series" : "Movie",
    movie.year,
    movie.runtime,
    movie.genre?.split(",")[0]?.trim(),
    movie.category && movie.category !== "TV Series" ? movie.category : null,
    movie.director ? `Dir. ${movie.director}` : null,
  ].filter(Boolean) as string[];

  const watchStatus = getMovieWatchStatus(movie);
  const source = clampMovieTransitionOrigin(origin ?? null);
  const { targetWidth, targetHeight } = getMovieDialogMetrics(isMobile);

  const scaleX =
    origin && targetWidth > 0
      ? Math.min(Math.max(origin.width / targetWidth, 0.18), 1)
      : 0.32;
  const scaleY =
    origin && targetHeight > 0
      ? Math.min(Math.max(origin.height / targetHeight, 0.18), 1)
      : 0.32;

  return createPortal(
    <div
      className={`movie-details-modal${isEntering ? " is-open" : ""}`}
      style={
        {
          "--movie-origin-top": source.top,
          "--movie-origin-left": source.left,
          "--movie-origin-width": source.width,
          "--movie-origin-height": source.height,
          "--movie-origin-scale-x": String(scaleX),
          "--movie-origin-scale-y": String(scaleY),
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-details-title"
    >
      <button
        type="button"
        className="movie-details-modal__backdrop"
        onClick={close}
        aria-label={`Close details for ${movie.title}`}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`movie-details-modal__dialog${isMobile ? " movie-details-modal__dialog--mobile" : ""}`}
      >
        <motion.div 
          className="movie-details-modal__surface"
          drag={isMobile ? "y" : false}
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 120 || info.velocity.y > 400) {
              close();
            }
          }}
        >
          {isMobile && (
            <div 
              className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center z-50 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1.5 bg-white/30 rounded-full" />
            </div>
          )}
          {/* Poster Hero Side */}
          <PosterHero
            movie={movie}
            watchStatusLabel={watchStatus.label}
            hasPosterError={hasPosterError}
            onPosterError={() => setHasPosterError(true)}
            isMobile={isMobile}
            metadataItems={metadataItems}
            watchStatus={watchStatus}
            isWatchedByCurrentUser={isWatchedByCurrentUser}
            isUpdatingWatchStatus={isUpdatingWatchStatus}
            onToggleWatched={onToggleWatched}
            onToggleUserWatched={onToggleUserWatched}
            activeUsers={activeUsers}
            onEdit={onEdit}
            onClose={close}
            isOpen={isOpen}
          />
          {/* Main Details Body (Mobile Only) */}
          {isMobile && (
            <div className="movie-details-modal__content">
              <MetadataHeader
                movie={movie}
                metadataItems={metadataItems}
                watchStatus={watchStatus}
                isWatchedByCurrentUser={isWatchedByCurrentUser}
                isUpdatingWatchStatus={isUpdatingWatchStatus}
                onToggleWatched={onToggleWatched}
                onToggleUserWatched={onToggleUserWatched}
                activeUsers={activeUsers}
                onEdit={onEdit}
              />
              {/* Overview / Plot Section */}
              {movie.plot && (
                <section
                  className="movie-details-modal__section"
                  aria-labelledby="movie-overview-heading"
                >
                  <h3
                    id="movie-overview-heading"
                    className="movie-details-modal__section-label"
                  >
                    Overview
                  </h3>
                  <p className="movie-details-modal__plot">{movie.plot}</p>
                </section>
              )}
              {/* Footer Status Metadata */}
              <footer className="movie-details-modal__footer">
                <span>
                  Catalog item added {formatMemoryTimestamp(movie.createdAt)}
                </span>
                <span>
                  {movie.watchedBy.length === 2
                    ? "Watched by Aaron & Electra"
                    : movie.watchedBy.length === 1
                      ? `Watched by ${movie.watchedBy[0]}`
                      : "Not watched yet"}
                </span>
              </footer>
            </div>
          )}
        </motion.div>
      </div>
    </div>,
    document.body,
  );
};

