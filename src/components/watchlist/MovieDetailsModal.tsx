import React from 'react';
import { createPortal } from 'react-dom';
import { colors } from '@/theme/tokens';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useModalBase } from '@/ui/modals';
import type { Movie } from '@/shared/types';
import type { MovieTransitionOrigin } from './MovieCard';

interface MovieDetailsModalProps {
  movie: Movie;
  isOpen: boolean;
  origin?: MovieTransitionOrigin | null;
  onClose: () => void;
}

const clampOrigin = (origin: MovieTransitionOrigin | null) => {
  if (!origin) {
    return {
      top: '50dvh',
      left: '50vw',
      width: '18rem',
      height: '27rem',
    };
  }

  return {
    top: `${origin.top}px`,
    left: `${origin.left}px`,
    width: `${origin.width}px`,
    height: `${origin.height}px`,
  };
};

const getDialogMetrics = (isMobile: boolean) => {
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 800 : window.innerHeight;
  const targetWidth = Math.min(viewportWidth - 32, isMobile ? 544 : 1216);
  const targetHeight = Math.min(viewportHeight - 32, isMobile ? 768 : 672);
  return { targetWidth, targetHeight };
};

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isOpen,
  origin,
  onClose,
}) => {
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const [hasPosterError, setHasPosterError] = React.useState(false);
  const [hasCatError, setHasCatError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(false);
  const closeTimeoutRef = React.useRef<number | null>(null);
  const { dialogRef, closeButtonRef, playPop } = useModalBase(isVisible, onClose);

  React.useEffect(() => {
    setHasPosterError(false);
    setHasCatError(false);
  }, [movie.posterUrl]);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsEntering(false);
      const frame = window.requestAnimationFrame(() => {
        setIsEntering(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!isVisible) {
      return undefined;
    }

    setIsEntering(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 260);

    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen, isVisible]);

  React.useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const handleResize = () => {
      setIsEntering((current) => current);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasPosterError;
  const catUrl = `https://cataas.com/cat/says/${encodeURIComponent(movie.title || 'No Poster')}?fontSize=18&width=400&height=600`;
  const metadataItems = [
    { label: 'Year', value: movie.year },
    { label: 'Runtime', value: movie.runtime },
    { label: 'Rating', value: movie.imdbRating ? `${movie.imdbRating} IMDb` : null },
    { label: 'Genre', value: movie.genre },
    { label: 'Director', value: movie.director },
    { label: 'Category', value: movie.category },
  ].filter((item) => Boolean(item.value));
  const source = clampOrigin(origin ?? null);
  const { targetWidth, targetHeight } = getDialogMetrics(isMobile);
  const scaleX =
    origin && targetWidth > 0 ? Math.min(Math.max(origin.width / targetWidth, 0.18), 1) : 0.32;
  const scaleY =
    origin && targetHeight > 0 ? Math.min(Math.max(origin.height / targetHeight, 0.18), 1) : 0.32;

  return createPortal(
    <div
      className={`movie-details-modal${isEntering ? ' is-open' : ''}`}
      style={
        {
          '--movie-origin-top': source.top,
          '--movie-origin-left': source.left,
          '--movie-origin-width': source.width,
          '--movie-origin-height': source.height,
          '--movie-origin-scale-x': String(scaleX),
          '--movie-origin-scale-y': String(scaleY),
        } as React.CSSProperties
      }
      role="dialog"
      aria-modal="true"
      aria-label={`${movie.title} details`}
    >
      <button
        type="button"
        className="movie-details-modal__backdrop"
        onClick={onClose}
        aria-label={`Close details for ${movie.title}`}
      />

      <div
        ref={dialogRef}
        className={`movie-details-modal__dialog${isMobile ? ' movie-details-modal__dialog--mobile' : ''}`}
      >
        <div className="movie-details-modal__surface">
          <button
            ref={closeButtonRef}
            type="button"
            className="movie-details-modal__close"
            onClick={() => {
              playPop();
              onClose();
            }}
            aria-label="Close movie details"
          >
            ×
          </button>

          <div className="movie-details-modal__poster-shell">
            {shouldShowPoster ? (
              <img
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                className="movie-details-modal__poster"
                onError={() => setHasPosterError(true)}
              />
            ) : !hasCatError ? (
              <img
                src={catUrl}
                alt={`A cat representing ${movie.title}`}
                className="movie-details-modal__poster"
                onError={() => setHasCatError(true)}
              />
            ) : (
              <div className="movie-details-modal__poster movie-details-modal__poster--fallback">
                No Poster Available
              </div>
            )}
          </div>

          <div className="movie-details-modal__content">
            <div className="movie-details-modal__header">
              <p className="movie-details-modal__eyebrow">Movie details</p>
              <h2 className="movie-details-modal__title">{movie.title}</h2>
            </div>

            <div className="movie-details-modal__meta-grid">
              {metadataItems.map((item) => (
                <div key={item.label} className="movie-details-modal__meta-item">
                  <span className="movie-details-modal__meta-label">{item.label}</span>
                  <span className="movie-details-modal__meta-value">{item.value}</span>
                </div>
              ))}
            </div>

            {movie.plot ? (
              <div className="movie-details-modal__section">
                <p className="movie-details-modal__section-label">Plot</p>
                <p className="movie-details-modal__plot">{movie.plot}</p>
              </div>
            ) : null}

            <div className="movie-details-modal__footer">
              <span>
                Added by <strong>{movie.addedBy}</strong>
              </span>
              {movie.watchedBy.length > 0 ? (
                <span>
                  Watched by <strong>{movie.watchedBy.join(', ')}</strong>
                </span>
              ) : (
                <span style={{ color: colors.textTertiary }}>Not watched yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MovieDetailsModal;
