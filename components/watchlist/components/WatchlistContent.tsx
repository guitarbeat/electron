import React from 'react';
import MasonryGrid from '../../ui/MasonryGrid';
import MovieItem from '../../MovieItem';
import { SuggestionItemCard } from '../../DashboardCards';
import { FilmIcon } from '../../icons';
import { Movie, MovieSuggestion, SharedMemory, User } from '../../../types';
import { ContentTab } from '../types';
import { spacing, colors } from '../../../design-system/tokens';

interface WatchlistContentProps {
  viewMode: 'list' | 'grid';
  filteredMovies: Movie[];
  filteredSuggestions: MovieSuggestion[];
  isSuggestionsLoading: boolean;
  currentUser: User | null;
  onToggleWatched: (movie: Movie) => void;
  onDeleteMovie: (movie: Movie) => void;
  onFixMatch: (movie: Movie) => void;
  onMemoryClick: (movie: Movie) => void;
  movieMemorySummaries: Map<string, { count: number; latest?: SharedMemory }>;
  highlightMovieId: string | null;
  onAcceptSuggestion: (suggestion: MovieSuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  processingSuggestionId: string | null;
  contentTab: ContentTab;
  searchQuery: string;
  isSubmitting: boolean;
  movieResultsRef: React.RefObject<HTMLDivElement>;
}

export const WatchlistContent: React.FC<WatchlistContentProps> = ({
  viewMode,
  filteredMovies,
  filteredSuggestions,
  isSuggestionsLoading,
  currentUser,
  onToggleWatched,
  onDeleteMovie,
  onFixMatch,
  onMemoryClick,
  movieMemorySummaries,
  highlightMovieId,
  onAcceptSuggestion,
  onRejectSuggestion,
  processingSuggestionId,
  contentTab,
  searchQuery,
  isSubmitting,
  movieResultsRef,
}) => {
  const renderMovieItem = (movie: Movie, index?: number) => {
    const memorySummary = movieMemorySummaries.get(movie.id);
    return (
      <MovieItem
        key={movie.id}
        movie={movie}
        currentUser={currentUser}
        onToggle={onToggleWatched}
        onDelete={onDeleteMovie}
        onFixMatch={onFixMatch}
        animationDelay={index !== undefined ? `${index * 0.05}s` : '0s'}
        layout={viewMode}
        memories={memorySummary?.latest ? [memorySummary.latest] : []}
        isHighlighted={highlightMovieId === movie.id}
      />
    );
  };

  return (
    <div
      ref={movieResultsRef}
      style={{
        opacity: isSubmitting ? 0.5 : 1,
        pointerEvents: isSubmitting ? 'none' : 'auto',
        transition: 'opacity 0.2s ease',
      }}
    >
      {viewMode === 'grid' ? (
        <MasonryGrid>
          {filteredSuggestions.map((suggestion) => (
            <SuggestionItemCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={onAcceptSuggestion}
              onReject={(s) => onRejectSuggestion(s.id)}
              isProcessing={processingSuggestionId === suggestion.id}
            />
          ))}

          {filteredMovies.map((movie) => renderMovieItem(movie))}
        </MasonryGrid>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {(contentTab === 'all' || contentTab === 'suggestions') &&
            filteredSuggestions.map((suggestion) => (
              <SuggestionItemCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAcceptSuggestion}
                onReject={(s) => onRejectSuggestion(s.id)}
                isProcessing={processingSuggestionId === suggestion.id}
              />
            ))}

          {filteredMovies.map((movie, index) => renderMovieItem(movie, index))}
        </div>
      )}

      {filteredMovies.length === 0 && filteredSuggestions.length === 0 && !isSuggestionsLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing['3xl'],
            color: colors.textSecondary,
          }}
        >
          <FilmIcon
            style={{ width: '64px', height: '64px', opacity: 0.3, marginBottom: spacing.md }}
          />
          <p>
            {searchQuery
              ? 'No results match your search.'
              : contentTab === 'suggestions'
                ? 'No pending suggestions right now.'
                : 'No movies in this section yet.'}
          </p>
        </div>
      )}
    </div>
  );
};
