import React from 'react';
import { Movie, SharedMemory, User } from '@/types';
import { spacing, typography, colors, radius, shadows } from '@/design-system/tokens';
import { useMediaQuery, breakpoints } from '@/hooks/useMediaQuery';
import Card from '@/ui/Card';
import BottomSheet from '@/ui/BottomSheet';
import Button from '@/ui/Button';
import WatcherBadge from '@/common/WatcherBadge';
import { EyeIcon, EyeOffIcon, FilmIcon, MagicWandIcon, TrashIcon } from '@/common/icons';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';

interface MovieCardProps {
  movie: Movie;
  currentUser: User | null;
  onToggle: () => void | Promise<void>;
  onDelete: () => void;
  onFixMatch?: () => void;
  animationDelay: string;
  memories?: SharedMemory[];
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
  isHighlighted?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({
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

  const handleToggle = async () => {
    if (isGuest) return;
    setIsUpdating(true);
    try {
      await onToggle();
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
          marginBottom: 0,
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
                    ? `: "${memories[0].note.slice(0, 60)}${
                        memories[0].note.length > 60 ? '...' : ''
                      }"`
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
            onToggle={handleToggle}
            onDelete={() => handleAction(onDelete)}
            onFixMatch={onFixMatch ? () => handleAction(onFixMatch) : undefined}
            onCloseBottomSheet={() => setIsBottomSheetOpen(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
};

const MoviePoster: React.FC<{ movie: Movie; className?: string }> = ({ movie, className = '' }) => {
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

const MovieMetadata: React.FC<{ movie: Movie; className?: string }> = ({
  movie,
  className = '',
}) => {
  const metadataItems = [
    movie.year,
    movie.runtime,
    movie.imdbRating ? `${movie.imdbRating} IMDb` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={`movie-metadata ${className}`}>
      <div className="movie-meta-row">
        {metadataItems.map((item, index) => (
          <React.Fragment key={`${movie.id}-meta-${item}`}>
            {index > 0 && <span className="movie-meta-separator">•</span>}
            <span className="movie-meta-item">{item}</span>
          </React.Fragment>
        ))}
        {movie.category && (
          <span className="movie-category" aria-label={`Category: ${movie.category}`}>
            {movie.category}
          </span>
        )}
      </div>
    </div>
  );
};

interface MovieActionsProps {
  movie: Movie;
  currentUser: User | null;
  watchedByCurrentUser: boolean;
  isUpdating: boolean;
  isMobile: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onFixMatch?: () => void;
  onCloseBottomSheet?: () => void;
}

interface MovieIconActionButtonProps {
  title: string;
  disabled: boolean;
  color: string;
  borderColor: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const MovieIconActionButton: React.FC<MovieIconActionButtonProps> = ({
  title,
  disabled,
  color,
  borderColor,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    style={{
      padding: 0,
      width: '44px',
      height: '44px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.62)',
      borderRadius: radius.md,
      color,
      border: `1px solid ${borderColor}`,
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    {children}
  </button>
);

const MovieActions: React.FC<MovieActionsProps> = ({
  movie,
  currentUser,
  watchedByCurrentUser,
  isUpdating,
  isMobile,
  onToggle,
  onDelete,
  onFixMatch,
  onCloseBottomSheet,
}) => {
  const isGuest = !currentUser;

  const handleAction = (action?: () => void) => {
    action?.();
    onCloseBottomSheet?.();
  };

  const primaryButton = (
    <Button
      type="button"
      onClick={() => (isMobile && onCloseBottomSheet ? handleAction(onToggle) : onToggle())}
      variant={watchedByCurrentUser ? 'primary' : 'secondary'}
      size={isMobile ? 'md' : 'sm'}
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
        ...(isMobile && {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        }),
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
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {primaryButton}

        <Button
          type="button"
          onClick={() => handleAction(onFixMatch)}
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
          onClick={() => handleAction(onDelete)}
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
    );
  }

  return (
    <div className="movie-actions">
      {primaryButton}

      <div className="movie-secondary-actions">
        <MovieIconActionButton
          onClick={(event) => {
            event.stopPropagation();
            onFixMatch?.();
          }}
          disabled={isGuest}
          title={`Fix metadata for "${movie.title}"`}
          color={colors.accent}
          borderColor={`${colors.accent}45`}
        >
          <MagicWandIcon style={{ width: '14px', height: '14px' }} />
        </MovieIconActionButton>

        <MovieIconActionButton
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          disabled={isGuest}
          title={`Delete "${movie.title}"`}
          color={colors.error}
          borderColor={`${colors.error}45`}
        >
          <TrashIcon style={{ width: '14px', height: '14px' }} />
        </MovieIconActionButton>
      </div>
    </div>
  );
};

interface MovieMemoriesProps {
  movie: Movie;
  memories: SharedMemory[];
  currentUser: User | null;
  isMobile: boolean;
  onAddMemory?: (note: string) => Promise<void>;
  onUpdateMemory?: (memoryId: string, note: string) => Promise<void>;
  onDeleteMemory?: (memoryId: string) => Promise<void>;
  onTogglePin?: (memoryId: string) => Promise<void>;
}

const MovieMemories: React.FC<MovieMemoriesProps> = ({
  movie,
  memories,
  currentUser,
  isMobile,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
}) => {
  const [isSubmittingMemory, setIsSubmittingMemory] = React.useState(false);

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) return;

    setIsSubmittingMemory(true);
    try {
      const form = event.currentTarget as HTMLFormElement;
      const note = (form.elements.namedItem('note') as HTMLTextAreaElement).value;
      await onAddMemory(note);
      form.reset();
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  if (memories.length === 0 && !currentUser) {
    return null;
  }

  return (
    <div
      className="movie-memory-panel"
      style={{
        marginTop: `-${spacing.sm}`,
        marginBottom: spacing.md,
        padding: `${spacing.md} ${spacing.md} ${spacing.sm}`,
        borderRadius: '0 0 12px 12px',
        background: 'rgba(20, 20, 25, 0.4)',
        border: '1px solid rgba(236, 72, 153, 0.18)',
        borderTop: 'none',
        borderLeft: '3px solid rgba(255, 127, 198, 0.28)',
      }}
    >
      {currentUser && onAddMemory && (
        <div style={{ marginBottom: spacing.md }}>
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={handleMemorySubmit}
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
  );
};

const MovieDetails: React.FC<{ movie: Movie; className?: string }> = ({
  movie,
  className = '',
}) => {
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

export default React.memo(MovieCard);
