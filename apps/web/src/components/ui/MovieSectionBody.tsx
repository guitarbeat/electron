import React from 'react';
import type { Movie, MovieSuggestion, SharedMemory, User } from '@/shared/types';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import {
  CollectionEmptyState,
  CollectionGrid,
} from '@/ui/CollectionLayout';
import { spacing } from '@/theme/tokens';
import SuggestionCard from '@/components/movies/SuggestionCard';
import MovieCard from '@/components/movies/MovieCard';
import type { MovieSections } from "@/components/movies/lib/index";

import WorkspaceCollectionLoading from '@/components/ui/WorkspaceCollectionLoading';
import { getWorkspaceCollectionState } from '@/utils/workspace';

import MagicToggle from '@/components/ui/MagicToggle';
import type { MediaTypeFilter } from "@/components/movies/lib/index";

import {
  MOVIES_POSTER_GRID_GAP,
  MOVIES_POSTER_GRID_MIN_COL,
} from '@/utils/workspaceConfig';

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
  onAcceptSuggestion: (s: MovieSuggestion) => void;
  onRejectSuggestion: (s: MovieSuggestion) => void;
  onDeleteRequest: (movie: Movie) => void;
  onToggleError: (msg: string) => void;
  actions: MovieBodyActions;
  mediaTypeFilter?: MediaTypeFilter;
  onMediaTypeFilterChange?: (filter: MediaTypeFilter) => void;
  totalMoviesCount?: number;
  totalSeriesCount?: number;
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
  onAcceptSuggestion,
  onRejectSuggestion,
  onDeleteRequest,
  onToggleError,
  actions,
  mediaTypeFilter = 'all',
  onMediaTypeFilterChange,
  totalMoviesCount = 0,
  totalSeriesCount = 0,
}) => {
  const sk = isMobile ? SK_MOBILE : SK_DESKTOP;
  const isEmpty = (arr: unknown[]) => arr.length === 0;

  const GRID = MOVIES_POSTER_GRID_MIN_COL;
  const GRID_GAP = MOVIES_POSTER_GRID_GAP;

  const collectionState = getWorkspaceCollectionState({
    itemCount: sections.queue.length + sections.completed.length,
    suggestionCount: sections.suggestions.length,
    isLoadingItems: isLoading && isSuggestionsLoading,
    isLoadingSuggestions: false,
  });

  const movieGrid = (movies: Movie[], emptyLabel: string) => (
    <div
      className="watchlist-content watchlist-content--posters"
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

  if (collectionState === 'loading') {
    return <WorkspaceCollectionLoading tab="movies" minColumnWidth={GRID} />;
  }

  // ── Full section body ─────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? spacing.md : spacing.lg }}>
      {onMediaTypeFilterChange && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing.xs }}>
          <MagicToggle
            options={[
              { value: 'all', label: 'All Formats' },
              { value: 'movie', label: `Movies (${totalMoviesCount})` },
              { value: 'series', label: `TV Series (${totalSeriesCount})` },
            ]}
            activeValue={mediaTypeFilter}
            onChange={(v) => onMediaTypeFilterChange(v as MediaTypeFilter)}
            ariaLabel="Filter by media type"
          />
        </div>
      )}
      {(isSuggestionsLoading || sections.suggestions.length > 0) && (
        isSuggestionsLoading && isEmpty(sections.suggestions) ? (
          <CollectionGrid className="watchlist-content watchlist-content--posters" minColumnWidth={GRID} gap={GRID_GAP}>
            {sk.slice(0, 4).map((key) => <MovieCardSkeleton key={key} />)}
          </CollectionGrid>
        ) : (
          <CollectionGrid className="watchlist-content watchlist-content--posters" minColumnWidth={GRID} gap={GRID_GAP}>
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
