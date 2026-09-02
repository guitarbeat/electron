



import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Movie,
} from "@/shared/types";


import {
  SyncBanner,
  ConfirmDialog,
  type SortOrder,
} from "@/components/ui";
import { useViewport, useUser, useBentoSlot } from "@/app/providerContexts";






import { useMoviesWorkspace } from "@/hooks/movies";

import {
MovieSortOrder,
buildMovieSections,
MOVIE_SORTS,
  MoviesWorkspaceViewProps,
} from "./shared";

import { MovieSectionBody } from "./MovieSectionBody";

export const MoviesView: React.FC<MoviesWorkspaceViewProps> = ({
  isPaused = false,
  hideSearch: _hideSearch = false,
  posterPlaceCards = [],
  
}) => {
  const { currentUser, activeUsers } = useUser();
  const { registerTabConfig } = useBentoSlot();
  const { isMobile } = useViewport();
  const setConfig = React.useCallback(
    (config: Parameters<typeof registerTabConfig>[1]) =>
      registerTabConfig("movies", config),
    [registerTabConfig],
  );
  const [sortOrder, setSortOrder] = useState<MovieSortOrder>("recent");
  const focusSearchInput = useCallback(() => {
    document
      .querySelector<HTMLInputElement>(".curved-library-search input")
      ?.focus();
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
    isMoviesWorkspaceDegraded,
    isMoviesWorkspaceSyncBlocked,
    moviesWorkspaceSyncWarning,
    retryMoviesWorkspaceSync,
    toggleWatched,
    editMovie,
  } = useMoviesWorkspace({ currentUser, isPaused, focusSearchInput });

  const sections = useMemo(
    () => buildMovieSections(movies, pendingSuggestions, sortOrder),
    [movies, pendingSuggestions, sortOrder],
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
  }, [setConfig, sortOrder, handleMovieSortChange]);

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
          activeUsers={activeUsers}
          isMobile={isMobile}
          processingSuggestionId={processingSuggestionId}
          successMovieId={successMovieId}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onDeleteRequest={setMovieToDelete}
          onToggleError={(message) => setToast({ message, type: "error" })}
          actions={{
            toggleWatched,
            editMovie,
          }}
          posterPlaceCards={posterPlaceCards}
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

