import React from 'react';
import { MovieCardSkeleton, SuggestionSkeleton } from '@/ui/Skeleton';
import MovieItem from '@/movie/MovieItem';
import { SuggestionItemCard } from '@/common/DashboardCards';
import { Movie, MovieSuggestion, SharedMemory } from '@/types';

interface WatchlistContentProps {
  isLoading: boolean;
  isMobile: boolean;
  filteredMovies: Movie[];
  filteredSuggestions: MovieSuggestion[];
  contentTab: string;
  renderMovieItem: (movie: Movie, index: number) => React.ReactNode;
  renderSuggestionItem: (suggestion: MovieSuggestion, index: number) => React.ReactNode;
}

const MOBILE_SKELETON_KEYS = ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4'];
const DESKTOP_SKELETON_KEYS = [
  'desktop-1', 'desktop-2', 'desktop-3', 'desktop-4',
  'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8',
];

const WatchlistContent: React.FC<WatchlistContentProps> = ({
  isLoading,
  isMobile,
  filteredMovies,
  filteredSuggestions,
  contentTab,
  renderMovieItem,
  renderSuggestionItem,
}) => {
  const skeletonKeys = isMobile ? MOBILE_SKELETON_KEYS : DESKTOP_SKELETON_KEYS;

  if (isLoading) {
    return (
      <div className="watchlist-content">
        {skeletonKeys.map((key) => (
          <MovieCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (contentTab === 'suggestions') {
    return (
      <div className="watchlist-content">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion, index) => renderSuggestionItem(suggestion, index))
        ) : (
          <div className="watchlist-empty-state">
            <p>No suggestions available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="watchlist-content">
      {filteredMovies.length > 0 ? (
        filteredMovies.map((movie, index) => renderMovieItem(movie, index))
      ) : (
        <div className="watchlist-empty-state">
          <p>No movies found</p>
        </div>
      )}
    </div>
  );
};

export default WatchlistContent;
