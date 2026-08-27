import DriftWall from "@/components/ui/DriftWall";
import { interleaveCollectionItems } from "@/components/ui/lib/posterMatrix";
import type { GalleryPhoto } from "@/components/ui";
import {
  buildCollectionSections,
  compareCreatedAtDesc,
  compareStringsAlpha,
  type CollectionSections,
} from "@/utils/shared";
import {
  getListEnterSelectionIndex,
  getNextListIndex,
} from "@/components/ui/lib/workspaceListAutocomplete";
import React, {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  Movie,
  SharedMemory,
  User,
  MovieSuggestion,
  MoviesViewProps,
} from "@/shared/types";
import {
  useAutocompleteFocusBoundary,
  useWorkspaceAutocompleteDismiss,
  useWorkspaceAutocompleteNavigation,
  useWorkspaceSearchInputHandle,
} from "@/components/ui/lib/workspaceListAutocomplete";
import {
  SyncBanner,
  StremioButton,
  YoutubeButton,
  ConfirmDialog,
  Modal,
  Input,
  Textarea,
  SuggestionCardBase,
  WorkspaceSearchShell,
  WorkspaceSearchActions,
  WorkspaceSearchField,
  WorkspaceAutocompleteCopy,
  WorkspaceAutocompleteLoading,
  WorkspaceAutocompleteOption,
  WorkspaceAutocompletePanel,
  WorkspaceAutocompletePoster,
  WorkspaceAutocompleteStatus,
  Button,
  MediaPoster,
  MediaCardPosterWrap,
  MediaCardTitle,
  MediaCardWatcherStack,
  DriftWallLoading,
  CollectionEmptyState,
  MoviesEmptyIllustration,
  useModalBase,
  CardTiltShell,
  CardTiltSheen,
  MagicToggle,
  CardActionButton,
  Card,
  type BentoStatTileConfig,
  type BentoSortChipConfig,
  type SortOrder,
} from "@/components/ui";
import {
  CheckIcon,
  FilmIcon,
  MessageIcon,
  PlusIcon,
  BookmarkIcon,
  EditIcon,
  PlayIcon,
  StarIcon,
  TvIcon,
} from "@/common/Icons";
import { useViewport, useUser, useBentoSlot } from "@/app/providerContexts";
import { useFeatureFonts, mediaBreakpoints, useMediaQuery } from "@/hooks";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import {
  formatMemoryTimestamp,
  getWorkspaceCollectionState,
  MAX_MOVIE_TITLE_LENGTH,
  sanitizeInput,
  getErrorMessage,
  consoleError,
} from "@/utils";
import {
  searchMovieAutocomplete,
  getCachedMovieAutocomplete,
  type MovieAutocompleteResult,
  fetchOmdbMetadataCached,
} from "@/services/metadata";
import {
  MemoryComposer,
  MemoryList,
  INITIAL_VISIBLE_COUNT,
} from "@/components/memories/shared";
import { useMoviesWorkspace } from "@/hooks/movies";

import {
buildGalleryPhotos,
MAX_MOVIE_NOTE_LENGTH,
MAX_RECOMMENDATION_REASON_LENGTH,
MAX_GUEST_SUGGESTER_NAME_LENGTH,
MovieActionState,
getMovieActionState,
MOVIE_AUTOCOMPLETE_MIN_QUERY_LENGTH,
MOVIE_AUTOCOMPLETE_DEBOUNCE_MS,
normalizeMovieAutocompleteQuery,
shouldFetchMovieAutocomplete,
shouldClearSelectedMovieResult,
hasStoredMovieAutocompleteFeedback,
getMovieAutocompleteEnterSelectionIndex,
getNextMovieAutocompleteIndex,
MovieBrowseLayout,
MOVIE_SCROLL_DECK_MAX_DESKTOP,
MOVIE_SCROLL_DECK_MAX_MOBILE,
movieScrollDeckMax,
shouldUseMovieScrollDeck,
MOVIE_BROWSE_LAYOUTS,
readMovieBrowseLayout,
writeMovieBrowseLayout,
clampMovieTransitionOrigin,
getMovieDialogMetrics,
getMovieWatchStatus,
getMovieNotePreview,
getSecondaryMovieMemories,
MovieSortOrder,
MovieSections,
getAllMovies,
buildMovieSections,
MediaTypeFilter,
isTvSeries,
getMediaType,
filterMoviesByMediaType,
submitMemory,
MOVIE_SECTION_IDS,
MOVIE_SORTS,
PosterHero,
MetadataHeader,
NotesAndMemoriesSection,
MovieTransitionOrigin,
MovieBodyActions,
MovieSectionIds
} from "./shared";

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

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
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
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  const onCloseRef = React.useRef(onClose);
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const notesSectionRef = React.useRef<HTMLDivElement>(null);
  const { dialogRef, closeButtonRef, playPop } = useModalBase(
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
      previouslyFocusedRef.current =
        document.activeElement as HTMLElement | null;
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

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
  }, [closeButtonRef, dialogRef, isOpen]);

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
            onPosterError={() => setHasPosterError(true)}
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

            {/* Notes & Memories Section */}
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
                setVisibleCount(
                  Math.min(INITIAL_VISIBLE_COUNT, memories.length),
                );
              }}
              onUpdateMemory={onUpdateMemory}
              onDeleteMemory={onDeleteMemory}
              onTogglePin={onTogglePin}
              onAddMemory={onAddMemory}
            />

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
        </div>
      </div>
    </div>,
    document.body,
  );
};

