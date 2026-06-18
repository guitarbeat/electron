import React from "react";
import type {
  Movie,
  MovieSuggestion,
  SharedMemory,
  User,
} from "@/shared/types";
import { CollectionSection } from "@/ui/CollectionLayout";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import SuggestionStack, {
  SuggestionStackSkeleton,
} from "@/components/movies/SuggestionStack";
import MovieCard from "@/components/movies/MovieCard";
import MovieDeckStack from "@/components/movies/MovieDeckStack";
import type { MovieSections } from "@/components/movies/lib/movieSections";
import type { MovieBrowseLayout } from "@/components/movies/lib/movieBrowseLayout";
import WorkspaceCollectionLoading from "@/components/ui/WorkspaceCollectionLoading";
import {
  WorkspaceGlobalEmpty,
  WorkspaceSectionEmpty,
} from "@/components/ui/WorkspaceEmptyState";
import { useViewport } from "@/app/ViewportContext";
import {
  MOVIES_POSTER_GRID_MIN_COL,
  workspaceSectionIds,
} from "@/utils/workspaceConfig";
import { workspaceSectionLabels } from "@/utils/workspaceSectionLabels";

export interface MovieBodyActions {
  toggleWatched: (id: string) => void | unknown;
  renameMovie: (id: string, title: string) => void | unknown;
  addMemory: (
    movieId: string | undefined,
    movieTitle: string,
    author: string,
    note: string,
  ) => Promise<unknown>;
  updateMemory: (
    memoryId: string,
    updates: { note?: string; movieId?: string; movieTitle?: string },
  ) => Promise<unknown>;
  deleteMemory: (memoryId: string) => Promise<void>;
  togglePin: (memoryId: string) => Promise<unknown>;
}

interface Props {
  sections: MovieSections;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  currentUser: User | null;
  processingSuggestionId: string | null;
  successMovieId: string | null;
  movieMemories: Map<string, SharedMemory[]>;
  onAddMovieFocus: () => void;
  emptyActionLabel?: string;
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  browseLayout?: MovieBrowseLayout;
}

const gridSurfaceClass = (browseLayout: MovieBrowseLayout) =>
  `watchlist-content${browseLayout === "grid" ? " watchlist-content--poster-grid" : ""}`;

const MovieSectionBody: React.FC<Props> = ({
  sections,
  isLoading,
  isSuggestionsLoading,
  currentUser,
  processingSuggestionId,
  successMovieId,
  movieMemories,
  onAddMovieFocus,
  emptyActionLabel,
  onAcceptSuggestion,
  onRejectSuggestion,
  onDeleteRequest,
  onToggleError,
  actions,
  browseLayout = "grid",
}) => {
  const { isMobile } = useViewport();
  const sectionLabels = workspaceSectionLabels("movies", isMobile);
  const sectionIds = workspaceSectionIds("movies");
  const browseLayoutClass =
    browseLayout === "grid" ? " watchlist-content--poster-grid" : "";

  const showInitialLoading =
    isLoading &&
    isSuggestionsLoading &&
    sections.queue.length === 0 &&
    sections.suggestions.length === 0 &&
    sections.completed.length === 0;

  const movieGrid = (movies: Movie[], emptyVariant: "queue" | "completed") => (
    <ChromaCollectionGrid
      className={gridSurfaceClass(browseLayout)}
      minColumnWidth={MOVIES_POSTER_GRID_MIN_COL}
    >
      {movies.length > 0 ? (
        movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            currentUser={currentUser}
            onToggle={() => {
              actions.toggleWatched(movie.id);
            }}
            onToggleError={onToggleError}
            onRename={async (title) => {
              await actions.renameMovie(movie.id, title);
            }}
            onDelete={() => onDeleteRequest(movie)}
            isHighlighted={successMovieId === movie.id}
            memories={movieMemories.get(movie.id) ?? []}
            onAddMemory={
              currentUser
                ? async (note) => {
                    await actions.addMemory(
                      movie.id,
                      movie.title,
                      currentUser,
                      note,
                    );
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
        ))
      ) : (
        <WorkspaceSectionEmpty tab="movies" variant={emptyVariant} />
      )}
    </ChromaCollectionGrid>
  );

  const renderMovies = (
    movies: Movie[],
    emptyVariant: "queue" | "completed",
  ) => {
    if (browseLayout === "scroll" && movies.length >= 2) {
      return <MovieDeckStack movies={movies} />;
    }

    return movieGrid(movies, emptyVariant);
  };

  if (showInitialLoading) {
    return (
      <WorkspaceCollectionLoading
        tab="movies"
        browseLayoutClass={browseLayoutClass}
      />
    );
  }

  const isQueueEmpty =
    sections.queue.length === 0 &&
    sections.suggestions.length === 0 &&
    !isSuggestionsLoading;

  if (isQueueEmpty && sections.completed.length === 0) {
    return (
      <ChromaCollectionGrid
        className={gridSurfaceClass(browseLayout)}
        minColumnWidth={MOVIES_POSTER_GRID_MIN_COL}
      >
        <WorkspaceGlobalEmpty
          tab="movies"
          onAction={onAddMovieFocus}
          actionLabel={
            emptyActionLabel ??
            (currentUser ? "Add a movie" : "Suggest a movie")
          }
        />
      </ChromaCollectionGrid>
    );
  }

  return (
    <div className="workspace-section-body">
      {(isSuggestionsLoading || sections.suggestions.length > 0) && (
        <CollectionSection
          heading={sectionLabels.incoming}
          count={
            isSuggestionsLoading && sections.suggestions.length === 0
              ? undefined
              : sections.suggestions.length
          }
          tone="incoming"
          id={sectionIds.incoming}
        >
          {isSuggestionsLoading && sections.suggestions.length === 0 ? (
            <SuggestionStackSkeleton />
          ) : (
            <SuggestionStack
              suggestions={sections.suggestions}
              currentUser={currentUser}
              processingSuggestionId={processingSuggestionId}
              onAccept={onAcceptSuggestion}
              onReject={onRejectSuggestion}
            />
          )}
        </CollectionSection>
      )}

      {sections.queue.length > 0 && (
        <CollectionSection
          heading={sectionLabels.queue}
          count={sections.queue.length}
          id={sectionIds.queue}
        >
          {renderMovies(sections.queue, "queue")}
        </CollectionSection>
      )}

      {sections.completed.length > 0 && (
        <CollectionSection
          heading={sectionLabels.completed}
          count={sections.completed.length}
          tone="completed"
          id={sectionIds.completed}
        >
          {renderMovies(sections.completed, "completed")}
        </CollectionSection>
      )}
    </div>
  );
};

export default MovieSectionBody;
