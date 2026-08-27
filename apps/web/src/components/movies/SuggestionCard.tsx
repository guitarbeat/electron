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

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  className?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  className,
}) => {
  const [posterUrl, setPosterUrl] = React.useState<string | undefined>(
    undefined,
  );
  const [year, setYear] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetchOmdbMetadataCached(
      suggestion.title,
      suggestion.type,
      suggestion.imdbID,
      controller.signal,
    )
      .then((meta) => {
        if (cancelled) return;
        setPosterUrl(meta.poster);
        setYear(meta.year);
      })
      .catch(() => {
        // Silent fail — fallback chain handles missing posters
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [suggestion.title, suggestion.type, suggestion.imdbID]);

  return (
    <SuggestionCardBase
      suggestedBy={suggestion.suggestedBy}
      title={suggestion.title}
      subtitle={suggestion.reason}
      year={year}
      imdbRating={undefined} // We don't fetch imdbRating yet in SuggestionMovieCard, but we can if we extend the fetcher.
      onAccept={onAccept}
      onReject={onReject}
      canRespond={canRespond}
      disableActions={disableActions}
      isProcessing={isProcessing}
      className={[`movie-item-card suggestion-item-card`, className]
        .filter(Boolean)
        .join(" ")}
      media={
        <MediaPoster
          title={suggestion.title}
          posterUrl={posterUrl}
          year={year}
          id={suggestion.id}
        />
      }
      details={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "4px",
          }}
        >
          {/* We remove year from here since it's now in the overlay */}
          {suggestion.type === "youtube" && suggestion.youtubeUrl ? (
            <YoutubeButton url={suggestion.youtubeUrl} movieTitle={suggestion.title} variant="pill" />
          ) : (
            <StremioButton
              movie={{
                title: suggestion.title,
                imdbID: suggestion.imdbID,
                mediaType: suggestion.type as "movie" | "series",
              }}
              variant="pill"
            />
          )}
        </div>
      }
    />
  );
};

