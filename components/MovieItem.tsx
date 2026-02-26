import React, { memo, useState } from 'react';
import { Movie, User, SharedMemory } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon, MagicWandIcon, FilmIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import BottomSheet from './ui/BottomSheet';
import WatcherBadge from './WatcherBadge';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import MemoryList from './memories/MemoryList';
import MemoryComposer from './memories/MemoryComposer';

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
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMediaQuery(breakpoints.sm);
  const isGuest = !currentUser;

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

  const handleToggleMemories = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMemories(!showMemories);
  };

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
        className={`${watchedByBoth ? 'animate-pink-glow' : 'movie-card'} slide-up`}
        onClick={handleCardClick}
        data-movie-id={movie.id}
        style={{
          padding: 0,
          opacity: 1,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          marginBottom: spacing.sm,
          borderWidth: watchedByBoth ? '2px' : '1px',
          borderColor: isHighlighted
            ? colors.secondary
            : watchedByBoth
              ? colors.accent
              : colors.border,
          position: 'relative',
          overflow: 'hidden',
          animationDelay,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isHighlighted
            ? '0 0 0 2px rgba(135, 206, 250, 0.55), 0 0 24px rgba(135, 206, 250, 0.45)'
            : shadows.card,
          backgroundColor: colors.surfaceElevated,
          cursor: isMobile ? 'pointer' : 'default',
          transform: 'translateZ(0)',
          flexWrap: 'wrap',
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            setIsHovered(true);
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.boxShadow = shadows.glow;
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            setIsHovered(false);
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = shadows.card;
          }
        }}
      >
        {/* Poster Image or Text Fallback */}
        <div
          style={{
            width: '100%',
            aspectRatio: '2/3',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: !movie.posterUrl
              ? `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`
              : colors.background,
          }}
        >
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
              }}
            />
          ) : (
            <div
              style={{
                padding: isMobile ? spacing.sm : spacing.md,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                textAlign: 'center',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <FilmIcon
                style={{
                  width: '32px',
                  height: '32px',
                  color: 'rgba(255,255,255,0.2)',
                  marginBottom: spacing.sm,
                }}
              />
              <h3
                style={{
                  fontSize: isMobile ? typography.fontSize.base : typography.fontSize.lg,
                  margin: 0,
                  color: colors.textPrimary,
                  fontWeight: typography.fontWeight.bold,
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {movie.title}
              </h3>
            </div>
          )}

          {/* Watcher Badges - Floating on Top-Left */}
          <div
            style={{
              position: 'absolute',
              top: spacing.sm,
              left: spacing.sm,
              display: 'flex',
              gap: '4px',
              zIndex: 10,
            }}
          >
            {movie.watchedBy.includes('Aaron') && <WatcherBadge user="Aaron" size="md" />}
            {movie.watchedBy.includes('Electra') && <WatcherBadge user="Electra" size="md" />}
          </div>

          {/* Grid Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: movie.posterUrl
                ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 42%, transparent 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: spacing.sm,
              opacity: 1,
              zIndex: 2,
              gap: '6px',
            }}
          >
            <div>
              {movie.posterUrl && (
                <h3
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.textPrimary,
                    margin: 0,
                    marginBottom: '4px',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {movie.title}
                </h3>
              )}

              {(movie.year || movie.category) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {movie.year && <span>{movie.year}</span>}
                  {movie.year && movie.category && <span style={{ opacity: 0.7 }}>•</span>}
                  {movie.category && (
                    <span
                      style={{
                        color: colors.accentLight,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        padding: '2px 8px',
                        borderRadius: radius.full,
                        border: '1px solid rgba(255,255,255,0.18)',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      {movie.category}
                    </span>
                  )}
                </div>
              )}

              {movie.plot && !isMobile && (
                <p
                  style={{
                    margin: '8px 0 0',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '12px',
                    lineHeight: 1.35,
                    display: isHovered ? '-webkit-box' : 'none',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  {movie.plot}
                </p>
              )}
            </div>

            {hasSharedMemories && (
              <button
                type="button"
                onClick={(e) => {
                  handleToggleMemories(e);
                }}
                style={{
                  alignSelf: 'flex-start',
                  padding: '2px 8px',
                  borderRadius: radius.full,
                  border: '1px solid rgba(255, 248, 210, 0.55)',
                  backgroundColor: 'rgba(58, 41, 17, 0.55)',
                  color: '#fff4d6',
                  fontSize: '0.65rem',
                  fontFamily:
                    "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  borderStyle: 'solid',
                }}
                aria-label={`View memories for "${movie.title}"`}
              >
                {memories.length} shared memor{memories.length === 1 ? 'y' : 'ies'}
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', width: '100%' }}>
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
                style={{
                  padding: `${spacing.xs} ${spacing.md}`,
                  minHeight: '44px',
                  fontSize: '12px',
                  backgroundColor: watchedByCurrentUser ? colors.success : 'rgba(0,0,0,0.6)',
                  borderColor: watchedByCurrentUser ? colors.success : 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1,
                  opacity: isGuest ? 0.5 : 1,
                  cursor: isGuest ? 'not-allowed' : 'pointer',
                }}
              >
                {watchedByCurrentUser ? (
                  <EyeIcon style={{ width: '12px' }} />
                ) : (
                  <EyeOffIcon style={{ width: '12px' }} />
                )}
                {watchedByCurrentUser ? 'Watched' : 'Mark Watched'}
              </Button>

              {!isMobile && (
                <>
                  <IconButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
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
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: radius.md,
                      color: colors.accent,
                      border: `1px solid ${colors.accent}40`,
                      opacity: isGuest ? 0.5 : 1,
                      cursor: isGuest ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <MagicWandIcon style={{ width: '14px', height: '14px' }} />
                  </IconButton>

                  <IconButton
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
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
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: radius.md,
                      color: colors.error,
                      border: `1px solid ${colors.error}40`,
                      opacity: isGuest ? 0.5 : 1,
                      cursor: isGuest ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                  </IconButton>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Expanded Memory Section */}
      {showMemories && (
        <div
          className="slide-down"
          style={{
            width: '100%',
            marginTop: `-${spacing.sm}`,
            marginBottom: spacing.md,
            padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
            background: 'rgba(20, 20, 25, 0.4)',
            border: `1px solid ${colors.borderSecondary}30`,
            borderTop: 'none',
            borderRadius: `0 0 ${radius.md} ${radius.md}`,
            borderLeft: `3px solid ${colors.accent}40`,
          }}
        >
          {currentUser && onAddMemory && (
            <div style={{ marginBottom: spacing.md }}>
              <MemoryComposer
                watchedMovieOptions={[movie]}
                selectedMovieId={movie.id}
                onSelectedMovieIdChange={() => {}}
                currentUser={currentUser}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmittingMemory(true);
                  try {
                    const form = e.currentTarget as HTMLFormElement;
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

      {/* Mobile Bottom Sheet for Actions */}
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
              {(movie.year || movie.category) && (
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
                    fontFamily:
                      "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
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
            {watchedByCurrentUser ? 'Mark as Unwatched' : 'Mark as Watched'}
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
