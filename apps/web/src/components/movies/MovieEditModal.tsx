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

interface MovieEditModalProps {
  movie: Movie;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSubmit: (updates: {
    title: string;
    customPosterUrl?: string;
  }) => Promise<void>;
  onDelete?: () => void;
}

export const MovieEditModal: React.FC<MovieEditModalProps> = ({
  movie,
  isOpen,
  isMobile,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [draftTitle, setDraftTitle] = React.useState(movie.title);
  const [draftPosterUrl, setDraftPosterUrl] = React.useState(
    movie.customPosterUrl || "",
  );
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftTitle(movie.title);
    setDraftPosterUrl(movie.customPosterUrl || "");
    setError(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, movie.title, movie.customPosterUrl]);

  const cleanTitle = sanitizeInput(draftTitle);
  const cleanPosterUrl = draftPosterUrl.trim();
  const isUnchanged =
    cleanTitle === movie.title &&
    cleanPosterUrl === (movie.customPosterUrl || "");

  const canSubmit =
    !isSaving &&
    Boolean(cleanTitle) &&
    cleanTitle.length <= MAX_MOVIE_TITLE_LENGTH &&
    !isUnchanged;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        title: cleanTitle,
        customPosterUrl: cleanPosterUrl || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update movie",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Movie"
      ariaLabel={`Edit details for ${movie.title}`}
      closeDisabled={isSaving}
      closeDisabledLabel="Saving changes"
      variant={isMobile ? "bottom-sheet" : "centered"}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textSecondary,
              ...typography.presets.bodySm,
            }}
          >
            Update the shared movie title or provide a custom poster image URL.
          </p>

          <Input
            ref={inputRef}
            label="Movie title"
            value={draftTitle}
            onChange={(event) => {
              setDraftTitle(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            maxLength={MAX_MOVIE_TITLE_LENGTH}
            placeholder="Enter movie title"
            error={error ?? undefined}
          />

          <Input
            label="Custom poster URL (optional)"
            value={draftPosterUrl}
            onChange={(event) => {
              setDraftPosterUrl(event.target.value);
              if (error) {
                setError(null);
              }
            }}
            placeholder="https://example.com/poster.jpg"
          />

          <div
            aria-live="polite"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.sm,
              color: colors.textTertiary,
              ...typography.presets.caption,
            }}
          >
            <span>
              {isUnchanged
                ? "Make a change to save."
                : "Changes are shared immediately."}
            </span>
            <span>
              {draftTitle.length}/{MAX_MOVIE_TITLE_LENGTH}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          {onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onDelete();
                onClose();
              }}
              disabled={isSaving}
              style={{ color: colors.error ?? "#c0392b" }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}

          <div style={{ display: "flex", gap: spacing.sm }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              disabled={!canSubmit}
            >
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

