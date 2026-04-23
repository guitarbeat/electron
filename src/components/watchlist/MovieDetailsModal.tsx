import React from 'react';
import { createPortal } from 'react-dom';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { useModalBase } from '@/ui/modals';
import type { Movie, SharedMemory, User } from '@/shared/types';
import { formatMemoryTimestamp } from '@/utils';
import type { MovieTransitionOrigin } from './MovieCard';

interface MovieDetailsModalProps {
  movie: Movie;
  memories?: SharedMemory[];
  isOpen: boolean;
  origin?: MovieTransitionOrigin | null;
  onClose: () => void;
}

const ALL_USERS: User[] = ['Aaron', 'Electra'];

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

const getWatchStatus = (movie: Movie, memoryCount: number) => {
  if (movie.watchedBy.length === ALL_USERS.length) {
    return {
      label: 'Seen together',
      title: 'Already a shared watch',
      detail:
        memoryCount > 0
          ? 'You both finished this one, and the poster is already carrying your notes.'
          : 'You both marked this watched already.',
    };
  }

  if (movie.watchedBy.length === 1) {
    const watcher = movie.watchedBy[0];
    const remaining = ALL_USERS.find((user) => !movie.watchedBy.includes(user));
    return {
      label: `${watcher} watched`,
      title: `${watcher} is ahead on this one`,
      detail: remaining
        ? `${remaining} still has this waiting in the queue.`
        : 'One watch logged so far.',
    };
  }

  return {
    label: 'Still queued',
    title: 'Still sitting in the lineup',
    detail:
      memoryCount > 0
        ? `${movie.addedBy} queued it, and there is already a note attached to the poster.`
        : `${movie.addedBy} queued it for a future night.`,
  };
};

const getNotePreview = (note: string): string => {
  const trimmed = note.trim();
  if (trimmed.length <= 96) {
    return trimmed;
  }

  return `${trimmed.slice(0, 93).trimEnd()}...`;
};

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  memories = [],
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
    movie.year,
    movie.runtime,
    movie.genre?.split(',')[0]?.trim(),
    movie.category,
    movie.director ? `Dir. ${movie.director}` : null,
  ].filter(Boolean) as string[];
  const featuredMemory = memories.find((memory) => memory.isPinned) ?? memories[0] ?? null;
  const secondaryMemories = memories.filter((memory) => memory.id !== featuredMemory?.id).slice(0, 2);
  const watchStatus = getWatchStatus(movie, memories.length);
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
            <div className="movie-details-modal__poster-gradient" aria-hidden="true" />
            <div className="movie-details-modal__poster-badges">
              <span className="movie-details-modal__poster-pill movie-details-modal__poster-pill--status">
                {watchStatus.label}
              </span>
              {memories.length > 0 ? (
                <span className="movie-details-modal__poster-pill">
                  {memories.length} {memories.length === 1 ? 'note' : 'notes'}
                </span>
              ) : null}
            </div>
            <div className="movie-details-modal__poster-footer">
              <span className="movie-details-modal__poster-caption">Queued by {movie.addedBy}</span>
              {movie.watchedBy.length > 0 ? (
                <span className="movie-details-modal__poster-caption">
                  Watched by {movie.watchedBy.join(' & ')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="movie-details-modal__content">
            <div className="movie-details-modal__header">
              <p className="movie-details-modal__eyebrow">Movie night file</p>
              <div className="movie-details-modal__title-row">
                <h2 className="movie-details-modal__title">{movie.title}</h2>
                {movie.imdbRating && /^\d/.test(movie.imdbRating) ? (
                  <span className="movie-details-modal__score-pill">{movie.imdbRating} IMDb</span>
                ) : null}
              </div>
              <p className="movie-details-modal__relationship">{watchStatus.title}</p>
              <p className="movie-details-modal__supporting-copy">{watchStatus.detail}</p>
              {metadataItems.length > 0 ? (
                <div className="movie-details-modal__fact-row">
                  {metadataItems.map((item) => (
                    <span key={item} className="movie-details-modal__fact-pill">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="movie-details-modal__summary-band">
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">Queued by</span>
                <span className="movie-details-modal__summary-value">{movie.addedBy}</span>
              </div>
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">Watch status</span>
                <span className="movie-details-modal__summary-value">{watchStatus.label}</span>
              </div>
              <div className="movie-details-modal__summary-item">
                <span className="movie-details-modal__meta-label">Poster notes</span>
                <span className="movie-details-modal__summary-value">
                  {memories.length > 0 ? `${memories.length} saved` : 'None yet'}
                </span>
              </div>
            </div>

            {movie.plot ? (
              <div className="movie-details-modal__section">
                <p className="movie-details-modal__section-label">Story setup</p>
                <p className="movie-details-modal__plot">{movie.plot}</p>
              </div>
            ) : null}

            <div className="movie-details-modal__section">
              <div className="movie-details-modal__section-head">
                <p className="movie-details-modal__section-label">
                  {featuredMemory?.isPinned ? 'Pinned note' : 'Notes on this poster'}
                </p>
                {memories.length > 1 ? (
                  <span className="movie-details-modal__section-caption">
                    {memories.length} moments saved
                  </span>
                ) : null}
              </div>

              {featuredMemory ? (
                <article className="movie-details-modal__memory-card">
                  <div className="movie-details-modal__memory-card-header">
                    <span className="movie-details-modal__memory-author">{featuredMemory.author}</span>
                    <span className="movie-details-modal__memory-date">
                      {formatMemoryTimestamp(featuredMemory.updatedAt || featuredMemory.createdAt)}
                    </span>
                  </div>
                  <p className="movie-details-modal__memory-note">{featuredMemory.note}</p>
                </article>
              ) : (
                <div className="movie-details-modal__memory-empty">
                  No notes on this poster yet. The first one will show up right here.
                </div>
              )}

              {secondaryMemories.length > 0 ? (
                <div className="movie-details-modal__memory-list">
                  {secondaryMemories.map((memory) => (
                    <div key={memory.id} className="movie-details-modal__memory-row">
                      <div className="movie-details-modal__memory-row-copy">
                        <span className="movie-details-modal__memory-row-author">{memory.author}</span>
                        <p className="movie-details-modal__memory-row-note">
                          {getNotePreview(memory.note)}
                        </p>
                      </div>
                      <span className="movie-details-modal__memory-row-date">
                        {formatMemoryTimestamp(memory.updatedAt || memory.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="movie-details-modal__footer">
              <span>Added {formatMemoryTimestamp(movie.createdAt)}</span>
              {movie.watchedBy.length > 0 ? (
                <span>Shared progress: {movie.watchedBy.join(' & ')}</span>
              ) : (
                <span>Shared progress: no watches logged yet</span>
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
