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

interface MovieRecommendationComposerProps {
  currentUser: User | null;
  movieTitle: string;
  guestName: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onGuestNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
}

export const MovieRecommendationComposer: React.FC<
  MovieRecommendationComposerProps
> = ({
  currentUser,
  movieTitle,
  guestName,
  reason,
  error,
  isSubmitting,
  onGuestNameChange,
  onReasonChange,
  onSubmit,
  onCancel,
}) => {
  const remainingChars = MAX_RECOMMENDATION_REASON_LENGTH - reason.length;

  return (
    <Card
      variant="default"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.borderSubtle}`,
        background: `radial-gradient(circle at top right, ${colors.accentMuted} 0%, transparent 54%), linear-gradient(180deg, ${colors.surface2}, ${colors.surface1})`,
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}
      >
        <p
          style={{
            margin: 0,
            ...typography.presets.eyebrow,
            color: colors.accentLight,
          }}
        >
          Recommendation
        </p>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(", "),
            fontSize: typography.fontSize.lg,
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {movieTitle}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {currentUser
            ? `Send this to Suggestions as ${currentUser}.`
            : "Guests can send titles to Suggestions too. Add your name if you want credit."}
        </p>
      </div>

      {!currentUser ? (
        <Input
          label="Your Name (Optional)"
          value={guestName}
          onChange={(event) =>
            onGuestNameChange(
              event.target.value.slice(0, MAX_GUEST_SUGGESTER_NAME_LENGTH),
            )
          }
          placeholder="Guest"
          maxLength={MAX_GUEST_SUGGESTER_NAME_LENGTH}
        />
      ) : null}

      <Textarea
        label="Why This One? (Optional)"
        value={reason}
        onChange={(event) =>
          onReasonChange(
            event.target.value.slice(0, MAX_RECOMMENDATION_REASON_LENGTH),
          )
        }
        placeholder="A quick reason, vibe, or inside joke."
        maxLength={MAX_RECOMMENDATION_REASON_LENGTH}
        rows={3}
        style={{ minHeight: "88px" }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
          }}
        >
          {remainingChars} characters left
        </span>

        <div style={{ display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void onSubmit()}
            isLoading={isSubmitting}
          >
            Send recommendation
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: colors.error,
            fontSize: typography.fontSize.xs,
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}30`,
            borderRadius: radius.md,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
};

