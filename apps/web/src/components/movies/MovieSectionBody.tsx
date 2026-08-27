import { SuggestionCard } from "./SuggestionCard";
import { MovieCard } from "./MovieCard";
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

interface Props_MovieSectionBody {
  sections: MovieSections;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  currentUser: User | null;
  isMobile: boolean;
  processingSuggestionId: string | null;
  successMovieId: string | null;
  movieMemories: Map<string, SharedMemory[]>;
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  posterPlaceCards?: React.ReactNode[];
  isInteractionStatic?: boolean;
}

export const MovieSectionBody: React.FC<Props_MovieSectionBody> = ({
  sections,
  isLoading,
  isSuggestionsLoading,
  currentUser,
  isMobile,
  processingSuggestionId,
  successMovieId,
  movieMemories,
  onAcceptSuggestion,
  onRejectSuggestion,
  onDeleteRequest,
  onToggleError,
  actions,
  posterPlaceCards = [],
  isInteractionStatic = false,
}) => {
  const collectionState = getWorkspaceCollectionState({
    itemCount: sections.queue.length + sections.completed.length,
    suggestionCount: sections.suggestions.length,
    isLoadingItems: isLoading && isSuggestionsLoading,
    isLoadingSuggestions: false,
  });

const renderMovie = (movie: Movie) => {
    const hasPoster = Boolean(movie.posterUrl || movie.customPosterUrl);
    const element = (
      <MovieCard
        key={movie.id}
        movie={movie}
        currentUser={currentUser}
        onToggle={() => {
          actions.toggleWatched(movie.id);
        }}
        onToggleError={onToggleError}
        onEditMetadata={async (updates) => {
          await actions.editMovie(movie.id, updates);
        }}
        onDelete={() => onDeleteRequest(movie)}
        isHighlighted={successMovieId === movie.id}
        memories={movieMemories.get(movie.id) ?? []}
        onAddMemory={
          currentUser
            ? async (note) => {
                await actions.addMemory(movie.id, movie.title, currentUser, note);
              }
            : undefined
        }
        onUpdateMemory={async (memoryId, note) => {
          await actions.updateMemory(memoryId, { note });
        }}
        onDeleteMemory={async (memoryId) => {
          await actions.deleteMemory(memoryId);
        }}
        onTogglePin={async (memoryId) => {
          await actions.togglePin(memoryId);
        }}
      />
    );
    return React.cloneElement(element, { "data-height-ratio": hasPoster ? 1 : 0.55 } as any);
  };


const allPosters = [...sections.queue, ...sections.completed];
  const suggestionCards = sections.suggestions.map((suggestion) => (
    <SuggestionCard
      key={`suggestion-${suggestion.id}`}
      suggestion={suggestion}
      onAccept={() => void onAcceptSuggestion(suggestion)}
      onReject={() => void onRejectSuggestion(suggestion)}
      canRespond={Boolean(currentUser)}
      disableActions={!currentUser}
      isProcessing={processingSuggestionId === suggestion.id}
    />
  ));
  const movieCards = allPosters.map(renderMovie);
  
  let unifiedCards: React.ReactNode[];
  if (collectionState === "loading") {
    const skeletonCount = isMobile ? 15 : 40;
unifiedCards = Array.from({ length: skeletonCount }, (_, i) => {
      const isShort = i % 5 === 2;
      return (
        <div
          key={`loading-tile-${i}`}
          className="drift-wall-loading__tile"
          data-height-ratio={isShort ? 0.55 : 1}
          style={
            {
              "--loading-tile": Math.floor(i / (isMobile ? 3 : 8)),
              "--loading-column": i % (isMobile ? 3 : 8),
              width: "100%",
              height: "100%",
            } as React.CSSProperties
          }
        />
      );
    });
  } else {
    unifiedCards = interleaveCollectionItems(
      suggestionCards,
      movieCards,
      posterPlaceCards,
    );
  }
  // ── Full section body ─────────────────────────────────────────────────────
  return (
    <div
      className="unified-wall-content"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? spacing.md : spacing.lg,
      }}
    >
      {unifiedCards.length > 0 ? (
        <div style={{ position: "relative", width: "100%", height: "100%", flex: 1, overflow: "hidden", borderRadius: isMobile ? 12 : 24 }}>
          <DriftWall
            items={unifiedCards}
            columns={isMobile ? 3 : 8}
            tileWidth={120}
            tileHeight={180}
            gap={isMobile ? 10 : 18}
            tilt={0}
            turn={-14}
            roll={0}
            perspective={2400}
            depth={120}
            speed={isMobile ? 25 : 42}
            direction="up"
            variance={0.7}
            parallax={0.6}
            lift={64}
            fade={0.4}
            dim={0.85}
            overlayColor="#060010"
            radius={isMobile ? 8 : 0}
            pauseOnHover
            grayscale={false}
          />
        </div>
      ) : (
        <CollectionEmptyState
          padding={isMobile ? spacing.md : spacing["3xl"]}
          className="poster-wall-empty"
        >
          <MoviesEmptyIllustration />
          <strong>No cards yet</strong>
          <span>Add a movie, suggestion, or place to fill this wall.</span>
        </CollectionEmptyState>
      )}
    </div>
  );
};

