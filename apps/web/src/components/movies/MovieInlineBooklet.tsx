import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Movie, User } from "@/shared/types";
import { PageFlip, type PageFlipLeaf } from "@/components/ui";
import { playXmbCue, playXmbOpen } from "@/services/xmbAudio";
import { getCachedPosterUrlSync } from "@/services/posterCache";
import { getCachedObjectUrlSync } from "@/utils/imageCache";
import { resolvePosterUrl } from "@/utils";
import {
  BookOverview,
  MetadataHeader,
  getMovieWatchStatus,
  isTvSeries,
} from "./shared";

export interface MovieInlineBookletProps {
  movie: Movie;
  currentUser: User | null;
  activeUsers?: User[];
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onToggleUserWatched?: (user: User | "Both") => void | Promise<void>;
  onEdit?: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

export const MovieInlineBooklet: React.FC<MovieInlineBookletProps> = ({
  movie,
  activeUsers = [],
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onToggleUserWatched,
  onEdit,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hasOpenedRef = useRef(false);
  const [turnedCount, setTurnedCount] = useState(0);
  const [hasPosterError, setHasPosterError] = useState(false);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>(() => ({
    width: typeof window !== "undefined" && window.innerWidth <= 640 ? 280 : 320,
    height: typeof window !== "undefined" && window.innerWidth <= 640 ? 210 : 240,
  }));

  useEffect(() => {
    setHasPosterError(false);
  }, [movie.posterUrl, movie.customPosterUrl]);

  useEffect(() => {
    playXmbOpen();
    hasOpenedRef.current = true;
    setTurnedCount(1);
    const node = containerRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, 90);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 80) {
        setStageSize({
          width: rect.width,
          height: rect.height > 80 ? rect.height : Math.round((rect.width / 2) * 1.5),
        });
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metadataItems = useMemo(
    () =>
      [
        isTvSeries(movie) ? "TV Series" : "Movie",
        movie.year,
        movie.runtime,
        movie.genre?.split(",")[0]?.trim(),
      ].filter(Boolean) as string[],
    [movie],
  );

  const watchStatus = useMemo(() => getMovieWatchStatus(movie), [movie]);

  const rawPosterUrl = movie.customPosterUrl || movie.posterUrl;
  const cachedPoster =
    getCachedObjectUrlSync(rawPosterUrl) || getCachedPosterUrlSync(rawPosterUrl);
  const resolvedPosterUrl = cachedPoster || rawPosterUrl;
  const isCustomOrValid = Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = isCustomOrValid
    ? (resolvedPosterUrl as string)
    : resolvePosterUrl(undefined, movie.id || movie.title);

  // Each open booklet leaf matches 1 poster column width and 1 poster row height
  const { pageWidth, pageHeight, spineShift } = useMemo(() => {
    const computedPageWidth = Math.max(110, Math.floor(stageSize.width / 2));
    const computedPageHeight = Math.max(
      165,
      stageSize.height > 80 ? Math.round(stageSize.height) : Math.round(computedPageWidth * 1.5),
    );
    return {
      pageWidth: computedPageWidth,
      pageHeight: computedPageHeight,
      spineShift: Math.round(computedPageWidth / 2),
    };
  }, [stageSize]);

  const handlePageChange = useCallback(
    (nextCount: number) => {
      setTurnedCount(nextCount);
      if (nextCount === 0 && hasOpenedRef.current) {
        playXmbCue("cancel");
        onClose();
      }
    },
    [onClose],
  );

  const pages: PageFlipLeaf[] = useMemo(
    () => [
      {
        id: "cover",
        front: activePosterUrl,
        frontAlt: `${movie.title} cover`,
        back: (
          <div
            className="book-page book-page--meta border-l border-white/10 select-none relative z-10"
            data-compact-page="true"
            title="Click or swipe page to close booklet"
          >
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
          </div>
        ),
      },
      {
        id: "details",
        front: (
          <div
            className="book-page book-page--details border-r border-white/10 select-none relative"
            data-compact-page="true"
            title="Click or swipe page to close booklet"
          >
            {movie.plot ? (
              <section
                aria-labelledby={`movie-overview-heading-${movie.id}`}
                className="book-overview"
              >
                <h3
                  id={`movie-overview-heading-${movie.id}`}
                  className="movie-details-modal__section-label"
                >
                  Overview
                </h3>
                <BookOverview text={movie.plot} />
              </section>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center px-2">
                No overview recorded for this title.
              </div>
            )}
            <footer className="book-page__meta">
              <span>Added {new Date(movie.createdAt).toLocaleDateString()}</span>
              <span>
                {movie.watchedBy.length === 2
                  ? "Watched by Aaron & Electra"
                  : movie.watchedBy.length === 1
                    ? `Watched by ${movie.watchedBy[0]}`
                    : (movie.watchingBy?.length ?? 0) > 0
                      ? `Watching: ${movie.watchingBy?.join(" & ")}`
                      : "Not watched yet"}
              </span>
            </footer>
          </div>
        ),
      },
    ],
    [
      activePosterUrl,
      movie,
      metadataItems,
      watchStatus,
      isWatchedByCurrentUser,
      isUpdatingWatchStatus,
      onToggleWatched,
      onToggleUserWatched,
      activeUsers,
      onEdit,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="movie-inline-booklet movie-inline-booklet--compact"
      data-movie-id={movie.id}
      data-inline-booklet="true"
      role="region"
      aria-label={`${movie.title} booklet`}
    >
      <div ref={stageRef} className="movie-inline-booklet__stage">
        <div
          className="movie-inline-booklet__spread-frame"
          style={{
            width: pageWidth * 2,
            height: pageHeight,
          }}
        >
          <PageFlip
            pages={pages}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            spineShift={spineShift}
            pageRadius={6}
            turnAngle={180}
            peekAngle={10}
            shadow={0.42}
            closeOnLeave={false}
            closeOnClickOutside={false}
            autoOpen={true}
            maxTurnCount={1}
            turnedCount={turnedCount}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};
