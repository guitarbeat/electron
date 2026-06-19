import React, { memo } from "react";
import type {
  Movie,
  MovieSuggestion,
  SharedMemory,
  User,
} from "@/shared/types";
import { CollectionSection } from "@/ui/CollectionLayout";
import SuggestionStack from "@/components/movies/SuggestionStack";
import MovieCard from "@/components/movies/MovieCard";
import MovieDeckStack from "@/components/movies/MovieDeckStack";
import type { MovieSections } from "@/components/movies/lib/movieSections";
import { getAllMovies } from "@/components/movies/lib/movieSections";
import type { MovieBrowseLayout } from "@/components/movies/lib/movieBrowseLayout";
import { shouldUseMovieScrollDeck } from "@/components/movies/lib/movieBrowseLayout";
import { WorkspaceCollectionGlobalEmpty } from "@/components/ui/WorkspaceEmptyState";
import WorkspaceCollectionLoading from "@/components/ui/WorkspaceCollectionLoading";
import WorkspaceCollectionGrid from "@/ui/WorkspaceCollectionGrid";
import WorkspaceIncomingSection from "@/components/ui/WorkspaceIncomingSection";
import WorkspaceIncomingSkeleton from "@/ui/WorkspaceIncomingSkeleton";
import { useViewport } from "@/app/ViewportContext";
import {
  MOVIES_POSTER_GRID_MIN_COL,
  workspaceSectionIds,
  workspaceSectionLabels,
} from "@/utils/workspaceConfig";

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
  emptyActionBusy?: boolean;
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  browseLayout?: MovieBrowseLayout;
}

const gridSurfaceClass = (browseLayout: MovieBrowseLayout) =>
  `workspace-content${browseLayout === "grid" ? " workspace-content--poster-grid" : ""}`;

interface MovieGridCardProps {
  movie: Movie;
  index: number;
  currentUser: User | null;
  isMobile: boolean;
  successMovieId: string | null;
  memories: SharedMemory[];
  actions: MovieBodyActions;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
}

const MovieGridCard = memo(function MovieGridCard({
  movie,
  index,
  currentUser,
  isMobile,
  successMovieId,
  memories,
  actions,
  onDeleteRequest,
  onToggleError,
}: MovieGridCardProps) {
  return (
    <MovieCard
      movie={movie}
      currentUser={currentUser}
      isCompact={isMobile}
      priorityPoster={index < 6}
      onToggle={() => {
        actions.toggleWatched(movie.id);
      }}
      onToggleError={onToggleError}
      onRename={async (title) => {
        await actions.renameMovie(movie.id, title);
      }}
      onDelete={() => onDeleteRequest(movie)}
      isHighlighted={successMovieId === movie.id}
      memories={memories}
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
  );
});

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
  emptyActionBusy,
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
    browseLayout === "grid" ? " workspace-content--poster-grid" : "";

  const allMovies = getAllMovies(sections);

  const showInitialLoading =
    (isLoading || isSuggestionsLoading) &&
    allMovies.length === 0 &&
    sections.suggestions.length === 0;

  const movieGrid = (movies: Movie[]) => (
    <WorkspaceCollectionGrid
      className={gridSurfaceClass(browseLayout)}
      minColumnWidth={MOVIES_POSTER_GRID_MIN_COL}
      items={movies}
      getItemKey={(movie) => movie.id}
      renderItem={(movie, index) => (
        <MovieGridCard
          movie={movie}
          index={index}
          currentUser={currentUser}
          isMobile={isMobile}
          successMovieId={successMovieId}
          memories={movieMemories.get(movie.id) ?? []}
          actions={actions}
          onDeleteRequest={onDeleteRequest}
          onToggleError={onToggleError}
        />
      )}
      empty={null}
    />
  );

  const renderMovies = (movies: Movie[]) => {
    if (shouldUseMovieScrollDeck(movies.length, browseLayout, isMobile)) {
      return <MovieDeckStack movies={movies} />;
    }

    return movieGrid(movies);
  };

  if (showInitialLoading) {
    return (
      <WorkspaceCollectionLoading
        tab="movies"
        browseLayoutClass={browseLayoutClass}
      />
    );
  }

  const isListEmpty =
    allMovies.length === 0 &&
    sections.suggestions.length === 0 &&
    !isSuggestionsLoading;

  if (isListEmpty) {
    return (
      <WorkspaceCollectionGlobalEmpty
        tab="movies"
        className={gridSurfaceClass(browseLayout)}
        minColumnWidth={MOVIES_POSTER_GRID_MIN_COL}
        onAction={onAddMovieFocus}
        actionLabel={
          emptyActionLabel ??
          (currentUser ? "Add a movie" : "Suggest a movie")
        }
        actionBusy={emptyActionBusy}
      />
    );
  }

  return (
    <div className="workspace-section-body">
      <WorkspaceIncomingSection
        heading={sectionLabels.incoming}
        sectionId={sectionIds.incoming}
        isLoading={isSuggestionsLoading}
        itemCount={sections.suggestions.length}
        showCount={
          !isSuggestionsLoading && sections.suggestions.length > 1
        }
        skeleton={<WorkspaceIncomingSkeleton variant="stack" />}
      >
        <SuggestionStack
          suggestions={sections.suggestions}
          currentUser={currentUser}
          processingSuggestionId={processingSuggestionId}
          onAccept={onAcceptSuggestion}
          onReject={onRejectSuggestion}
        />
      </WorkspaceIncomingSection>

      {allMovies.length > 0 && (
        <CollectionSection
          heading={sectionLabels.queue}
          showHeading={false}
          id={sectionIds.queue}
        >
          {renderMovies(allMovies)}
        </CollectionSection>
      )}
    </div>
  );
};

export default MovieSectionBody;
