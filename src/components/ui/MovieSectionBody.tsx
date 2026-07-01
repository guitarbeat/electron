import React from "react";
import type {
  Movie,
  MovieSuggestion,
  SharedMemory,
  User,
} from "@/shared/types";
import { MovieCardSkeleton } from "@/ui/Skeleton";
import { CollectionEmptyState, CollectionGrid } from "@/ui/CollectionLayout";
import Button from "@/ui/Button";
import { spacing } from "@/theme/tokens";
import SuggestionCard from "@/components/movies/SuggestionCard";
import MovieCard from "@/components/movies/MovieCard";
import MovieDeckStack from "@/components/movies/MovieDeckStack";
import type { MovieSections } from "@/components/movies/lib/movieSections";

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
}

const SK_MOBILE = ["m1", "m2", "m3", "m4"];
const SK_DESKTOP = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"];

const GRID = "clamp(10.5rem, 24vw, 13rem)";

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
}) => {
  const sk = isMobile ? SK_MOBILE : SK_DESKTOP;
  const isEmpty = (arr: unknown[]) => arr.length === 0;

  const showInitialLoading =
    isLoading &&
    isSuggestionsLoading &&
    isEmpty(sections.queue) &&
    isEmpty(sections.suggestions) &&
    isEmpty(sections.completed);

  const movieGrid = (movies: Movie[], emptyLabel: string) => (
    <CollectionGrid className="watchlist-content" minColumnWidth={GRID}>
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
    </CollectionGrid>
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (showInitialLoading) {
    return (
      <CollectionGrid className="watchlist-content" minColumnWidth={GRID}>
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
      </CollectionGrid>
    );
  }

  const isQueueEmpty =
    isEmpty(sections.queue) &&
    isEmpty(sections.suggestions) &&
    !isSuggestionsLoading;

  // ── All-empty CTA ─────────────────────────────────────────────────────────
  if (isQueueEmpty && isEmpty(sections.completed)) {
    return (
      <CollectionGrid className="watchlist-content" minColumnWidth={GRID}>
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
      </CollectionGrid>
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
          {isSuggestionsLoading && isEmpty(sections.suggestions) ? (
            <CollectionGrid className="watchlist-content" minColumnWidth={GRID}>
              {sk.slice(0, 4).map((key) => (
                <MovieCardSkeleton key={key} />
              ))}
            </CollectionGrid>
          ) : (
            <CollectionGrid className="watchlist-content" minColumnWidth={GRID}>
              {sections.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAccept={() => void onAcceptSuggestion(suggestion)}
                  onReject={() => void onRejectSuggestion(suggestion)}
                  canRespond={Boolean(currentUser)}
                  disableActions={!currentUser}
                  isProcessing={processingSuggestionId === suggestion.id}
                />
              ))}
            </CollectionGrid>
          )}
        </CollectionSection>
      )}

      {sections.queue.length > 0 && (
        <CollectionSection heading="Up Next" id={sectionIds?.queue}>
          <MovieDeckStack movies={sections.queue} />
          {movieGrid(sections.queue, "Your movie list is wide open")}
        </CollectionSection>
      )}

      {sections.completed.length > 0 && (
        <CollectionSection
          heading="Watched"
          tone="completed"
          id={sectionIds?.completed}
        >
          {movieGrid(sections.completed, "No watched movies yet")}
        </CollectionSection>
      )}
    </div>
  );
};

export default MovieSectionBody;
