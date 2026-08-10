import React from "react";
import { createPortal } from "react-dom";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
import { useFeatureFonts } from "@/hooks/useFeatureFonts";
import { useModalBase } from "@/ui/ModalSystem";
import MemoryComposer from "@/memories/MemoryComposer";
import MemoryList from "@/memories/MemoryList";
import { INITIAL_VISIBLE_COUNT } from "@/memories/lib/memoryUtils";
import type { Movie, SharedMemory, User } from "@/shared/types";
import { formatMemoryTimestamp } from "@/utils";
import { MAX_MOVIE_NOTE_LENGTH } from "./lib/movieSections";
import { submitMemory } from "./lib/memorySubmit";
import type { MovieTransitionOrigin } from "./MovieCard";
import { InteractiveFolderGallery } from "@/components/ui/interactive-folder-gallery";
import { HandWritingText } from "@/components/ui/hand-writing-text";
import StremioButton from "@/components/ui/StremioButton";
import { BookmarkIcon, CheckIcon, EditIcon, PlayIcon } from "@/common/Icons";
import { CardActionButton } from "@/ui/CardActionRail";
import { isTvSeries } from "./lib/movieType";
import {
  buildGalleryPhotos,
  clampMovieTransitionOrigin,
  getMovieDialogMetrics,
  getMovieNotePreview,
  getMovieWatchStatus,
  getSecondaryMovieMemories,
} from "./lib/movieDetailsModel";

interface MovieDetailsModalProps {
  movie: Movie;
  memories?: SharedMemory[];
  isOpen: boolean;
  origin?: MovieTransitionOrigin | null;
  currentUser?: User | null;
  onToggleWatched?: () => void | Promise<void>;
  isWatchedByCurrentUser?: boolean;
  isUpdatingWatchStatus?: boolean;
  onEdit?: () => void;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  onClose: () => void;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  memories = [],
  isOpen,
  origin,
  currentUser = null,
  onToggleWatched,
  isWatchedByCurrentUser = false,
  isUpdatingWatchStatus = false,
  onEdit,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [hasPosterError, setHasPosterError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(() =>
    Math.min(INITIAL_VISIBLE_COUNT, memories.length),
  );
  const closeTimeoutRef = React.useRef<number | null>(null);
  const successTimeoutRef = React.useRef<number | null>(null);
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const notesSectionRef = React.useRef<HTMLDivElement>(null);
  const { dialogRef, closeButtonRef, playPop } = useModalBase(
    isVisible,
    onClose,
  );

  useFeatureFonts();

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    void import("@/app/skins/memories-skin.scss");
  }, [isOpen]);

  React.useEffect(() => {
    setHasPosterError(false);
    setHasCatError(false);
  }, [movie.posterUrl]);

  React.useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
  }, [memories.length, movie.id]);

  React.useEffect(() => {
    setDraftNote("");
    setSubmitSuccess(false);
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, [movie.id, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsEntering(false);
      const frame = window.requestAnimationFrame(() => {
        setIsEntering(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!isVisible) {
      return undefined;
    }

    setIsEntering(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 260);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isVisible]);

  React.useEffect(
    () => () => {
      if (successTimeoutRef.current !== null) {
        window.clearTimeout(successTimeoutRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const handleResize = () => {
      setIsEntering((current) => current);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasPosterError;
  const catUrl = `https://cataas.com/cat/says/${encodeURIComponent(movie.title || "No Poster")}?fontSize=18&width=400&height=600`;
  const metadataItems = [
    isTvSeries(movie) ? "TV Series" : "Movie",
    movie.year,
    movie.runtime,
    movie.genre?.split(",")[0]?.trim(),
    movie.category && movie.category !== "TV Series" ? movie.category : null,
    movie.director ? `Dir. ${movie.director}` : null,
  ].filter(Boolean) as string[];
  const canManageMemories = Boolean(
    onUpdateMemory && onDeleteMemory && onTogglePin,
  );
  const featuredMemory =
    memories.find((memory) => memory.isPinned) ?? memories[0] ?? null;
  const secondaryMemories = getSecondaryMovieMemories(
    memories,
    featuredMemory?.id,
    canManageMemories,
  );
  const watchStatus = getMovieWatchStatus(movie, memories.length);
  const source = clampMovieTransitionOrigin(origin ?? null);
  const { targetWidth, targetHeight } = getMovieDialogMetrics(isMobile);
  const remainingChars = MAX_MOVIE_NOTE_LENGTH - draftNote.length;
  const canSubmitNote =
    !isSubmittingMemory && draftNote.trim().length > 0 && remainingChars >= 0;
  const scaleX =
    origin && targetWidth > 0
      ? Math.min(Math.max(origin.width / targetWidth, 0.18), 1)
      : 0.32;
  const scaleY =
    origin && targetHeight > 0
      ? Math.min(Math.max(origin.height / targetHeight, 0.18), 1)
      : 0.32;

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) {
      return;
    }

    await submitMemory(draftNote, onAddMemory, {
      setIsSubmittingMemory,
      setDraftNote,
      setSubmitSuccess,
      setSubmitError,
      clearSuccessTimeout: () => {
        if (successTimeoutRef.current !== null) {
          window.clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = null;
        }
      },
      setSuccessTimeout: (callback, delay) => {
        successTimeoutRef.current = window.setTimeout(callback, delay);
      },
    });
  };

  const handleShowNotes = () => {
    notesSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.requestAnimationFrame(() => noteInputRef.current?.focus());
  };

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
      aria-label={`${movie.title} details`}
    >
      <button
        type="button"
        className="movie-details-modal__backdrop"
        onClick={onClose}
        aria-label={`Close details for ${movie.title}`}
      />

      <div
        ref={dialogRef}
        className={`movie-details-modal__dialog${isMobile ? " movie-details-modal__dialog--mobile" : ""}`}
      >
        <div className="movie-details-modal__surface">
          <button
            ref={closeButtonRef}
            type="button"
            className="movie-details-modal__close"
            onClick={() => {
              playPop();
              onClose();
            }}
            aria-label="Close movie details"
          >
            ×
          </button>

          <div className="movie-details-modal__poster-shell">
            {shouldShowPoster ? (
              <>
                <img
                  src={movie.posterUrl}
                  alt=""
                  aria-hidden="true"
                  className="movie-details-modal__poster-bg"
                />
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  className="movie-details-modal__poster"
                  onError={() => setHasPosterError(true)}
                />
              </>
            ) : !hasCatError ? (
              <>
                <img
                  src={catUrl}
                  alt=""
                  aria-hidden="true"
                  className="movie-details-modal__poster-bg"
                />
                <img
                  src={catUrl}
                  alt={`A cat representing ${movie.title}`}
                  className="movie-details-modal__poster"
                  onError={() => setHasCatError(true)}
                />
              </>
            ) : (
              <div className="movie-details-modal__poster movie-details-modal__poster--fallback">
                No Poster Available
              </div>
            )}
            <div
              className="movie-details-modal__poster-gradient"
              aria-hidden="true"
            />
            <div className="movie-details-modal__poster-badges">
              <span className="movie-details-modal__poster-pill movie-details-modal__poster-pill--status">
                {watchStatus.label}
              </span>
              {memories.length > 0 ? (
                <span className="movie-details-modal__poster-pill">
                  {memories.length} {memories.length === 1 ? "note" : "notes"}
                </span>
              ) : null}
            </div>
            <div className="movie-details-modal__poster-footer">
              <span className="movie-details-modal__poster-caption">
                Queued by {movie.addedBy}
              </span>
              {movie.watchedBy.length > 0 ? (
                <span className="movie-details-modal__poster-caption">
                  Watched by {movie.watchedBy.join(" & ")}
                </span>
              ) : null}
            </div>
          </div>

          <div className="movie-details-modal__content">
            <div className="movie-details-modal__header">
              <p className="movie-details-modal__eyebrow" aria-hidden="true">
                <HandWritingText
                  text="movie night"
                  accentColor="var(--color-accent)"
                  strokeWidth={2}
                  strokeDuration={0.55}
                  staggerDelay={0.1}
                  className="movie-details-modal__eyebrow-handwriting"
                />
              </p>
              <span className="sr-only">Movie night file</span>
              <div className="movie-details-modal__title-row">
                <h2 className="movie-details-modal__title">{movie.title}</h2>
                {movie.imdbRating && /^\d/.test(movie.imdbRating) ? (
                  <span className="movie-details-modal__score-pill">
                    {movie.imdbRating} IMDb
                  </span>
                ) : null}
              </div>

              <div className="movie-details-modal__actions" aria-label="Movie actions">
                {onToggleWatched ? (
                  <CardActionButton
                    variant="primary"
                    onClick={() => void onToggleWatched()}
                    aria-pressed={isWatchedByCurrentUser}
                    disabled={isUpdatingWatchStatus}
                    leftIcon={isWatchedByCurrentUser ? <CheckIcon /> : <PlayIcon />}
                  >
                    {isWatchedByCurrentUser ? "Watched" : "Mark watched"}
                  </CardActionButton>
                ) : null}
                <StremioButton movie={movie} variant="full" />
                <CardActionButton
                  variant="outline"
                  onClick={handleShowNotes}
                  leftIcon={<BookmarkIcon />}
                >
                  {memories.length > 0 ? `Notes (${memories.length})` : "Add note"}
                </CardActionButton>
                {onEdit ? (
                  <CardActionButton
                    variant="outline"
                    onClick={onEdit}
                    leftIcon={<EditIcon />}
                  >
                    Edit
                  </CardActionButton>
                ) : null}
              </div>

              <p className="movie-details-modal__relationship">
                {watchStatus.title}
              </p>
              <p className="movie-details-modal__supporting-copy">
                {watchStatus.detail}
              </p>
              {metadataItems.length > 0 ? (
                <div className="movie-details-modal__fact-row">
                  {metadataItems.map((item) => (
                    <span key={item} className="movie-details-modal__fact-pill">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="movie-details-modal__summary-band">
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">
                  Queued by
                </span>
                <span className="movie-details-modal__summary-value">
                  {movie.addedBy}
                </span>
              </div>
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">
                  Watch status
                </span>
                <span className="movie-details-modal__summary-value">
                  {watchStatus.label}
                </span>
              </div>
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">
                  Poster notes
                </span>
                <span className="movie-details-modal__summary-value">
                  {memories.length > 0
                    ? `${memories.length} saved`
                    : "None yet"}
                </span>
              </div>
            </div>

            {movie.plot ? (
              <div className="movie-details-modal__section">
                <p className="movie-details-modal__section-label">
                  Story setup
                </p>
                <p className="movie-details-modal__plot">{movie.plot}</p>
              </div>
            ) : null}

            <div ref={notesSectionRef} className="movie-details-modal__section">
              <div className="movie-details-modal__section-head">
                <p className="movie-details-modal__section-label">
                  Poster notes
                </p>
                {memories.length > 1 ? (
                  <span className="movie-details-modal__section-caption">
                    {memories.length} moments saved
                  </span>
                ) : null}
              </div>

              {currentUser && onAddMemory ? (
                <div className="movie-details-modal__composer-shell">
                  <p className="movie-details-modal__composer-copy">
                    Leave the note here so it stays attached to this poster.
                  </p>
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
                    onNoteChange={(nextNote) =>
                      setDraftNote(nextNote.slice(0, MAX_MOVIE_NOTE_LENGTH))
                    }
                    isComposerOpen
                    onComposerToggle={() => {}}
                    remainingChars={remainingChars}
                    error={submitError}
                    successMessage={submitSuccess ? "Saved!" : null}
                    noteInputRef={noteInputRef}
                  />
                </div>
              ) : null}

              {/* Interactive folder gallery — opens to reveal movie stills and
                  memory photos. Photos come from memory imageUrls, the movie
                  poster, and cinematic Unsplash fallbacks. */}
              <InteractiveFolderGallery
                photos={buildGalleryPhotos(memories, movie)}
                folderName={`${movie.title}.gallery`}
                dragHintText="Drag any photo down to close"
                className="movie-details-modal__gallery"
                accentColor="var(--color-accent)"
              />

              {canManageMemories ? (
                memories.length > 0 ? (
                  <div className="movie-details-modal__memory-manager">
                    <MemoryList
                      memories={memories}
                      visibleMemories={memories.slice(0, visibleCount)}
                      sortedMemories={memories}
                      contextMovieTitle={movie.title}
                      currentUser={currentUser}
                      isMobile={isMobile}
                      onEditMemory={async (memory, note) => {
                        await onUpdateMemory!(memory.id, note);
                      }}
                      onDeleteMemory={async (memory) => {
                        await onDeleteMemory!(memory.id);
                      }}
                      onTogglePin={async (memory) => {
                        await onTogglePin!(memory.id);
                      }}
                      movieFilterOptions={[]}
                      activeMovieFilter={movie.id}
                      onActiveMovieFilterChange={() => {}}
                      sortMode="newest"
                      onSortModeChange={() => {}}
                      onShowMore={() => {
                        setVisibleCount((current) =>
                          Math.min(
                            current + INITIAL_VISIBLE_COUNT,
                            memories.length,
                          ),
                        );
                      }}
                      onShowLess={() => {
                        setVisibleCount(
                          Math.min(INITIAL_VISIBLE_COUNT, memories.length),
                        );
                      }}
                      visibleCount={visibleCount}
                      isLoading={false}
                      memoriesError={null}
                      onJumpToMovie={() => {}}
                    />
                  </div>
                ) : (
                  <div className="movie-details-modal__memory-empty">
                    No notes on this poster yet. The first one will show up
                    right here.
                  </div>
                )
              ) : featuredMemory ? (
                <>
                  <article className="movie-details-modal__memory-card">
                    <div className="movie-details-modal__memory-card-header">
                      <span className="movie-details-modal__memory-author">
                        {featuredMemory.author}
                      </span>
                      <span className="movie-details-modal__memory-date">
                        {formatMemoryTimestamp(
                          featuredMemory.updatedAt || featuredMemory.createdAt,
                        )}
                      </span>
                    </div>
                    <p className="movie-details-modal__memory-note">
                      {featuredMemory.note}
                    </p>
                  </article>

                  {secondaryMemories.length > 0 ? (
                    <div className="movie-details-modal__memory-list">
                      {secondaryMemories.map((memory) => (
                        <div
                          key={memory.id}
                          className="movie-details-modal__memory-row"
                        >
                          <div className="movie-details-modal__memory-row-copy">
                            <span className="movie-details-modal__memory-row-author">
                              {memory.author}
                            </span>
                            <p className="movie-details-modal__memory-row-note">
                              {getMovieNotePreview(memory.note)}
                            </p>
                          </div>
                          <span className="movie-details-modal__memory-row-date">
                            {formatMemoryTimestamp(
                              memory.updatedAt || memory.createdAt,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="movie-details-modal__memory-empty">
                  No notes on this poster yet. The first one will show up right
                  here.
                </div>
              )}
            </div>

            <div className="movie-details-modal__footer">
              <span>Added {formatMemoryTimestamp(movie.createdAt)}</span>
              {movie.watchedBy.length > 0 ? (
                <span>Shared progress: {movie.watchedBy.join(" & ")}</span>
              ) : (
                <span>Shared progress: no watches logged yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MovieDetailsModal;
