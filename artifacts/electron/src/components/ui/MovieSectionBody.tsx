import React from 'react';
import type { Movie, MovieSuggestion, SharedMemory, User } from '@/shared/types';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import {
  CollectionEmptyState,
  CollectionGrid,
  CollectionSection,
} from '@/ui/CollectionLayout';
import Button from '@/ui/Button';
import { spacing } from '@/theme/tokens';
import SuggestionCard from '@/components/movies/SuggestionCard';
import MovieCard from '@/components/movies/MovieCard';
import type { MovieSections } from '@/components/movies/lib/movieSections';

export interface MovieBodyActions {
  toggleWatched: (id: string) => void | unknown;
  renameMovie: (id: string, title: string) => void | unknown;
  addMemory: (movieId: string | undefined, movieTitle: string, author: string, note: string) => Promise<unknown>;
  updateMemory: (memoryId: string, updates: { note?: string; movieId?: string; movieTitle?: string }) => Promise<unknown>;
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
}

const SK_MOBILE = ['m1', 'm2', 'm3', 'm4'];
const SK_DESKTOP = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];

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
}) => {
  const sk = isMobile ? SK_MOBILE : SK_DESKTOP;
  const isEmpty = (arr: unknown[]) => arr.length === 0;

  const GRID = isMobile
    ? 'clamp(8.5rem, 42vw, 12rem)'
    : 'clamp(6.5rem, 10vw, 9rem)';
  const GRID_GAP = isMobile
    ? 'clamp(0.45rem, 1.5vw, 0.65rem)'
    : 'clamp(0.3rem, 0.6vw, 0.5rem)';

  const showInitialLoading =
    isLoading && isSuggestionsLoading &&
    isEmpty(sections.queue) && isEmpty(sections.suggestions) && isEmpty(sections.completed);

  const movieGrid = (movies: Movie[], emptyLabel: string) => (
    <div
      className="watchlist-content"
      style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${GRID}, 1fr))`, gap: GRID_GAP }}
    >
      {movies.length > 0 ? (
        movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            currentUser={currentUser}
            onToggle={() => { actions.toggleWatched(movie.id); }}
            onToggleError={onToggleError}
            onRename={async (title) => { await actions.renameMovie(movie.id, title); }}
            onDelete={() => onDeleteRequest(movie)}
            isHighlighted={successMovieId === movie.id}
            memories={movieMemories.get(movie.id) ?? []}
            onAddMemory={
              currentUser
                ? async (note) => { await actions.addMemory(movie.id, movie.title, currentUser, note); }
                : undefined
            }
            onUpdateMemory={async (memoryId, note) => { await actions.updateMemory(memoryId, { note }); }}
            onDeleteMemory={async (memoryId) => { await actions.deleteMemory(memoryId); }}
            onTogglePin={async (memoryId) => { await actions.togglePin(memoryId); }}
          />
        ))
      ) : (
        <CollectionEmptyState
          padding={isMobile ? spacing.md : spacing['2xl']}
          className={`watchlist-empty-watched-state${isMobile ? ' collection-empty-state--tight' : ''}`}
        >
          <span className="watchlist-empty-watched-state__icon" aria-hidden="true">✓</span>
          <span className="watchlist-empty-watched-state__text">{emptyLabel}</span>
        </CollectionEmptyState>
      )}
    </div>
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (showInitialLoading) {
    return (
      <CollectionGrid className="watchlist-content" minColumnWidth={GRID} gap={GRID_GAP}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <CollectionEmptyState padding={spacing.xl} className="collection-empty-state--tight">
            <span style={{ fontSize: '1.75rem', lineHeight: 1, opacity: 0.7 }} aria-hidden="true">🍿</span>
            <strong>Loading your movies</strong>
          </CollectionEmptyState>
          <div style={{ display: 'grid', gridTemplateColumns: 'inherit', gap: 'inherit' }}>
            {sk.map((key) => <MovieCardSkeleton key={key} />)}
          </div>
        </div>
      </CollectionGrid>
    );
  }

  const isQueueEmpty = isEmpty(sections.queue) && isEmpty(sections.suggestions) && !isSuggestionsLoading;

  // ── Full section body ─────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? spacing.md : spacing.lg }}>
      {(isSuggestionsLoading || sections.suggestions.length > 0) && (
        isSuggestionsLoading && isEmpty(sections.suggestions) ? (
          <CollectionGrid className="watchlist-content" minColumnWidth={GRID} gap={GRID_GAP}>
            {sk.slice(0, 4).map((key) => <MovieCardSkeleton key={key} />)}
          </CollectionGrid>
        ) : (
          <CollectionGrid className="watchlist-content" minColumnWidth={GRID} gap={GRID_GAP}>
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
        )
      )}

      {sections.queue.length > 0 && movieGrid(sections.queue, 'Your movie list is wide open')}

      {sections.completed.length > 0 && movieGrid(sections.completed, 'No watched movies yet')}
    </div>
  );
};

export default MovieSectionBody;
