import React, { memo, useState } from 'react';
import { Movie, User } from '../types';
import { TrashIcon, EyeIcon, EyeOffIcon, TicketIcon, MagicWandIcon, FilmIcon } from './icons';
import Card from './ui/Card';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import BottomSheet from './ui/BottomSheet';
import WatcherBadge from './WatcherBadge';
import { spacing, typography, colors, radius, shadows } from '../design-system/tokens';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';
import MemoryList from './memories/MemoryList';
import MemoryComposer from './memories/MemoryComposer';
import { SharedMemory } from '../types';

interface MovieItemProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: (movie: Movie) => void | Promise<void>;
  onDelete: (movie: Movie) => void;
  onFixMatch?: (movie: Movie) => void;
  animationDelay: string;
  layout?: 'list' | 'grid';
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
}

const getWatchedStatus = (movie: Movie) => {
  const aaronWatched = movie.watchedBy.includes('Aaron');
  const electraWatched = movie.watchedBy.includes('Electra');
  if (aaronWatched && electraWatched) return 'Watched by both';
  if (aaronWatched) return 'Watched by Aaron';
  if (electraWatched) return 'Watched by Electra';
  return 'Not watched yet';
};

const MovieItem: React.FC<MovieItemProps> = ({
  movie,
  currentUser,
  onToggle,
  onDelete,
  onFixMatch,
  animationDelay,
  layout = 'list',
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
  const isMobile = useMediaQuery(breakpoints.sm);
  const isGuest = !currentUser;

  // We don't need memoryPreview/Count props anymore as we have the full array
  const hasSharedMemories = memories.length > 0;

  const handleCardClick = () => {
    if (isMobile && layout === 'grid') {
      setIsBottomSheetOpen(true);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsBottomSheetOpen(false);
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
        style={{
          padding: 0,
          opacity: 1,
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          marginBottom: layout === 'grid' ? spacing.sm : spacing.md,
          borderWidth: watchedByBoth ? (layout === 'grid' ? '2px' : '3px') : '1px',
          borderColor: isHighlighted
            ? colors.secondary
            : watchedByBoth
              ? colors.accent
              : colors.border,
          position: 'relative',
          overflow: 'hidden',
          animationDelay,
          display: 'flex',
          flexDirection: layout === 'grid' ? 'column' : 'row',
          minHeight: layout === 'grid' ? 'auto' : '160px',
          boxShadow: isHighlighted
            ? '0 0 0 2px rgba(135, 206, 250, 0.55), 0 0 24px rgba(135, 206, 250, 0.45)'
            : layout === 'grid'
              ? shadows.card
              : shadows.card,
          backgroundColor: colors.surfaceElevated,
          cursor: isMobile && layout === 'grid' ? 'pointer' : 'default',
          transform: 'translateZ(0)',
          flexWrap: 'wrap', // Allow memories to take full width below
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.boxShadow = shadows.glow;
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = shadows.card;
          }
        }}
      >
        {/* Poster Image or Text Fallback */}
        <div
          style={{
            width: layout === 'grid' ? '100%' : '110px',
            height: layout === 'grid' ? 'auto' : 'auto',
            aspectRatio: layout === 'grid' ? '2/3' : 'unset',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              !movie.posterUrl && layout === 'grid'
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
          ) : layout === 'grid' ? (
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
          ) : null}

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

          {/* Grid View Overlay */}
          {layout === 'grid' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: movie.posterUrl
                  ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: spacing.sm,
                opacity: 1,
                zIndex: 2,
              }}
            >
              {movie.posterUrl && (
                <h3
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.textPrimary,
                    margin: 0,
                    marginBottom: '2px',
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

              {hasSharedMemories && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleMemories(e);
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    marginBottom: spacing.xs,
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '4px',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: spacing.sm,
                    width: '100%',
                  }}
                >
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List View Content (Only if NOT grid) */}
        {layout !== 'grid' && (
          <div
            style={{
              flex: 1,
              padding: isMobile ? spacing.sm : spacing.md,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              minWidth: 0,
              zIndex: 2,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
                }}
              >
                <h3
                  className="movie-title"
                  style={{
                    fontSize: isMobile ? typography.fontSize.lg : typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: watchedByBoth ? colors.textSecondary : colors.textPrimary,
                    textDecoration: watchedByBoth ? 'line-through' : 'none',
                    margin: 0,
                    marginBottom: spacing.xs,
                    wordBreak: 'break-word',
                    lineHeight: typography.lineHeight.tight,
                    textShadow: watchedByBoth ? 'none' : shadows.textGlow,
                    maxWidth: '90%',
                  }}
                >
                  {movie.title}
                </h3>
                {watchedByBoth && (
                  <div
                    style={{
                      color: colors.accent,
                      flexShrink: 0,
                      filter: 'drop-shadow(0 0 8px rgba(255, 105, 180, 0.6))',
                      animation: 'pulse-glow 2s ease-in-out infinite',
                    }}
                  >
                    <TicketIcon style={{ width: '24px', height: '24px' }} />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  fontSize: typography.fontSize.sm,
                  color: colors.textTertiary,
                  marginBottom: spacing.md,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                {movie.year && <span style={{ color: colors.textSecondary }}>{movie.year}</span>}
                {movie.year && movie.category && <span>•</span>}
                {movie.category && (
                  <span
                    style={{
                      color: colors.accentLight,
                      backgroundColor: `${colors.accent}15`,
                      padding: '2px 8px',
                      borderRadius: radius.sm,
                      fontSize: '0.7rem',
                      border: `1px solid ${colors.accent}30`,
                    }}
                  >
                    {movie.category}
                  </span>
                )}
              </div>

              {movie.plot && (
                <p
                  style={{
                    fontSize: isMobile ? typography.fontSize.xs : typography.fontSize.base,
                    color: colors.textSecondary,
                    opacity: 0.9,
                    margin: 0,
                    marginBottom: isMobile ? spacing.sm : spacing.lg,
                    display: '-webkit-box',
                    WebkitLineClamp: isMobile ? 2 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: typography.lineHeight.normal,
                  }}
                >
                  {movie.plot}
                </p>
              )}

              {/* Memory Toggle Button */}
              <button
                type="button"
                onClick={handleToggleMemories}
                style={{
                  marginBottom: spacing.md,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: radius.md,
                  border: '1px solid rgba(255, 223, 167, 0.35)',
                  background:
                    'linear-gradient(145deg, rgba(64, 41, 18, 0.45) 0%, rgba(34, 24, 14, 0.55) 100%)',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                aria-label={`View memories for "${movie.title}"`}
                aria-expanded={showMemories}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: '#ffe9c0',
                      fontSize: typography.fontSize.xs,
                      fontFamily:
                        "'Papyrus', 'Copperplate', 'Palatino Linotype', 'Book Antiqua', serif",
                      letterSpacing: '0.03em',
                    }}
                  >
                    {hasSharedMemories
                      ? `${memories.length} shared memor${memories.length === 1 ? 'y' : 'ies'}`
                      : 'Add a memory...'}
                  </p>
                  {hasSharedMemories && memories.length > 0 && (
                    <p
                      style={{
                        margin: `${spacing.xs} 0 0`,
                        color: colors.textSecondary,
                        fontSize: typography.fontSize.xs,
                        lineHeight: typography.lineHeight.normal,
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      "{memories[0].note}"
                    </p>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: colors.textTertiary,
                    transform: showMemories ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  ▼
                </div>
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
                flexWrap: 'wrap',
                gap: spacing.md,
                borderTop: `1px solid ${colors.borderInset}`,
                paddingTop: spacing.sm,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: watchedByBoth ? colors.textTertiary : colors.secondary,
                      fontStyle: watchedByBoth ? 'italic' : 'normal',
                      fontWeight: typography.fontWeight.medium,
                    }}
                  >
                    {getWatchedStatus(movie)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <IconButton
                  type="button"
                  onClick={handleToggle}
                  variant="ghost"
                  disabled={isGuest || isUpdating}
                  title={watchedByCurrentUser ? 'Mark as unwatched' : 'Mark as watched'}
                  aria-label={
                    watchedByCurrentUser
                      ? `Mark "${movie.title}" as unwatched`
                      : `Mark "${movie.title}" as watched`
                  }
                  style={{
                    backgroundColor: watchedByCurrentUser ? `${colors.success}20` : 'transparent',
                    border: watchedByCurrentUser
                      ? `1px solid ${colors.success}40`
                      : '1px solid transparent',
                    opacity: isGuest ? 0.5 : 1,
                    cursor: isGuest ? 'not-allowed' : 'pointer',
                  }}
                >
                  {watchedByCurrentUser ? <EyeIcon /> : <EyeOffIcon />}
                </IconButton>

                <IconButton
                  type="button"
                  onClick={() => onFixMatch?.(movie)}
                  variant="ghost"
                  disabled={isGuest}
                  title="Fix Incorrect Match"
                  aria-label={`Fix metadata for "${movie.title}"`}
                  style={{
                    border: `1px solid ${colors.borderSecondary}40`,
                    color: colors.accent,
                    opacity: isGuest ? 0.5 : 1,
                    cursor: isGuest ? 'not-allowed' : 'pointer',
                  }}
                >
                  <MagicWandIcon />
                </IconButton>

                <IconButton
                  type="button"
                  onClick={() => onDelete(movie)}
                  variant="ghost"
                  disabled={isGuest}
                  title="Delete Movie"
                  aria-label={`Delete "${movie.title}"`}
                  style={{
                    border: `1px solid ${colors.error}40`,
                    color: colors.error,
                    opacity: isGuest ? 0.5 : 1,
                    cursor: isGuest ? 'not-allowed' : 'pointer',
                  }}
                >
                  <TrashIcon />
                </IconButton>
              </div>
            </div>
          </div>
        )}
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
          {/* Add New Memory */}
          {currentUser && onAddMemory && (
            <div style={{ marginBottom: spacing.md }}>
              <MemoryComposer
                watchedMovieOptions={[movie]}
                selectedMovieId={movie.id}
                onSelectedMovieIdChange={() => { }}
                currentUser={currentUser}
                isExpanded={true}
                onSubmit={async (e, note) => {
                  e.preventDefault();
                  await handleAddMemory(note);
                }}
                isSubmitting={isSubmittingMemory}
                canSubmit={!isSubmittingMemory}
                isMobile={isMobile}
                // Props required by interface but unused in single-movie context
                note=""
                onNoteChange={() => { }}
                isComposerOpen={true}
                onComposerToggle={() => { }}
                remainingChars={280}
              />
            </div>
          )}

          {/* List Memories */}
          {memories.length > 0 ? (
            <MemoryList
              memories={memories}
              visibleMemories={memories}
              sortedMemories={memories}
              currentUser={currentUser}
              isMobile={isMobile}
              // Actions
              onEditMemory={async (memory, note) => {
                if (onUpdateMemory) await onUpdateMemory(memory.id, note);
              }}
              onDeleteMemory={async (memory) => {
                if (onDeleteMemory) await onDeleteMemory(memory.id);
              }}
              onTogglePin={async (memory) => {
                if (onTogglePin) await onTogglePin(memory.id);
              }}
              // Props not needed for simple list but required by component
              movieFilterOptions={[]}
              activeMovieFilter={movie.id}
              onActiveMovieFilterChange={() => { }}
              sortMode="newest"
              onSortModeChange={() => { }}
              onShowMore={() => { }}
              onShowLess={() => { }}
              visibleCount={100}
              isLoading={false}
              memoriesError={null}
              onJumpToMovie={() => { }}
            />
          ) : (
            <p style={{
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: typography.fontSize.xs,
              fontStyle: 'italic',
              padding: spacing.sm
            }}>
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
          {/* Movie Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
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
              {movie.year && (
                <span style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
                  {movie.year}
                </span>
              )}
              {movie.imdbRating && (
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                >
                  <span style={{ color: colors.yellow, fontWeight: typography.fontWeight.bold }}>
                    ★ {movie.imdbRating}
                  </span>
                </div>
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

          {/* Action Buttons */}
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
