import { MovieDetailsModal } from "./MovieDetailsModal";
import { MovieEditModal } from "./MovieEditModal";
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
SummaryBand,
NotesAndMemoriesSection,
MovieTransitionOrigin,
MovieBodyActions,
MovieSectionIds
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
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
  isCompact?: boolean;
  priorityPoster?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  currentUser,
  onToggle,
  onToggleError,
  onDelete,
  onEditMetadata,
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
            onEditMetadata
              ? () => {
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

