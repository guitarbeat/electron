import React, { useState } from 'react';
import { useMovies } from '../hooks/useMovies';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';
import { FilmIcon } from './icons';
import { Movie, User } from '../types';
import WatcherBadge from './WatcherBadge';

const POSTER_WIDTH = 70;
const POSTER_HEIGHT = 105;

interface PosterCardProps {
  movie: Movie;
}

const PosterCard: React.FC<PosterCardProps> = ({ movie }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const watchedByOne = movie.watchedBy.length === 1;
  const watcher = watchedByOne ? (movie.watchedBy[0] as User) : null;

  return (
    <div
      role="listitem"
      title={movie.title}
      style={{
        position: 'relative',
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        flexShrink: 0,
        borderRadius: radius.sm,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isHovered ? shadows.cardHover : shadows.card,
        border: `2px solid ${colors.borderInset}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
    >
      {/* Poster Image or Fallback */}
      {movie.posterUrl && !imgError ? (
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: colors.gradientPurple,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FilmIcon style={{ width: 24, height: 24, color: colors.textSecondary, opacity: 0.7 }} />
        </div>
      )}

      {/* Watched-by Badge */}
      {watcher && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
          }}
        >
          <WatcherBadge user={watcher} size="sm" />
        </div>
      )}

      {/* Title Overlay on Hover */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          padding: `${spacing.lg} ${spacing.xs} ${spacing.xs}`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            color: colors.textPrimary,
            fontWeight: 'bold',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.2,
          }}
        >
          {movie.title}
        </span>
        {movie.year && (
          <span style={{ fontSize: '8px', color: colors.textTertiary, display: 'block' }}>
            {movie.year}
          </span>
        )}
      </div>
    </div>
  );
};

const WatchlistPreview: React.FC = () => {
  const { movies, isLoading } = useMovies('Aaron'); // Read-only proxy access

  if (isLoading) {
    return (
      <div style={{ marginTop: spacing.md }}>
        <div style={{ display: 'flex', gap: spacing.sm, overflowX: 'hidden' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                width: POSTER_WIDTH,
                height: POSTER_HEIGHT,
                borderRadius: radius.sm,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const unwatchedMovies = movies?.filter((m) => m.watchedBy.length < 2) || [];

  if (unwatchedMovies.length === 0) {
    return (
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          textAlign: 'center',
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          border: `1px dashed ${colors.borderSecondary}60`,
        }}
      >
        <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
          The watchlist is empty! Be the first to suggest a movie 🎬
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: spacing.lg, textAlign: 'left' }}>
      {/* Header */}
      <h4
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <FilmIcon style={{ width: 14, height: 14 }} />
        Current Watchlist ({unwatchedMovies.length})
      </h4>

      {/* Horizontal Poster Strip */}
      <div
        role="list"
        aria-label="Movies on watchlist"
        style={{
          display: 'flex',
          gap: spacing.sm,
          overflowX: 'auto',
          paddingBottom: spacing.xs,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.accent}40 transparent`,
        }}
      >
        {unwatchedMovies.map((movie) => (
          <div key={movie.id} style={{ scrollSnapAlign: 'start' }}>
            <PosterCard movie={movie} />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: spacing.xs,
          display: 'flex',
          gap: spacing.md,
          fontSize: '10px',
          color: colors.textTertiary,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: radius.full,
              backgroundColor: colors.accent,
              display: 'inline-block',
            }}
          />
          Aaron watched
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: radius.full,
              backgroundColor: colors.secondary,
              display: 'inline-block',
            }}
          />
          Electra watched
        </span>
      </div>
    </div>
  );
};

export default WatchlistPreview;
