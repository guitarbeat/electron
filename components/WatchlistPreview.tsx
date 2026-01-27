import React from 'react';
import { useMovies } from '../hooks/useMovies';
import Card from './ui/Card';
import { spacing, typography, colors, radius } from '../design-system/tokens';
import { FilmIcon, CheckIcon } from './icons';

const WatchlistPreview: React.FC = () => {
  // Pass null or a dummy user to useMovies if it needs one, 
  // but we want to fetch the global list. 
  // Assuming useMovies(null) or similar works for read-only global access if implemented.
  // Given the previous turns, useMovies likely needs a user context.
  // For a visitor, we just want to show the current list.
  const { movies, isLoading } = useMovies('Aaron'); // Use Aaron as a proxy to see the shared list

  if (isLoading) {
    return (
      <div style={{ marginTop: spacing.md }}>
        {[1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: '40px', borderRadius: radius.sm, marginBottom: spacing.xs }} />
        ))}
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return null;
  }

  const unwatchedMovies = movies.filter(m => m.watchedBy.length < 2);

  return (
    <div style={{ marginTop: spacing.lg, textAlign: 'left' }}>
      <h4 style={{ 
        fontSize: typography.fontSize.sm, 
        color: colors.textSecondary, 
        marginBottom: spacing.sm,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs
      }}>
        <FilmIcon style={{ width: '14px', height: '14px' }} />
        Current Watchlist ({unwatchedMovies.length})
      </h4>
      <div style={{ 
        maxHeight: '150px', 
        overflowY: 'auto', 
        paddingRight: spacing.xs,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs
      }}>
        {unwatchedMovies.map((movie) => (
          <div 
            key={movie.id}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.sm,
              fontSize: typography.fontSize.xs,
              color: colors.textPrimary,
              border: `1px solid ${colors.borderInset}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {movie.title}
            </span>
            {movie.watchedBy.length === 1 && (
              <span style={{ color: colors.accent, fontSize: '10px', fontWeight: 'bold' }}>
                1/2 Watched
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistPreview;
