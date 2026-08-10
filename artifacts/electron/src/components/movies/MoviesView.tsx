import { useViewport } from "@/app/ViewportContext";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUser } from "@/app/useProviders";
import type {
  Movie,
  SharedMemory,
  MoviesViewProps,
} from "@/shared/types";
import ConfirmDialog from "@/ui/ConfirmDialog";
import { CheckIcon, FilmIcon, MessageIcon } from "../common/Icons.tsx";
import SyncBanner from "@/components/ui/SyncBanner";
import MovieSectionBody from "@/ui/MovieSectionBody";
import { useMoviesWorkspace } from "@/hooks/movies/useMoviesWorkspace";
import MoviesTopControls, {
  type MoviesTopControlsHandle,
} from "./MoviesTopControls";
import { buildMovieSections, type MovieSortOrder } from "./lib/movieSections";
import { filterMoviesByMediaType, isTvSeries, type MediaTypeFilter } from "./lib/movieType";
import type { MovieAutocompleteResult } from "@/services/metadata";
import {
  type BentoStatTileConfig,
  type BentoSortChipConfig,
  type SortOrder,
} from "@/components/ui/BentoWorkspaceController";
import { useBentoSlot } from "@/app/BentoSlotContext";
import { useMoviesWorkspaceActions } from "@/hooks/movies/useMoviesWorkspaceActions";
import "./MoviesPhotoMode.css";

const MOVIE_SECTION_IDS = {
  incoming: "movies-section-incoming",
  queue: "movies-section-queue",
  completed: "movies-section-watched",
};

const MOVIE_SORTS: BentoSortChipConfig[] = [
  { value: "recent", label: "🕐 Recent" },
  { value: "alpha", label: "A→Z" },
  { value: "rating", label: "★ Rating" },
];

const MoviesView: React.FC<MoviesViewProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const { registerTabConfig } = useBentoSlot();
  const { isMobile } = useViewport();
  const setConfig = React.useCallback(
    (config: Parameters<typeof registerTabConfig>[1]) =>
      registerTabConfig("movies", config),
    [registerTabConfig],
  );
  const [sortOrder, setSortOrder] = useState<MovieSortOrder>("recent");
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] =
    useState(false);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [guestName, setGuestName] = useState("");
  const [selectedAutocompleteResult, setSelectedAutocompleteResult] =
    useState<MovieAutocompleteResult | null>(null);
  const moviesTopControlsRef = useRef<MoviesTopControlsHandle | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    isSubmittingRecommendation,
    previousMoviesRef,
    movies,
    isLoading,
    addMovie,
    deleteMovie,
    pendingSuggestions,
    submitRecommendation,
    acceptSuggestionToWatchlist,
    rejectPendingSuggestion,
    isSuggestionsLoading,
    memories,
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    retryMoviesWorkspaceSync,
    toggleWatched,
    renameMovie,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
  } = useMoviesWorkspace({ currentUser, isPaused });
  const movieMemories = useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();
    const movieLookupByTitle = new Map<string, string>(); // lowercase title -> movieId

    movies.forEach((movie) => {
      movieLookupByTitle.set(movie.title.trim().toLowerCase(), movie.id);
    });
    memories.forEach((memory) => {
      let targetMovieId: string | undefined;

      if (memory.movieId) {
        targetMovieId = memory.movieId;
      } else {
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
  const [mediaTypeFilter, setMediaTypeFilterState] = useState<MediaTypeFilter>(() => {
    const param = new URLSearchParams(window.location.search).get("format");
    return (param === "movie" || param === "series" ? param : "all") as MediaTypeFilter;
  });

  const setMediaTypeFilter = useCallback((next: MediaTypeFilter) => {
    setMediaTypeFilterState(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "all") {
      params.delete("format");
    } else {
      params.set("format", next);
    }
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`,
    );
  }, []);

  const filteredMovies = useMemo(
    () => filterMoviesByMediaType(movies, mediaTypeFilter),
    [movies, mediaTypeFilter],
  );
  const sections = useMemo(
    () => buildMovieSections(filteredMovies, pendingSuggestions, sortOrder),
    [filteredMovies, pendingSuggestions, sortOrder],
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
  const latestMemory = memories[0] ?? null;
  const upNextSummaryCount =
    sections.queue.length + sections.suggestions.length;

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

  const focusSearchInput = useCallback(() => {
    moviesTopControlsRef.current?.focusSearchInput();
  }, []);

  const {
    resetRecommendationComposer,
    handleRecommendationReasonChange,
    openRecommendationComposer,
    handleAddAction,
    handleSubmitRecommendation,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    confirmDelete,
  } = useMoviesWorkspaceActions({
    currentUser,
    guestName,
    isAdding,
    setIsAdding,
    isSubmittingRecommendation,
    searchQuery,
    setSearchQuery,
    selectedAutocompleteResult,
    setSelectedAutocompleteResult,
    recommendationReason,
    setRecommendationReason,
    setIsRecommendationComposerOpen,
    setSuggestionError,
    setSuccessMovieId,
    setToast,
    addMovie,
    submitRecommendation,
    acceptSuggestionToWatchlist,
    rejectPendingSuggestion,
    deleteMovie,
    movieToDelete,
    setMovieToDelete,
    focusSearchInput,
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
      setSelectedAutocompleteResult(null);
    }
  }, [resetRecommendationComposer, searchQuery]);

  return (
    <>
      <div className="movies-search-container">
        <MoviesTopControls
          ref={moviesTopControlsRef}
          currentUser={currentUser}
          upNextCount={upNextSummaryCount}
          watchedCount={sections.completed.length}
          noteCount={memories.length}
          latestNoteMovieTitle={latestMemory?.movieTitle ?? null}
          latestNoteAuthor={latestMemory?.author ?? null}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedAutocompleteResult={selectedAutocompleteResult}
          setSelectedAutocompleteResult={setSelectedAutocompleteResult}
          guestName={guestName}
          setGuestName={setGuestName}
          onSubmit={handleAddAction}
          onRecommend={openRecommendationComposer}
          onSubmitRecommendation={handleSubmitRecommendation}
          onCancelRecommendation={resetRecommendationComposer}
          recommendationReason={recommendationReason}
          setRecommendationReason={handleRecommendationReasonChange}
          showRecommendationComposer={isRecommendationComposerOpen}
          isAdding={isAdding}
          isSubmittingRecommendation={isSubmittingRecommendation}
          suggestionError={suggestionError}
          canRecommend={true}
        />
      </div>
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
            renameMovie,
            addMemory,
            updateMemory,
            deleteMemory: deleteMemoryRecord,
            togglePin: toggleMemoryPin,
          }}
          mediaTypeFilter={mediaTypeFilter}
          onMediaTypeFilterChange={setMediaTypeFilter}
          totalMoviesCount={movies.filter((m) => !isTvSeries(m)).length}
          totalSeriesCount={movies.filter((m) => isTvSeries(m)).length}
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
    </>
  );
};
export default memo(MoviesView);
