import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Movie, User } from "@/shared/types";
import {
  CardActionButton,
  PageFlip,
  StremioButton,
  YoutubeButton,
  type PageFlipLeaf,
} from "@/components/ui";
import { useProfileSelection } from "@/app/ProfilePinContext";
import { CheckIcon, EditIcon, PlayIcon } from "@/common/Icons";
import { playXmbCue, playXmbOpen } from "@/services/xmbAudio";
import { getCachedPosterUrlSync } from "@/services/posterCache";
import { getCachedObjectUrlSync } from "@/utils/imageCache";
import { resolvePosterUrl } from "@/utils";
import { WatchStatusArtwork } from "./WatchStatusArtwork";
import {
  BookOverview,
  isTvSeries,
} from "./shared";

const BOOKLET_USERS: User[] = ["Aaron", "Electra"];

export interface MovieInlineBookletProps {
  movie: Movie;
  currentUser: User | null;
  activeUsers?: User[];
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onToggleUserWatched?: (user: User | "Both") => void | Promise<void>;
  onEdit?: () => void;
  onStartClose?: () => void;
  onClose: () => void;
  isClosingExternal?: boolean;
  isMobile?: boolean;
  initialPosterSize?: { width: number; height: number } | null;
}

const BOOKLET_FLIP_DURATION_S = 0.42;
const CLOSE_ANIMATION_MS = 430;
const GRID_COLUMN_GAP_PX = 16;

function isBookletActionTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      '[data-book-row="people"] button, [data-book-row="actions"] button, [data-book-row="actions"] a, .book-overview__more',
    ),
  );
}

export const MovieInlineBooklet: React.FC<MovieInlineBookletProps> = ({
  movie,
  activeUsers = [],
  isUpdatingWatchStatus,
  onToggleWatched,
  onToggleUserWatched,
  onEdit,
  onStartClose,
  onClose,
  isClosingExternal = false,
  initialPosterSize = null,
}) => {
  const { requestLogin } = useProfileSelection();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const hasOpenedRef = useRef(false);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const [turnedCount, setTurnedCount] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [hasPosterError, setHasPosterError] = useState(false);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>(() => {
    if (initialPosterSize && initialPosterSize.width > 60 && initialPosterSize.height > 80) {
      return {
        width: Math.round(initialPosterSize.width * 2 + GRID_COLUMN_GAP_PX),
        height: Math.round(initialPosterSize.height),
      };
    }
    const defaultColWidth =
      typeof window !== "undefined" && window.innerWidth <= 640 ? 136 : 152;
    return {
      width: defaultColWidth * 2 + GRID_COLUMN_GAP_PX,
      height: Math.round(defaultColWidth * 1.5),
    };
  });

  useEffect(() => {
    setHasPosterError(false);
  }, [movie.posterUrl, movie.customPosterUrl]);

  useEffect(() => {
    playXmbOpen();
    const openTimer = window.setTimeout(() => {
      if (isClosingRef.current) return;
      hasOpenedRef.current = true;
      setTurnedCount(1);
    }, 24);

    const node = containerRef.current;
    const scrollTimer =
      node && typeof node.scrollIntoView === "function"
        ? window.setTimeout(() => {
            node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          }, 120)
        : null;

    return () => {
      window.clearTimeout(openTimer);
      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      if (isClosingRef.current) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 120) {
        const singleColWidth = Math.max(96, (rect.width - GRID_COLUMN_GAP_PX) / 2);
        const exactPosterHeight = Math.round(singleColWidth * 1.5);
        setStageSize((prev) => {
          const nextWidth = Math.round(rect.width);
          const nextHeight =
            initialPosterSize && initialPosterSize.height > 80
              ? Math.round(initialPosterSize.height)
              : exactPosterHeight;
          if (prev.width === nextWidth && prev.height === nextHeight) {
            return prev;
          }
          return { width: nextWidth, height: nextHeight };
        });
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [initialPosterSize]);

  const compactMetadataLine = useMemo(() => {
    const formattedRuntime = movie.runtime
      ? movie.runtime.replace(/\s*min(utes?)?$/i, "m")
      : null;
    const primaryGenre = movie.genre?.split(",")[0]?.trim() || null;
    const ratingItem =
      movie.imdbRating && movie.imdbRating !== "N/A"
        ? `★ ${movie.imdbRating}`
        : null;
    return [
      isTvSeries(movie) ? "Series" : null,
      movie.year,
      formattedRuntime,
      primaryGenre,
      ratingItem,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [movie]);

  const rawPosterUrl = movie.customPosterUrl || movie.posterUrl;
  const cachedPoster =
    getCachedObjectUrlSync(rawPosterUrl) || getCachedPosterUrlSync(rawPosterUrl);
  const resolvedPosterUrl = cachedPoster || rawPosterUrl;
  const isCustomOrValid = Boolean(resolvedPosterUrl) && !hasPosterError;
  const activePosterUrl = isCustomOrValid
    ? (resolvedPosterUrl as string)
    : resolvePosterUrl(undefined, movie.id || movie.title);

  // Each leaf matches 1 poster column width and 1 poster row height; closedShift anchors the closed cover to Column 1
  const { pageWidth, pageHeight, spineShift, closedShift } = useMemo(() => {
    const computedPageWidth = Math.max(
      104,
      Math.round((stageSize.width - GRID_COLUMN_GAP_PX) / 2),
    );
    const computedPageHeight = Math.max(156, stageSize.height);
    const computedSpineShift = Math.round(computedPageWidth / 2);
    return {
      pageWidth: computedPageWidth,
      pageHeight: computedPageHeight,
      spineShift: computedSpineShift,
      closedShift: -computedSpineShift,
    };
  }, [stageSize]);

  const requestCloseBooklet = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setTurnedCount(0);
    onStartClose?.();
    playXmbCue("cancel");
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, CLOSE_ANIMATION_MS);
  }, [onStartClose, onClose]);

  useEffect(() => {
    if (isClosingExternal && !isClosingRef.current) {
      requestCloseBooklet();
    }
  }, [isClosingExternal, requestCloseBooklet]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    const handleContainerClick = (event: MouseEvent) => {
      if (isBookletActionTarget(event.target)) return;
      event.stopPropagation();
      requestCloseBooklet();
    };
    node.addEventListener("click", handleContainerClick, true);
    return () => {
      node.removeEventListener("click", handleContainerClick, true);
    };
  }, [requestCloseBooklet]);

  const handlePageChange = useCallback(
    (nextCount: number) => {
      if (isClosingRef.current) {
        setTurnedCount(0);
        return;
      }
      setTurnedCount(nextCount);
      if (nextCount === 0 && hasOpenedRef.current) {
        requestCloseBooklet();
      }
    },
    [requestCloseBooklet],
  );

  const isBothWatched =
    movie.watchedBy.includes("Aaron") && movie.watchedBy.includes("Electra");

  const pages: PageFlipLeaf[] = useMemo(
    () => [
      {
        id: "cover",
        front: activePosterUrl,
        frontAlt: `${movie.title} cover`,
        back: (
          <div
            className="book-page book-page--actions border-l border-white/10 select-none relative z-10 cursor-pointer"
            data-compact-page="true"
            title="Click to close booklet"
          >
            <div className="book-actions-layout">
              <div
                className="book-actions-stack"
                role="group"
                aria-label="Mark watch status for Aaron and Electra"
                data-book-row="people"
              >
                {BOOKLET_USERS.map((user) => {
                  const isWatched = movie.watchedBy.includes(user);
                  const isWatching = movie.watchingBy?.includes(user) ?? false;
                  const status = isWatched
                    ? "Watched"
                    : isWatching
                      ? "Watching"
                      : "Unwatched";
                  const nextStatus = isWatched
                    ? "not watched"
                    : isWatching
                      ? "watched"
                      : "watching";
                  const stateClass = isWatched
                    ? "is-watched"
                    : isWatching
                      ? "is-watching"
                      : "is-unwatched";

                  const handleAvatarToggle = () => {
                    if (onToggleUserWatched) {
                      void onToggleUserWatched(user);
                      return;
                    }
                    if (
                      onToggleWatched &&
                      (activeUsers.includes(user) || activeUsers.length === 0)
                    ) {
                      void onToggleWatched();
                      return;
                    }
                    requestLogin(user);
                  };

                  return (
                    <button
                      key={user}
                      type="button"
                      className={`flipbook-avatar-btn flipbook-avatar-btn--stacked flipbook-avatar-btn--${user.toLowerCase()} ${stateClass}`}
                      onClick={handleAvatarToggle}
                      disabled={isUpdatingWatchStatus}
                      aria-pressed={isWatched || isWatching}
                      aria-label={`${user}: ${status}. Tap to mark as ${nextStatus}.`}
                      title={`${user}: ${status} (Tap to cycle to ${nextStatus})`}
                    >
                      <span className="flipbook-avatar-btn__face">
                        <WatchStatusArtwork
                          user={user}
                          status={isWatched ? "seen" : isWatching ? "watching" : "queue"}
                          className="watch-expression-art"
                        />
                        <span className="flipbook-avatar-btn__badge" aria-hidden="true">
                          {isWatched ? (
                            <CheckIcon size={10} />
                          ) : isWatching ? (
                            <PlayIcon size={10} />
                          ) : (
                            "+"
                          )}
                        </span>
                      </span>
                      <span className="flipbook-avatar-btn__row">
                        <span className="flipbook-avatar-btn__name">{user}</span>
                        <span className="flipbook-avatar-btn__status">{status}</span>
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className={`flipbook-avatar-btn flipbook-avatar-btn--stacked flipbook-avatar-btn--both ${isBothWatched ? "is-watched" : "is-unwatched"}`}
                  onClick={() => {
                    if (onToggleUserWatched) {
                      void onToggleUserWatched("Both");
                      return;
                    }
                    requestLogin();
                  }}
                  disabled={isUpdatingWatchStatus}
                  aria-pressed={isBothWatched}
                  aria-label={
                    isBothWatched
                      ? "Both watched. Tap to clear watch status for Aaron and Electra."
                      : "Watched by both: Tap to mark watched for both Aaron and Electra."
                  }
                  title={
                    isBothWatched
                      ? "Both watched (Tap to reset)"
                      : "Mark watched for both Aaron & Electra"
                  }
                >
                  <span className="flipbook-avatar-btn__face flipbook-avatar-btn__face--both">
                    <WatchStatusArtwork
                      status={isBothWatched ? "seen" : "watching"}
                      className="user-avatar-img watch-expression-art watch-expression-art--both"
                    />
                  </span>
                  <span className="flipbook-avatar-btn__row">
                    <span className="flipbook-avatar-btn__name">Both</span>
                    <span className="flipbook-avatar-btn__status">
                      {isBothWatched ? "Watched" : "Mark both"}
                    </span>
                  </span>
                </button>
              </div>

              <div
                className="movie-details-modal__primary-row"
                role="toolbar"
                aria-label="Movie actions"
                data-book-row="actions"
              >
                {movie.mediaType === "youtube" && movie.youtubeUrl ? (
                  <YoutubeButton
                    url={movie.youtubeUrl}
                    movieTitle={movie.title}
                    variant="full"
                  />
                ) : (
                  <StremioButton movie={movie} variant="full" />
                )}

                {onEdit && (
                  <CardActionButton
                    variant="outline"
                    onClick={onEdit}
                    leftIcon={<EditIcon />}
                  >
                    Edit
                  </CardActionButton>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "details",
        front: (
          <div
            className="book-page book-page--info border-r border-white/10 select-none relative cursor-pointer"
            data-compact-page="true"
            title="Click to close booklet"
          >
            <header className="book-info__header">
              <h2
                className="movie-details-modal__title book-info__title"
                title={movie.title}
                data-title-length={
                  movie.title.length > 40
                    ? "xlong"
                    : movie.title.length > 22
                      ? "long"
                      : undefined
                }
              >
                {movie.title}
              </h2>
              {compactMetadataLine ? (
                <p className="book-info__meta-line">{compactMetadataLine}</p>
              ) : null}
            </header>

            {movie.plot ? (
              <div className="book-overview">
                <BookOverview text={movie.plot} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center px-2">
                No plot summary available.
              </div>
            )}
          </div>
        ),
      },
    ],
    [
      activePosterUrl,
      movie,
      compactMetadataLine,
      isUpdatingWatchStatus,
      onToggleWatched,
      onToggleUserWatched,
      activeUsers,
      onEdit,
      requestLogin,
      isBothWatched,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="movie-inline-booklet movie-inline-booklet--compact"
      data-movie-id={movie.id}
      data-inline-booklet="true"
      data-booklet-closing={isClosing ? "true" : undefined}
      role="region"
      aria-label={`${movie.title} booklet`}
      style={{ height: pageHeight }}
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
            closedShift={closedShift}
            pageRadius={8}
            turnAngle={180}
            peekAngle={0}
            duration={BOOKLET_FLIP_DURATION_S}
            ease="easeOut"
            closeEase="easeOutBack"
            shadow={0.42}
            interactive={!isClosing}
            closeOnLeave={false}
            closeOnClickOutside={true}
            autoOpen={false}
            forceClose={isClosing}
            maxTurnCount={1}
            turnedCount={turnedCount}
            onPageChange={handlePageChange}
            onBackgroundClick={requestCloseBooklet}
          />
        </div>
      </div>
    </div>
  );
};
