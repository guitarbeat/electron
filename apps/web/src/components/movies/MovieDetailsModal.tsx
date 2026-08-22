import React from "react";
import { createPortal } from "react-dom";
import { mediaBreakpoints, useMediaQuery } from "@/hooks/useMediaQuery";
import { useFeatureFonts } from "@/hooks/useFeatureFonts";
import { useModalBase } from "@/ui/ModalSystem";
import MemoryComposer from "@/memories/MemoryComposer";
import MemoryList from "@/memories/MemoryList";
import { INITIAL_VISIBLE_COUNT } from "@/memories/lib";
import type { Movie, SharedMemory, User } from "@/shared/types";
import { formatMemoryTimestamp } from "@/utils";
import { MAX_MOVIE_NOTE_LENGTH, submitMemory, isTvSeries } from "./lib/index";
import type { MovieTransitionOrigin } from "./MovieCard";
import { InteractiveFolderGallery } from "@/components/ui/interactive-folder-gallery";
import { HandWritingText } from "@/components/ui/hand-writing-text";
import StremioButton from "@/components/ui/StremioButton";
import { BookmarkIcon, CheckIcon, EditIcon, PlayIcon } from "@/common/Icons";
import { CardActionButton } from "@/ui/CardActionRail";
import {
  buildGalleryPhotos,
  clampMovieTransitionOrigin,
  getMovieDialogMetrics,
  getMovieNotePreview,
  getMovieWatchStatus,
  getSecondaryMovieMemories,
} from "./lib/index";

/* -------------------------------------------------------------------------- */
/* Sub-component: PosterHero                                                   */
/* -------------------------------------------------------------------------- */

interface PosterHeroProps {
  movie: Movie;
  memoriesCount: number;
  watchStatusLabel: string;
  hasPosterError: boolean;
  hasCatError: boolean;
  onPosterError: () => void;
  onCatError: () => void;
}

const PosterHero: React.FC<PosterHeroProps> = ({
  movie,
  memoriesCount,
  watchStatusLabel,
  hasPosterError,
  hasCatError,
  onPosterError,
  onCatError,
}) => {
  const shouldShowPoster = Boolean(movie.posterUrl) && !hasPosterError;
  const catUrl = `https://cataas.com/cat/says/${encodeURIComponent(movie.title || "No Poster")}?fontSize=18&width=400&height=600`;

  return (
    <figure className="movie-details-modal__poster-shell" aria-label={`Poster for ${movie.title}`}>
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
            onError={onPosterError}
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
            onError={onCatError}
          />
        </>
      ) : (
        <div className="movie-details-modal__poster movie-details-modal__poster--fallback">
          No Poster Available
        </div>
      )}

      <div className="movie-details-modal__poster-gradient" aria-hidden="true" />

      {/* Badges Overlay */}
      <div className="movie-details-modal__poster-badges" role="status">
        <span className="movie-details-modal__poster-pill movie-details-modal__poster-pill--status">
          {watchStatusLabel}
        </span>
        {memoriesCount > 0 && (
          <span className="movie-details-modal__poster-pill">
            {memoriesCount} {memoriesCount === 1 ? "note" : "notes"}
          </span>
        )}
      </div>

      {/* Footer Details */}
      <figcaption className="movie-details-modal__poster-footer">
        <span className="movie-details-modal__poster-caption">
          Queued by {movie.addedBy}
        </span>
        {movie.watchedBy.length > 0 && (
          <span className="movie-details-modal__poster-caption">
            Watched by {movie.watchedBy.join(" & ")}
          </span>
        )}
      </figcaption>
    </figure>
  );
};

/* -------------------------------------------------------------------------- */
/* Sub-component: MetadataHeader                                               */
/* -------------------------------------------------------------------------- */

interface MetadataHeaderProps {
  movie: Movie;
  memoriesCount: number;
  metadataItems: string[];
  watchStatus: { title: string; detail: string; label: string };
  isWatchedByCurrentUser: boolean;
  isUpdatingWatchStatus: boolean;
  onToggleWatched?: () => void | Promise<void>;
  onEdit?: () => void;
  onShowNotes: () => void;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({
  movie,
  memoriesCount,
  metadataItems,
  watchStatus,
  isWatchedByCurrentUser,
  isUpdatingWatchStatus,
  onToggleWatched,
  onEdit,
  onShowNotes,
}) => (
  <header className="movie-details-modal__header">
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
      <h2 id="movie-details-title" className="movie-details-modal__title">
        {movie.title}
      </h2>
      {movie.imdbRating && /^\d/.test(movie.imdbRating) && (
        <span className="movie-details-modal__score-pill" aria-label={`IMDb Rating ${movie.imdbRating}`}>
          {movie.imdbRating} IMDb
        </span>
      )}
    </div>

    {/* Primary Action Buttons */}
    <div className="movie-details-modal__actions" role="toolbar" aria-label="Movie actions">
      {onToggleWatched && (
        <CardActionButton
          variant="primary"
          onClick={() => void onToggleWatched()}
          aria-pressed={isWatchedByCurrentUser}
          disabled={isUpdatingWatchStatus}
          leftIcon={isWatchedByCurrentUser ? <CheckIcon /> : <PlayIcon />}
        >
          {isWatchedByCurrentUser ? "Watched" : "Mark watched"}
        </CardActionButton>
      )}
      <StremioButton movie={movie} variant="full" />
      <CardActionButton
        variant="outline"
        onClick={onShowNotes}
        leftIcon={<BookmarkIcon />}
      >
        {memoriesCount > 0 ? `Notes (${memoriesCount})` : "Add note"}
      </CardActionButton>
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

    {/* Narrative Relationship Copy */}
    <p className="movie-details-modal__relationship">
      {watchStatus.title}
    </p>
    <p className="movie-details-modal__supporting-copy">
      {watchStatus.detail}
    </p>

    {/* Metadata Fact Pills */}
    {metadataItems.length > 0 && (
      <div className="movie-details-modal__fact-row" role="list" aria-label="Movie facts">
        {metadataItems.map((item) => (
          <span key={item} className="movie-details-modal__fact-pill" role="listitem">
            {item}
          </span>
        ))}
      </div>
    )}
  </header>
);

/* -------------------------------------------------------------------------- */
/* Sub-component: SummaryBand                                                  */
/* -------------------------------------------------------------------------- */

interface SummaryBandProps {
  addedBy: string;
  watchStatusLabel: string;
  memoriesCount: number;
}

const SummaryBand: React.FC<SummaryBandProps> = ({
  addedBy,
  watchStatusLabel,
  memoriesCount,
}) => (
  <div className="movie-details-modal__summary-band" role="region" aria-label="Movie summary facts">
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Queued by</span>
      <span className="movie-details-modal__summary-value">{addedBy}</span>
    </div>
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Watch status</span>
      <span className="movie-details-modal__summary-value">{watchStatusLabel}</span>
    </div>
    <div className="movie-details-modal__summary-item">
      <span className="movie-details-modal__meta-label">Poster notes</span>
      <span className="movie-details-modal__summary-value">
        {memoriesCount > 0 ? `${memoriesCount} saved` : "None yet"}
      </span>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Sub-component: NotesAndMemoriesSection                                      */
/* -------------------------------------------------------------------------- */

interface NotesAndMemoriesSectionProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  canManageMemories: boolean;
  visibleCount: number;
  isMobile: boolean;
  draftNote: string;
  isSubmittingMemory: boolean;
  canSubmitNote: boolean;
  remainingChars: number;
  submitError: string | null;
  submitSuccess: boolean;
  notesSectionRef: React.RefObject<HTMLDivElement | null>;
  noteInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onNoteChange: (note: string) => void;
  onMemorySubmit: (event: React.FormEvent) => Promise<void>;
  onShowMore: () => void;
  onShowLess: () => void;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  onAddMemory?: (note: string) => Promise<void>;
}

const NotesAndMemoriesSection: React.FC<NotesAndMemoriesSectionProps> = ({
  movie,
  memories,
  currentUser,
  canManageMemories,
  visibleCount,
  isMobile,
  draftNote,
  isSubmittingMemory,
  canSubmitNote,
  remainingChars,
  submitError,
  submitSuccess,
  notesSectionRef,
  noteInputRef,
  onNoteChange,
  onMemorySubmit,
  onShowMore,
  onShowLess,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  onAddMemory,
}) => {
  const featuredMemory =
    memories.find((memory) => memory.isPinned) ?? memories[0] ?? null;
  const secondaryMemories = getSecondaryMovieMemories(
    memories,
    featuredMemory?.id,
    canManageMemories,
  );

  return (
    <section ref={notesSectionRef} className="movie-details-modal__section" aria-labelledby="poster-notes-heading">
      <div className="movie-details-modal__section-head">
        <h3 id="poster-notes-heading" className="movie-details-modal__section-label">
          Poster notes
        </h3>
        {memories.length > 1 && (
          <span className="movie-details-modal__section-caption">
            {memories.length} moments saved
          </span>
        )}
      </div>

      {currentUser && onAddMemory && (
        <div className="movie-details-modal__composer-shell">
          <p className="movie-details-modal__composer-copy">
            Leave the note here so it stays attached to this poster.
          </p>
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={onMemorySubmit}
            isSubmitting={isSubmittingMemory}
            canSubmit={canSubmitNote}
            isMobile={isMobile}
            note={draftNote}
            onNoteChange={onNoteChange}
            isComposerOpen
            onComposerToggle={() => {}}
            remainingChars={remainingChars}
            error={submitError}
            successMessage={submitSuccess ? "Saved!" : null}
            noteInputRef={noteInputRef}
          />
        </div>
      )}

      {/* Interactive Folder Gallery */}
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
                await onUpdateMemory?.(memory.id, note);
              }}
              onDeleteMemory={async (memory) => {
                await onDeleteMemory?.(memory.id);
              }}
              onTogglePin={async (memory) => {
                await onTogglePin?.(memory.id);
              }}
              movieFilterOptions={[]}
              activeMovieFilter={movie.id}
              onActiveMovieFilterChange={() => {}}
              sortMode="newest"
              onSortModeChange={() => {}}
              onShowMore={onShowMore}
              onShowLess={onShowLess}
              visibleCount={visibleCount}
              isLoading={false}
              memoriesError={null}
              onJumpToMovie={() => {}}
            />
          </div>
        ) : (
          <div className="movie-details-modal__memory-empty">
            No notes on this poster yet. The first one will show up right here.
          </div>
        )
      ) : featuredMemory ? (
        <>
          <article className="movie-details-modal__memory-card">
            <header className="movie-details-modal__memory-card-header">
              <span className="movie-details-modal__memory-author">
                {featuredMemory.author}
              </span>
              <time
                className="movie-details-modal__memory-date"
                dateTime={featuredMemory.updatedAt || featuredMemory.createdAt}
              >
                {formatMemoryTimestamp(
                  featuredMemory.updatedAt || featuredMemory.createdAt,
                )}
              </time>
            </header>
            <p className="movie-details-modal__memory-note">
              {featuredMemory.note}
            </p>
          </article>

          {secondaryMemories.length > 0 && (
            <div className="movie-details-modal__memory-list">
              {secondaryMemories.map((memory) => (
                <div key={memory.id} className="movie-details-modal__memory-row">
                  <div className="movie-details-modal__memory-row-copy">
                    <span className="movie-details-modal__memory-row-author">
                      {memory.author}
                    </span>
                    <p className="movie-details-modal__memory-row-note">
                      {getMovieNotePreview(memory.note)}
                    </p>
                  </div>
                  <time
                    className="movie-details-modal__memory-row-date"
                    dateTime={memory.updatedAt || memory.createdAt}
                  >
                    {formatMemoryTimestamp(
                      memory.updatedAt || memory.createdAt,
                    )}
                  </time>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="movie-details-modal__memory-empty">
          No notes on this poster yet. The first one will show up right here.
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Component: MovieDetailsModal                                           */
/* -------------------------------------------------------------------------- */

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
    if (!isOpen) return;
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

    if (!isVisible) return undefined;

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

  const canManageMemories = Boolean(
    onUpdateMemory && onDeleteMemory && onTogglePin,
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
    if (!onAddMemory) return;

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
      aria-labelledby="movie-details-title"
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

          {/* Poster Hero Side */}
          <PosterHero
            movie={movie}
            memoriesCount={memories.length}
            watchStatusLabel={watchStatus.label}
            hasPosterError={hasPosterError}
            hasCatError={hasCatError}
            onPosterError={() => setHasPosterError(true)}
            onCatError={() => setHasCatError(true)}
          />

          {/* Main Details Body */}
          <div className="movie-details-modal__content">
            <MetadataHeader
              movie={movie}
              memoriesCount={memories.length}
              metadataItems={metadataItems}
              watchStatus={watchStatus}
              isWatchedByCurrentUser={isWatchedByCurrentUser}
              isUpdatingWatchStatus={isUpdatingWatchStatus}
              onToggleWatched={onToggleWatched}
              onEdit={onEdit}
              onShowNotes={handleShowNotes}
            />

            <SummaryBand
              addedBy={movie.addedBy}
              watchStatusLabel={watchStatus.label}
              memoriesCount={memories.length}
            />

            {/* Story Setup Section */}
            {movie.plot && (
              <section className="movie-details-modal__section" aria-labelledby="story-setup-heading">
                <h3 id="story-setup-heading" className="movie-details-modal__section-label">
                  Story setup
                </h3>
                <p className="movie-details-modal__plot">{movie.plot}</p>
              </section>
            )}

            {/* Poster Notes & Memories Section */}
            <NotesAndMemoriesSection
              movie={movie}
              memories={memories}
              currentUser={currentUser}
              canManageMemories={canManageMemories}
              visibleCount={visibleCount}
              isMobile={isMobile}
              draftNote={draftNote}
              isSubmittingMemory={isSubmittingMemory}
              canSubmitNote={canSubmitNote}
              remainingChars={remainingChars}
              submitError={submitError}
              submitSuccess={submitSuccess}
              notesSectionRef={notesSectionRef}
              noteInputRef={noteInputRef}
              onNoteChange={(nextNote) =>
                setDraftNote(nextNote.slice(0, MAX_MOVIE_NOTE_LENGTH))
              }
              onMemorySubmit={handleMemorySubmit}
              onShowMore={() => {
                setVisibleCount((current) =>
                  Math.min(current + INITIAL_VISIBLE_COUNT, memories.length),
                );
              }}
              onShowLess={() => {
                setVisibleCount(Math.min(INITIAL_VISIBLE_COUNT, memories.length));
              }}
              onUpdateMemory={onUpdateMemory}
              onDeleteMemory={onDeleteMemory}
              onTogglePin={onTogglePin}
              onAddMemory={onAddMemory}
            />

            {/* Footer Status Metadata */}
            <footer className="movie-details-modal__footer">
              <span>Added {formatMemoryTimestamp(movie.createdAt)}</span>
              <span>
                Shared progress:{" "}
                {movie.watchedBy.length > 0
                  ? movie.watchedBy.join(" & ")
                  : "no watches logged yet"}
              </span>
            </footer>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MovieDetailsModal;

