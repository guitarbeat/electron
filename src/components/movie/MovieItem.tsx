import React from 'react';
import { Movie, User, SharedMemory } from '@/types';
import { spacing, typography, colors, radius, shadows } from '@/design-system/tokens';
import { useMediaQuery, breakpoints } from '@/hooks/useMediaQuery';
import Card from '@/ui/Card';
import BottomSheet from '@/ui/BottomSheet';
import WatcherBadge from '../common/WatcherBadge';
import {
  MoviePoster,
  MovieMetadata,
  MovieActions,
  MovieMemories,
  MovieDetails,
  MovieItemProps,
} from './index';
import './MovieItem.css';

const MovieItem: React.FC<MovieItemProps> = ({
  movie,
  currentUser,
  onToggle,
  onDelete,
  onFixMatch,
  animationDelay,
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
}) => {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const [showMemories, setShowMemories] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const isGuest = !currentUser;

  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const hasSharedMemories = memories.length > 0;

  const handleCardClick = () => {
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsBottomSheetOpen(false);
  };

  const handleToggleMemories = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setShowMemories((current) => !current);
  };

  const handleToggle = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (isGuest) return;

    setIsUpdating(true);
    try {
      await onToggle(movie);
    } finally {
      setIsUpdating(false);
      setIsBottomSheetOpen(false);
    }
  };

  return (
    <>
      <Card
        variant={watchedByBoth ? 'elevated' : 'default'}
        className={`movie-item-card slide-up ${
          watchedByBoth ? 'movie-item-card--watched' : ''
        } ${isHighlighted ? 'movie-item-card--highlighted' : ''}`}
        onClick={isMobile ? handleCardClick : undefined}
        data-movie-id={movie.id}
        style={{
          padding: 0,
          marginBottom: spacing.sm,
          animationDelay,
          borderColor: watchedByBoth ? colors.accent : colors.border,
          cursor: isMobile ? 'pointer' : 'default',
        }}
      >
        <div className="movie-item-poster-wrap">
          <MoviePoster movie={movie} />

          <div className="movie-item-watchers">
            {movie.watchedBy.includes('Aaron') && <WatcherBadge user="Aaron" size="md" />}
            {movie.watchedBy.includes('Electra') && <WatcherBadge user="Electra" size="md" />}
          </div>

          <div className="movie-item-overlay">
            <div>
              {movie.posterUrl && <h3 className="movie-item-title">{movie.title}</h3>}
              <MovieMetadata movie={movie} />
            </div>

            {hasSharedMemories && (
              <button
                type="button"
                onClick={handleToggleMemories}
                className="movie-item-memory-toggle"
                aria-label={`View memories for "${movie.title}"`}
              >
                {memories.length} shared memor{memories.length === 1 ? 'y' : 'ies'}
              </button>
            )}

            <MovieActions
              movie={movie}
              currentUser={currentUser}
              watchedByCurrentUser={watchedByCurrentUser}
              isUpdating={isUpdating}
              isMobile={isMobile}
              onToggle={handleToggle}
              onDelete={onDelete}
              onFixMatch={onFixMatch}
            />
          </div>
        </div>
      </Card>

      {showMemories && (
        <MovieMemories
          movie={movie}
          memories={memories}
          currentUser={currentUser}
          isMobile={isMobile}
          onAddMemory={onAddMemory}
          onUpdateMemory={onUpdateMemory}
          onDeleteMemory={onDeleteMemory}
          onTogglePin={onTogglePin}
        />
      )}

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title={movie.title}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt=""
                style={{
                  width: '60px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: radius.md,
                  boxShadow: shadows.card,
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <MovieDetails movie={movie} />

              <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.sm }}>
                {movie.watchedBy.includes('Aaron') && (
                  <WatcherBadge user="Aaron" variant="text" showLabel />
                )}
                {movie.watchedBy.includes('Electra') && (
                  <WatcherBadge user="Electra" variant="text" showLabel />
                )}
              </div>

              {hasSharedMemories && (
                <button
                  type="button"
                  onClick={() => handleAction(() => setShowMemories(true))}
                  style={{
                    marginTop: spacing.sm,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: radius.sm,
                    border: `1px solid ${colors.borderSecondary}40`,
                    color: '#ffe9c0',
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamily.heading.join(', '),
                    background: 'transparent',
                    textAlign: 'left',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  aria-label={`View memories for "${movie.title}"`}
                >
                  {memories.length} shared memor{memories.length === 1 ? 'y' : 'ies'}
                  {memories[0]?.note
                    ? `: "${memories[0].note.slice(0, 60)}${memories[0].note.length > 60 ? '...' : ''}"`
                    : ''}
                </button>
              )}
            </div>
          </div>

          <MovieActions
            movie={movie}
            currentUser={currentUser}
            watchedByCurrentUser={watchedByCurrentUser}
            isUpdating={isUpdating}
            isMobile={isMobile}
            onToggle={() => handleToggle()}
            onDelete={(movie) => handleAction(() => onDelete(movie))}
            onFixMatch={(movie) => handleAction(() => onFixMatch?.(movie))}
            onCloseBottomSheet={() => setIsBottomSheetOpen(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
};

export default React.memo(MovieItem);
