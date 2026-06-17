import React from "react";
import type {
  Movie,
  MovieSuggestion,
  SharedMemory,
  User,
} from "@/shared/types";
import { MovieCardSkeleton } from "@/ui/Skeleton";
import { CollectionEmptyState, CollectionSection } from "@/ui/CollectionLayout";
import ChromaCollectionGrid from "@/components/effects/ChromaCollectionGrid";
import Button from "@/ui/Button";
import { spacing } from "@/theme/tokens";
import SuggestionStack, {
  SuggestionStackSkeleton,
} from "@/components/movies/SuggestionStack";
import MovieCard from "@/components/movies/MovieCard";
import MovieDeckStack from "@/components/movies/MovieDeckStack";
import type { MovieSections } from "@/components/movies/lib/movieSections";
import type { MovieBrowseLayout } from "@/components/movies/lib/movieBrowseLayout";

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

export interface MovieSectionIds {
  incoming?: string;
  queue?: string;
  completed?: string;
}

interface Props {
  sections: MovieSections;
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  currentUser: User | null;
  isMobile: boolean;
  processingSuggestionId: string | null;
  successMovieId: string | null;
  movieMemories: Map<string, SharedMemory[]>;
  onAddMovieFocus: () => void;
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  sectionIds?: MovieSectionIds;
  browseLayout?: MovieBrowseLayout;
}

const SK_MOBILE = ["m1", "m2", "m3", "m4"];
const SK_DESKTOP = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];

const GRID = "clamp(3.25rem, 18vw, 5.5rem)";

const gridSurfaceClass = (browseLayout: MovieBrowseLayout) =>
  `watchlist-content${browseLayout === "grid" ? " watchlist-content--poster-grid" : ""}`;

const MovieSectionBody: React.FC<Props> = ({
  sections,
  isLoading,
  isSuggestionsLoading,
  currentUser,
  isMobile,
  processingSuggestionId,
  successMovieId,
  movieMemories,
  onAddMovieFocus,
  onAcceptSuggestion,
  onRejectSuggestion,
  onDeleteRequest,
  onToggleError,
  actions,
  sectionIds,
  browseLayout = "grid",
}) => {
  const sk = isMobile ? SK_MOBILE : SK_DESKTOP;

  const showInitialLoading =
    isLoading &&
    isSuggestionsLoading &&
    sections.queue.length === 0 &&
    sections.suggestions.length === 0 &&
    sections.completed.length === 0;

  const movieGrid = (movies: Movie[], emptyLabel: string) => (
    <ChromaCollectionGrid
      className={gridSurfaceClass(browseLayout)}
      minColumnWidth={GRID}
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
        <CollectionEmptyState
          padding={isMobile ? spacing.md : spacing["2xl"]}
          className={`watchlist-empty-watched-state${isMobile ? " collection-empty-state--tight" : ""}`}
        >
          <span
            className="watchlist-empty-watched-state__icon"
            aria-hidden="true"
          >
            ✓
          </span>
          <span className="watchlist-empty-watched-state__text">
            {emptyLabel}
          </span>
        </CollectionEmptyState>
      )}
    </ChromaCollectionGrid>
  );

  const renderMovies = (movies: Movie[], emptyLabel: string) => {
    if (browseLayout === "scroll" && movies.length >= 2) {
      return <MovieDeckStack movies={movies} />;
    }

    return movieGrid(movies, emptyLabel);
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (showInitialLoading) {
    return (
      <ChromaCollectionGrid
        className={gridSurfaceClass(browseLayout)}
        minColumnWidth={GRID}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            flexDirection: "column",
            gap: spacing.xl,
          }}
        >
          <CollectionEmptyState
            padding={spacing.xl}
            className="collection-empty-state--tight"
          >
            <span
              style={{ fontSize: "1.75rem", lineHeight: 1, opacity: 0.7 }}
              aria-hidden="true"
            >
              🍿
            </span>
            <strong>Loading your movies</strong>
          </CollectionEmptyState>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "inherit",
              gap: "inherit",
            }}
          >
            {sk.map((key) => (
              <MovieCardSkeleton key={key} />
            ))}
          </div>
        </div>
      </ChromaCollectionGrid>
    );
  }

  const isQueueEmpty =
    sections.queue.length === 0 &&
    sections.suggestions.length === 0 &&
    !isSuggestionsLoading;

  // ── All-empty CTA ─────────────────────────────────────────────────────────
  if (isQueueEmpty && sections.completed.length === 0) {
    return (
      <ChromaCollectionGrid
        className={gridSurfaceClass(browseLayout)}
        minColumnWidth={GRID}
      >
        <CollectionEmptyState
          padding={isMobile ? spacing.lg : spacing["3xl"]}
          className={`watchlist-empty-queue-state${isMobile ? " collection-empty-state--tight" : ""}`}
        >
          <span
            className="watchlist-empty-queue-state__icon"
            aria-hidden="true"
          >
            🎬
          </span>
          <strong className="watchlist-empty-queue-state__title">
            Your movie list is wide open
          </strong>
          <span className="watchlist-empty-queue-state__copy">
            No movies lined up yet. Add something you both want to watch and
            kick off movie night.
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddMovieFocus}
            className="watchlist-empty-queue-state__action"
          >
            Add a movie
          </Button>
        </CollectionEmptyState>
      </ChromaCollectionGrid>
    );
  }

  // ── Full section body ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? spacing.xl : spacing["2xl"],
      }}
    >
      {(isSuggestionsLoading || sections.suggestions.length > 0) && (
        <CollectionSection
          heading="Incoming"
          tone="incoming"
          id={sectionIds?.incoming}
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
        <CollectionSection heading="Up Next" id={sectionIds?.queue}>
          {renderMovies(sections.queue, "Your movie list is wide open")}
        </CollectionSection>
      )}

      {sections.completed.length > 0 && (
        <CollectionSection
          heading="Watched"
          tone="completed"
          id={sectionIds?.completed}
        >
          {renderMovies(sections.completed, "No watched movies yet")}
        </CollectionSection>
      )}
    </div>
  );
};

export default MovieSectionBody;
