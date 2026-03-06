import React, { memo, useMemo, useState } from 'react';
import { Movie, User, SharedMemory } from '@/types';
import { TrashIcon, EyeIcon, EyeOffIcon, MagicWandIcon, FilmIcon } from '@/common/icons';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import IconButton from '@/ui/IconButton';
import BottomSheet from '@/ui/BottomSheet';
import WatcherBadge from './WatcherBadge';
import { spacing, typography, colors, radius, shadows } from '@/design-system/tokens';
import { useMediaQuery, breakpoints } from '@/hooks/useMediaQuery';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';
import './MovieItem.css';

interface MovieItemProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: (movie: Movie) => void | Promise<void>;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  animationDelay: string;
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
}

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
  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showMemories, setShowMemories] = useState(false);
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const isGuest = !currentUser;

  const hasSharedMemories = memories.length > 0;
  const metadataItems = useMemo(() => {
    const pieces = [
      movie.year,
      movie.runtime,
      movie.imdbRating ? `${movie.imdbRating} IMDb` : null,
    ];
    return pieces.filter(Boolean) as string[];
  }, [movie.year, movie.runtime, movie.imdbRating]);

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
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              loading="lazy"
              className="movie-item-poster"
            />
          ) : (
            <div className="movie-item-poster-fallback">
              <FilmIcon
                style={{
                  width: '34px',
                  height: '34px',
                  color: 'rgba(255,255,255,0.3)',
                  marginBottom: spacing.sm,
                }}
              />
              <h3 className="movie-item-title movie-item-title--fallback">{movie.title}</h3>
            </div>
          )}

          <div className="movie-item-watchers">
            {movie.watchedBy.includes('Aaron') && <WatcherBadge user="Aaron" size="md" />}
            {movie.watchedBy.includes('Electra') && <WatcherBadge user="Electra" size="md" />}
          </div>

          <div className="movie-item-overlay">
            <div>
              {movie.posterUrl && <h3 className="movie-item-title">{movie.title}</h3>}

              <div className="movie-item-meta-row">
                {metadataItems.map((item, index) => (
                  <React.Fragment key={`${movie.id}-meta-${item}`}>
                    {index > 0 && <span className="movie-item-meta-sep">•</span>}
                    <span className="movie-item-meta">{item}</span>
                  </React.Fragment>
                ))}
                {movie.category && (
                  <span className="movie-item-category" aria-label={`Category: ${movie.category}`}>
                    {movie.category}
                  </span>
                )}
              </div>
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

            <div className="movie-item-actions">
              <Button
                type="button"
                onClick={handleToggle}
                variant={watchedByCurrentUser ? 'primary' : 'secondary'}
                size="sm"
                isLoading={isUpdating}
                loadingText="Updating..."
                disabled={isGuest}
                aria-label={
                  watchedByCurrentUser
                    ? `Mark "${movie.title}" as unwatched`
                    : `Mark "${movie.title}" as watched`
                }
                className="movie-item-primary-action"
                style={{
                  backgroundColor: watchedByCurrentUser ? colors.success : 'rgba(0,0,0,0.62)',
                  borderColor: watchedByCurrentUser ? colors.success : 'rgba(255,255,255,0.28)',
                  opacity: isGuest ? 0.5 : 1,
                }}
              >
                {watchedByCurrentUser ? (
                  <EyeIcon style={{ width: '12px' }} />
                ) : (
                  <EyeOffIcon style={{ width: '12px' }} />
                )}
                <span className="movie-item-primary-action-label">
                  {watchedByCurrentUser ? 'Watched' : 'Mark Watched'}
                </span>
              </Button>

              {!isMobile && (
                <div className="movie-item-secondary-actions">
                  <IconButton
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onFixMatch?.(movie);
                    }}
                    variant="ghost"
                    size="sm"
                    disabled={isGuest}
                    title="Fix Metadata Match"
                    aria-label={`Fix metadata for "${movie.title}"`}
                    style={{
                      padding: 0,
                      width: '44px',
                      height: '44px',
                      backgroundColor: 'rgba(0,0,0,0.62)',
                      borderRadius: radius.md,
                      color: colors.accent,
                      border: `1px solid ${colors.accent}45`,
                      opacity: isGuest ? 0.5 : 1,
                      cursor: isGuest ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <MagicWandIcon style={{ width: '14px', height: '14px' }} />
                  </IconButton>

                  <IconButton
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(movie);
                    }}
                    variant="ghost"
                    size="sm"
                    disabled={isGuest}
                    title="Delete Movie"
                    aria-label={`Delete "${movie.title}"`}
                    style={{
                      padding: 0,
                      width: '44px',
                      height: '44px',
                      backgroundColor: 'rgba(0,0,0,0.62)',
                      borderRadius: radius.md,
                      color: colors.error,
                      border: `1px solid ${colors.error}45`,
                      opacity: isGuest ? 0.5 : 1,
                      cursor: isGuest ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                  </IconButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {showMemories && (
        <div
          className="slide-down movie-item-memory-panel"
          style={{
            marginTop: `-${spacing.sm}`,
            marginBottom: spacing.md,
            padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
            borderRadius: `0 0 ${radius.md} ${radius.md}`,
          }}
        >
          {currentUser && onAddMemory && (
            <div style={{ marginBottom: spacing.md }}>
              <MemoryComposer
                watchedMovieOptions={[movie]}
                selectedMovieId={movie.id}
                onSelectedMovieIdChange={() => {}}
                currentUser={currentUser}
                onSubmit={async (event) => {
                  event.preventDefault();
                  setIsSubmittingMemory(true);
                  try {
                    const form = event.currentTarget as HTMLFormElement;
                    const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
                    await onAddMemory(note);
                    form.reset();
                  } finally {
                    setIsSubmittingMemory(false);
                  }
                }}
                isSubmitting={isSubmittingMemory}
                canSubmit={!isSubmittingMemory}
                isMobile={isMobile}
                note=""
                onNoteChange={() => {}}
                isComposerOpen
                onComposerToggle={() => {}}
                remainingChars={280}
                error={null}
                successMessage={null}
                noteInputRef={React.createRef()}
              />
            </div>
          )}

          {memories.length > 0 ? (
            <MemoryList
              memories={memories}
              visibleMemories={memories}
              sortedMemories={memories}
              currentUser={currentUser}
              isMobile={isMobile}
              onEditMemory={async (memory, note) => {
                if (onUpdateMemory) await onUpdateMemory(memory.id, note);
              }}
              onDeleteMemory={async (memory) => {
                if (onDeleteMemory) await onDeleteMemory(memory.id);
              }}
              onTogglePin={async (memory) => {
                if (onTogglePin) await onTogglePin(memory.id);
              }}
              movieFilterOptions={[]}
              activeMovieFilter={movie.id}
              onActiveMovieFilterChange={() => {}}
              sortMode="newest"
              onSortModeChange={() => {}}
              onShowMore={() => {}}
              onShowLess={() => {}}
              visibleCount={100}
              isLoading={false}
              memoriesError={null}
              onJumpToMovie={() => {}}
            />
          ) : (
            <p
              style={{
                textAlign: 'center',
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
                fontStyle: 'italic',
                padding: spacing.sm,
              }}
            >
              No memories yet. Add one above!
            </p>
          )}
        </div>
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

          <Button
            type="button"
            onClick={() => handleToggle()}
            variant={watchedByCurrentUser ? 'primary' : 'secondary'}
            isLoading={isUpdating}
            loadingText="Updating..."
            disabled={isGuest}
            className="movie-item-primary-action movie-item-primary-action--mobile"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: watchedByCurrentUser ? colors.success : undefined,
              opacity: isGuest ? 0.5 : 1,
            }}
          >
            {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
            <span className="movie-item-primary-action-label">
              {watchedByCurrentUser ? 'Mark as Unwatched' : 'Mark as Watched'}
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => handleAction(() => onFixMatch?.(movie))}
            variant="ghost"
            disabled={isGuest}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              color: colors.accent,
              borderColor: `${colors.accent}40`,
              opacity: isGuest ? 0.5 : 1,
            }}
          >
            <MagicWandIcon />
            Fix Details
          </Button>

          <Button
            type="button"
            onClick={() => handleAction(() => onDelete(movie))}
            variant="ghost"
            disabled={isGuest}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              color: colors.error,
              borderColor: `${colors.error}40`,
              opacity: isGuest ? 0.5 : 1,
            }}
          >
            <TrashIcon />
            Remove from Watchlist
          </Button>
        </div>
      </BottomSheet>
    </>
  );
};

export default memo(MovieItem);
