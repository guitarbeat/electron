import React from 'react';
import { Movie } from '@/types';
import { spacing, typography, colors, radius, shadows } from '@/design-system/tokens';

interface MovieDetailsProps {
  movie: Movie;
  className?: string;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, className = '' }) => {
  const metadataItems = [
    movie.year,
    movie.runtime,
    movie.imdbRating ? `${movie.imdbRating} IMDb` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`movie-details ${className}`}>
      {(movie.year || movie.runtime || movie.imdbRating || movie.category) && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          {movie.year && (
            <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              {movie.year}
            </span>
          )}
          {movie.runtime && (
            <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              {movie.runtime}
            </span>
          )}
          {movie.imdbRating && (
            <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              {movie.imdbRating} IMDb
            </span>
          )}
          {movie.category && (
            <span
              style={{
                color: colors.accentLight,
                backgroundColor: `${colors.accent}15`,
                padding: '2px 8px',
                borderRadius: radius.full,
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                border: `1px solid ${colors.accent}30`,
              }}
            >
              {movie.category}
            </span>
          )}
        </div>
      )}

      {movie.plot && (
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {movie.plot}
        </p>
      )}
    </div>
  );
};

export default MovieDetails;
