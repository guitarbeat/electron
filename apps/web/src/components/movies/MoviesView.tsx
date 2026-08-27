import DriftWall from "@/components/ui/DriftWall";
import {  interleaveCollectionItems } from "@/components/ui/lib/posterMatrix";
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
MovieSectionIds,
  MoviesWorkspaceViewProps,
} from "./shared";

import { MovieCard } from "./MovieCard";
import { MovieDetailsModal } from "./MovieDetailsModal";
import { MovieEditModal } from "./MovieEditModal";
import { SuggestionCard } from "./SuggestionCard";
import { MovieSectionBody } from "./MovieSectionBody";
import { MovieRecommendationComposer } from "./MovieRecommendationComposer";
import { MoviesTopControls, type MoviesTopControlsHandle } from "./MoviesTopControls";

export const MoviesView: React.FC<MoviesWorkspaceViewProps> = ({
  isPaused = false,
  hideSearch: _hideSearch = false,
  posterPlaceCards = [],
  isInteractionStatic = false,
}) => {
  const { currentUser } = useUser();
  const { registerTabConfig } = useBentoSlot();
  const { isMobile } = useViewport();
  const setConfig = React.useCallback(
    (config: Parameters<typeof registerTabConfig>[1]) =>
      registerTabConfig("movies", config),
    [registerTabConfig],
  );
  const [sortOrder, setSortOrder] = useState<MovieSortOrder>("recent");
  const moviesTopControlsRef = useRef<MoviesTopControlsHandle | null>(null);
  const focusSearchInput = useCallback(() => {
    moviesTopControlsRef.current?.focusSearchInput();
  }, []);
  const {
    searchQuery,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    setSelectedAutocompleteResult,
    resetRecommendationComposer,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
    processingSuggestionId,
    previousMoviesRef,
    movies,
    isLoading,
    pendingSuggestions,
    isSuggestionsLoading,
    memories,
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    retryMoviesWorkspaceSync,
    toggleWatched,
    editMovie,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
  } = useMoviesWorkspace({ currentUser, isPaused, focusSearchInput });
  const movieMemories = useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();
    const movieLookupByTitle = new Map<string, string>(); // lowercase title -> movieId

    const safeMovies = Array.isArray(movies) ? movies : [];
    const safeMemories = Array.isArray(memories) ? memories : [];

    safeMovies.forEach((movie) => {
      if (movie && movie.title) {
        movieLookupByTitle.set(movie.title.trim().toLowerCase(), movie.id);
      }
    });
    safeMemories.forEach((memory) => {
      if (!memory) return;
      let targetMovieId: string | undefined;

      if (memory.movieId) {
        targetMovieId = memory.movieId;
      } else if (memory.movieTitle) {
        targetMovieId = movieLookupByTitle.get(
          memory.movieTitle.trim().toLowerCase(),
        );
      }

      if (targetMovieId) {
        let movieGroup = memoriesByMovieId.get(targetMovieId);
        if (!movieGroup) {
          movieGroup = [];
          memoriesByMovieId.set(targetMovieId, movieGroup);
        }
        movieGroup.push(memory);
      }
    });
    return memoriesByMovieId;
  }, [memories, movies]);
  const sections = useMemo(
    () => buildMovieSections(movies, pendingSuggestions, sortOrder),
    [movies, pendingSuggestions, sortOrder],
  );

  const movieStats = useMemo(
    (): BentoStatTileConfig[] => [
      {
        id: "incoming",
        label: "Incoming",
        count: sections.suggestions.length,
        icon: <MessageIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.incoming,
        tone: "incoming",
      },
      {
        id: "queue",
        label: "Up Next",
        count: sections.queue.length,
        icon: <FilmIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.queue,
        tone: "default",
      },
      {
        id: "watched",
        label: "Watched",
        count: sections.completed.length,
        icon: <CheckIcon size={14} />,
        sectionId: MOVIE_SECTION_IDS.completed,
        tone: "completed",
      },
    ],
    [
      sections.suggestions.length,
      sections.queue.length,
      sections.completed.length,
    ],
  );

  const handleMovieSortChange = useCallback((order: SortOrder) => {
    setSortOrder(order as MovieSortOrder);
  }, []);

  useEffect(() => {
    setConfig({
      stats: [],
      sorts: MOVIE_SORTS,
      activeSortOrder: sortOrder,
      onSortChange: handleMovieSortChange,
      ariaLabel: "Movies workspace controls",
    });
  }, [setConfig, movieStats, sortOrder, handleMovieSortChange]);

  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    const previousMoviesMap = new Map<string, Movie>();
    for (const entry of previousMoviesRef.current) {
      previousMoviesMap.set(entry.id, entry);
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesMap.get(movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          setSuccessMovieId(movie.id);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: "success",
          });
        }
      }
    });
    previousMoviesRef.current = movies;
  }, [movies, previousMoviesRef, setSuccessMovieId, setToast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
      setSelectedAutocompleteResult(null);
    }
  }, [resetRecommendationComposer, searchQuery, setSelectedAutocompleteResult]);

  return (
    <section className="library-movies" aria-label="Movies and places">
      <h2 className="workspace-section-heading library-movies-heading">
        <span className="workspace-section-heading__content">
          <span className="workspace-section-heading__label">
            Movies & Places
          </span>
        </span>
      </h2>

      <div className="watchlist-container places-container">
        {isMoviesWorkspaceDegraded && (
          <SyncBanner
            isBlocked={isMoviesWorkspaceSyncBlocked}
            onRetry={() => void retryMoviesWorkspaceSync()}
            label={
              isMoviesWorkspaceSyncBlocked
                ? "A shared movies change conflicted with local edits. Refresh and retry."
                : moviesWorkspaceSyncWarning ||
                  "Movie changes are being kept locally until shared sync recovers."
            }
          />
        )}
        <MovieSectionBody
          sections={sections}
          isLoading={isLoading}
          isSuggestionsLoading={isSuggestionsLoading}
          currentUser={currentUser}
          isMobile={isMobile}
          processingSuggestionId={processingSuggestionId}
          successMovieId={successMovieId}
          movieMemories={movieMemories}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onDeleteRequest={setMovieToDelete}
          onToggleError={(message) => setToast({ message, type: "error" })}
          actions={{
            toggleWatched,
            editMovie,
            addMemory,
            updateMemory,
            deleteMemory: deleteMemoryRecord,
            togglePin: toggleMemoryPin,
          }}
          posterPlaceCards={posterPlaceCards}
          isInteractionStatic={isInteractionStatic}
        />
        {movieToDelete && (
          <ConfirmDialog
            isOpen={Boolean(movieToDelete)}
            title="Remove Movie"
            message={`Are you sure you want to remove "${movieToDelete.title}"?`}
            onConfirm={confirmDelete}
            onCancel={() => setMovieToDelete(null)}
            confirmText="Remove"
            variant="danger"
          />
        )}
      </div>
    </section>
  );
};

