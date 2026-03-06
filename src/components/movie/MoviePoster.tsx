import React from 'react';
import { Movie } from '@/types';
import { FilmIcon } from '../common/icons';
import { spacing, radius } from '@/design-system/tokens';

interface MoviePosterProps {
  movie: Movie;
  className?: string;
}

const MoviePoster: React.FC<MoviePosterProps> = ({ movie, className = '' }) => {
  return (
    <div className={`movie-poster-wrap ${className}`}>
      {movie.posterUrl ? (
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="movie-poster"
        />
      ) : (
        <div className="movie-poster-fallback">
          <FilmIcon
            style={{
              width: '34px',
              height: '34px',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: spacing.sm,
            }}
          />
          <h3 className="movie-title movie-title--fallback">{movie.title}</h3>
        </div>
      )}
    </div>
  );
};

export default MoviePoster;
