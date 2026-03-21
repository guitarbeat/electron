import React, { memo, useCallback, useEffect, useState } from 'react';
import { useUser } from '@/context';
import { useWatchlist } from './useWatchlist';
import { ContentTab, Movie, MovieSuggestion, SharedMemory, SortMode, User, WatchlistProps } from '@/types';
import { mediaBreakpoints, useMediaQuery } from '@/hooks/useMediaQuery';
import { executeAction } from '@/utils';
import ConfirmDialog from '@/ui/ConfirmDialog';
import Confetti from '@/effects/Confetti';
import { MovieCardSkeleton } from '@/ui/Skeleton';
import { CollectionEmptyState, CollectionGrid, WorkspacePanels } from '@/ui/CollectionLayout';
import Card from '@/ui/Card';
import Button from '@/ui/Button';
import BottomSheet from '@/ui/BottomSheet';
import { Input } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';
import ThemeToggle from '@/ui/ThemeToggle';
import { CheckIcon, CrossIcon, EyeIcon, EyeOffIcon, MagicWandIcon, PlusIcon, Spinner, TrashIcon } from '@/common/icons';
import { colors, motion, radius, spacing, typography } from '@/design-system';

const MOVIE_TABS: { id: ContentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Queue' },
  { id: 'watched', label: 'Watched' },
  { id: 'suggestions', label: 'Suggestions' },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'A-Z' },
  { id: 'year', label: 'Year' },
];

interface WatchlistTopControlsProps {
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  tabCounts: Record<ContentTab, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onPickRandom: () => void;
  canSurprise: boolean;
  isAdding: boolean;
  isSuggesting: boolean;
  suggestionError: string | null;
}

const WatchlistTopControls: React.FC<WatchlistTopControlsProps> = ({
  contentTab,
  setContentTab,
  sortMode,
  setSortMode,
  tabCounts,
  searchQuery,
  setSearchQuery,
  onSubmit,
  onPickRandom,
  canSurprise,
  isAdding,
  isSuggesting,
  suggestionError,
}) => {
  return (
    <div
      className="watchlist-top-controls"
      style={{
        marginBottom: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <SubNav
        tabs={MOVIE_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tabCounts[tab.id] ?? 0,
        }))}
        activeTabId={contentTab}
        onTabChange={(id) => setContentTab(id as ContentTab)}
        chips={SORT_OPTIONS}
        activeChipId={sortMode}
        onChipChange={(id) => setSortMode(id as SortMode)}
        variant="underlined"
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          style={{
            flex: 1,
            display: 'flex',
            gap: spacing.xs,
            alignItems: 'stretch',
          }}
        >
          <div style={{ flex: 1 }}>
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search or add a movie..."
              aria-label="Search or add a movie"
              fullWidth
            />
          </div>
          {searchQuery.trim() && (
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={isAdding || isSuggesting}
              isLoading={isAdding || isSuggesting}
              title="Add or suggest movie"
              aria-label="Add or suggest movie"
              style={{ minWidth: '44px' }}
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          )}
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={onPickRandom}
          disabled={isAdding || isSuggesting || !canSurprise}
          title="Surprise me"
          aria-label="Pick a random movie"
          style={{
            fontSize: '1.25rem',
            padding: spacing.xs,
            borderRadius: '50%',
            aspectRatio: '1/1',
            minWidth: '44px',
          }}
        >
          🎲
        </Button>
      </div>

      {suggestionError && (
        <div
          role="alert"
          style={{
            marginTop: -spacing.xs,
            color: colors.error,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
            background: `${colors.error}10`,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: '4px',
            border: `1px solid ${colors.error}30`,
          }}
        >
          {suggestionError}
        </div>
      )}
    </div>
  );
};

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  isProcessing?: boolean;
  animationDelay?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  isProcessing = false,
  animationDelay = '0s',
}) => {
  return (
    <Card
      variant="default"
      style={{
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut} ${animationDelay} both`,
        position: 'relative',
        overflow: 'hidden',
        border: `1px dashed ${colors.border}`,
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <div style={{ ...typography.presets.eyebrow, color: colors.accent, opacity: 0.8 }}>
          Suggestion from {suggestion.suggestedBy}
        </div>
        <h3
          style={{
            margin: 0,
            ...typography.presets.bodySm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.textPrimary,
          }}
        >
          {suggestion.title}
        </h3>
        {suggestion.reason && (
          <p
            style={{
              margin: 0,
              ...typography.presets.caption,
              color: colors.textSecondary,
              fontStyle: 'italic',
              lineHeight: 1.4,
              marginTop: spacing.xs,
            }}
          >
            "{suggestion.reason}"
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginTop: 'auto',
          paddingTop: spacing.xs,
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          isLoading={isProcessing}
          disabled={isProcessing}
          fullWidth
          style={{ gap: spacing.xs }}
        >
          <CheckIcon style={{ width: 14, height: 14 }} />
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReject}
          disabled={isProcessing}
          fullWidth
          style={{ gap: spacing.xs, color: colors.error }}
        >
          <CrossIcon style={{ width: 14, height: 14 }} />
          Reject
        </Button>
      </div>

      {isProcessing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.1)',
            backdropFilter: 'blur(1px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        />
      )}
    </Card>
  );
};

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

interface WatcherBadgeProps {
  user: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'text';
  showLabel?: boolean;
  className?: string;
}

const WatcherBadge: React.FC<WatcherBadgeProps> = ({
  user,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
}) => {
  const badgeClassName = [
    'watcher-badge',
    `watcher-badge--${variant}`,
    `watcher-badge--${size}`,
    `watcher-badge--${user.toLowerCase()}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={badgeClassName}>
      <div className="watcher-badge__avatar">{user.charAt(0).toUpperCase()}</div>
      {showLabel && <span className="watcher-badge__label">{user}</span>}
    </div>
  );
};

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
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isGuest = !currentUser;

  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const hasSharedMemories = memories.length > 0;
  const memoryCountText = `${memories.length} shared memor${memories.length === 1 ? 'y' : 'ies'}`;
  const firstMemoryNote = memories[0]?.note;
  const memoryPreviewText = firstMemoryNote
    ? `: "${firstMemoryNote.slice(0, 60)}${firstMemoryNote.length > 60 ? '...' : ''}"`
    : '';

  const handleCardClick = () => {
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
  };

  const runBottomSheetAction = (action: () => void) => {
    executeAction(action, () => setIsBottomSheetOpen(false));
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
    } catch (error) {
      console.error('Failed to toggle watched status', error);
    } finally {
      setIsUpdating(false);
      setIsBottomSheetOpen(false);
    }
  };

  return (
    <>
      <Card
        variant={watchedByBoth ? 'elevated' : 'default'}
        glow={watchedByBoth || isHighlighted}
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
              <h3 className={`movie-item-title ${movie.posterUrl ? '' : 'movie-item-title--fallback'}`}>
                {movie.title}
              </h3>
              <MovieMetadata movie={movie} />
            </div>

            {hasSharedMemories && (
              <button
                type="button"
                onClick={handleToggleMemories}
                className="movie-item-memory-toggle"
                aria-label={`View memories for "${movie.title}"`}
              >
                {memoryCountText}
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
          <div className="movie-sheet-summary">
            <MoviePoster movie={movie} className="movie-poster-wrap--sheet" />
            <div className="movie-sheet-summary__details">
              <MovieDetails movie={movie} />

              <div className="movie-sheet-watchers">
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
                  onClick={() => runBottomSheetAction(() => setShowMemories(true))}
                  className="movie-sheet-memory-button"
                  aria-label={`View memories for "${movie.title}"`}
                >
                  {memoryCountText}
                  {memoryPreviewText}
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
            onDelete={() => runBottomSheetAction(onDelete)}
            onFixMatch={onFixMatch ? () => runBottomSheetAction(onFixMatch) : undefined}
            onCloseBottomSheet={() => setIsBottomSheetOpen(false)}
          />
        </div>
      </BottomSheet>
    </>
  );
};

const MoviePoster: React.FC<{ movie: Movie; className?: string }> = ({ movie, className = '' }) => {
  const [hasImageError, setHasImageError] = React.useState(false);

  React.useEffect(() => {
    setHasImageError(false);
  }, [movie.posterUrl]);

  const shouldShowPoster = Boolean(movie.posterUrl) && !hasImageError;

  return (
    <div className={`movie-poster-wrap ${className}`}>
      {shouldShowPoster ? (
        <img
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
          loading="lazy"
          className="movie-poster"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className="movie-poster-fallback">
          <div className="movie-poster-fallback__inner">
            <span className="movie-poster-fallback__ornament" aria-hidden="true">
              ✦
            </span>
            <h3 className="movie-poster-fallback__title">{movie.title}</h3>
            {movie.year && <span className="movie-poster-fallback__year">{movie.year}</span>}
            <span
              className="movie-poster-fallback__ornament movie-poster-fallback__ornament--bottom"
              aria-hidden="true"
            >
              ✦
            </span>
          </div>
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
  className?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const MovieIconActionButton: React.FC<MovieIconActionButtonProps> = ({
  title,
  disabled,
  color,
  borderColor,
  className = '',
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    style={
      {
        '--movie-action-color': color,
        '--movie-action-border': borderColor,
      } as React.CSSProperties
    }
    className={`movie-item-icon-action ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
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
  const primaryActionLabel = watchedByCurrentUser ? 'Unwatch' : 'Mark watched';
  const primaryActionLabelShort = watchedByCurrentUser ? 'Unwatch' : 'Watch';

  const stopActionPropagation = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const runAction = (action?: () => void) => {
    executeAction(action, onCloseBottomSheet);
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    if (isMobile && onCloseBottomSheet) {
      runAction(onToggle);
      return;
    }
    executeAction(onToggle);
  };

  const handleFixMatchAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    runAction(onFixMatch);
  };

  const handleDeleteAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    runAction(onDelete);
  };

  const mobileActionStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    opacity: isGuest ? 0.5 : 1,
  };

  const primaryButton = (
    <Button
      type="button"
      onClick={handlePrimaryAction}
      variant={watchedByCurrentUser ? 'primary' : 'secondary'}
      size={isMobile ? 'md' : 'sm'}
      isLoading={isUpdating}
      loadingText="Updating..."
      disabled={isGuest}
      aria-pressed={watchedByCurrentUser}
      aria-label={
        watchedByCurrentUser
          ? `Mark "${movie.title}" as unwatched`
          : `Mark "${movie.title}" as watched`
      }
      className={`movie-item-primary-action ${watchedByCurrentUser ? 'movie-item-primary-action--watched' : 'movie-item-primary-action--unwatched'}`}
      style={{
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
        <span className="movie-item-primary-action-label--long">
          {primaryActionLabel}
        </span>
        <span className="movie-item-primary-action-label--short" aria-hidden>
          {primaryActionLabelShort}
        </span>
      </span>
    </Button>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {primaryButton}

        <Button
          type="button"
          onClick={handleFixMatchAction}
          variant="secondary"
          disabled={isGuest}
          className="movie-item-mobile-action"
          style={mobileActionStyle}
        >
          <MagicWandIcon />
          Fix Details
        </Button>

        <Button
          type="button"
          onClick={handleDeleteAction}
          variant="danger"
          disabled={isGuest}
          className="movie-item-mobile-action"
          style={mobileActionStyle}
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
          onClick={handleFixMatchAction}
          disabled={isGuest}
          title={`Fix metadata for "${movie.title}"`}
          color={colors.accent}
          borderColor={`${colors.accent}45`}
          className="movie-icon-action--fix"
        >
          <MagicWandIcon style={{ width: '14px', height: '14px' }} />
        </MovieIconActionButton>

        <MovieIconActionButton
          onClick={handleDeleteAction}
          disabled={isGuest}
          title={`Delete "${movie.title}"`}
          color={colors.error}
          borderColor={`${colors.error}45`}
          className="movie-icon-action--delete"
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
                ...typography.presets.badge,
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

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false, activeTab, onTabChange, isMobile: propIsMobile }) => {
  const { currentUser } = useUser();

  const {
    // State returns
    isMobile,
    searchQuery,
    setSearchQuery,
    isAdding,
    setIsAdding,
    movieToDelete,
    setMovieToDelete,
    setToast,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    successMovieId,
    setSuccessMovieId,
    processingSuggestionId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setProcessingSuggestionId,
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    movieToFix,
    setMovieToFix,
    showConfetti,
    setShowConfetti,
    previousMoviesRef,

    // Data returns
    movies,
    isLoading,
    // refreshMovies,
    addMovie,
    toggleWatched,
    deleteMovie,
    addSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    // pendingSuggestions, // Already used through filteredSuggestions
    // memories,
    // addMemory,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
  } = useWatchlist({ currentUser, isPaused });

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : ['desktop-1', 'desktop-2', 'desktop-3', 'desktop-4', 'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8'];

  // Handle confetti when both users watch a movie
  useEffect(() => {
    if (!movies || !previousMoviesRef.current) {
      previousMoviesRef.current = movies || null;
      return;
    }

    movies.forEach((movie) => {
      if (movie.watchedBy.length === 2) {
        const prevMovie = previousMoviesRef.current?.find((m) => m.id === movie.id);
        if (prevMovie && prevMovie.watchedBy.length === 1) {
          setSuccessMovieId(movie.id);
          setShowConfetti(true);
          setToast({
            message: `🎉 You both watched "${movie.title}"!`,
            type: 'success',
          });
        }
      }
    });

    previousMoviesRef.current = movies;
  }, [movies, setShowConfetti, setToast, setSuccessMovieId, previousMoviesRef]);

  // Event handlers
  const handleAddAction = useCallback(async () => {
    if (!searchQuery.trim()) return;

    if (currentUser) {
      setIsAdding(true);
      try {
        await addMovie(searchQuery.trim());
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" added to watchlist!`, type: 'success' });
      } catch {
        setToast({ message: 'Failed to add movie', type: 'error' });
      } finally {
        setIsAdding(false);
      }
    } else {
      setIsSuggesting(true);
      setSuggestionError(null);
      try {
        await addSuggestion(searchQuery.trim(), 'Anonymous');
        setSearchQuery('');
        setToast({ message: `"${searchQuery.trim()}" suggested for review!`, type: 'success' });
      } catch (_error) {
        setSuggestionError(_error instanceof Error ? _error.message : 'Failed to add suggestion');
        setToast({ message: 'Failed to add suggestion', type: 'error' });
      } finally {
        setIsSuggesting(false);
      }
    }
  }, [searchQuery, currentUser, addMovie, addSuggestion, setIsAdding, setSearchQuery, setToast]);

  const handleRandomMoviePick = useCallback(() => {
    const movieTitles = filteredMovies.map((movie) => movie.title);
    const suggestionTitles = filteredSuggestions.map((suggestion) => suggestion.title);
    const pool = Array.from(new Set([...movieTitles, ...suggestionTitles])).filter(Boolean);

    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomTitle = pool[randomIndex];

    if (randomTitle) {
      setSearchQuery(randomTitle);
    }
  }, [filteredMovies, filteredSuggestions, setSearchQuery]);

  const confirmDelete = useCallback(async () => {
    if (!movieToDelete) return;

    try {
      await deleteMovie(movieToDelete.id);
      setToast({ message: `"${movieToDelete.title}" removed!`, type: 'info' });
    } catch {
      setToast({ message: 'Failed to remove movie', type: 'error' });
    } finally {
      setMovieToDelete(null);
    }
  }, [movieToDelete, deleteMovie, setToast, setMovieToDelete]);

  // Render components
  const renderControls = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {activeTab && onTabChange && (
        <ThemeToggle
          activeTab={activeTab}
          onChange={onTabChange}
          compact={propIsMobile || isMobile}
        />
      )}
      <WatchlistTopControls
        contentTab={contentTab}
        setContentTab={setContentTab}
        sortMode={sortMode}
        setSortMode={setSortMode}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleAddAction}
        onPickRandom={handleRandomMoviePick}
        canSurprise={filteredMovies.length > 0 || filteredSuggestions.length > 0}
        isAdding={isAdding}
        isSuggesting={isSuggesting}
        suggestionError={suggestionError}
      />
    </div>
  );

  const renderContent = () => (
    <CollectionGrid
      className="watchlist-content"
      minColumnWidth={isMobile ? '150px' : '160px'}
      style={{
        animation: `fade-in ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      {isLoading ? (
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <div className="scanning-overlay" style={{ padding: spacing.xl }}>
            <div style={{ ...typography.presets.eyebrow, color: colors.accent, animation: 'pulse 1.5s infinite' }}>
              SCANNING GIST REPOSITORY...
            </div>
            <div className="scanning-bar" style={{ maxWidth: '300px', margin: '0 auto' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'inherit', gap: 'inherit' }}>
            {skeletonKeys.map((key) => <MovieCardSkeleton key={key} />)}
          </div>
        </div>
      ) : contentTab === 'suggestions' ? (
        filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={() => acceptSuggestion(suggestion.id, currentUser || 'Aaron')}
              onReject={() => rejectSuggestion(suggestion.id, currentUser || 'Aaron')}
              isProcessing={processingSuggestionId === suggestion.id}
              animationDelay={`${index * 0.05}s`}
            />
          ))
        ) : (
          <CollectionEmptyState
            padding={spacing['2xl']}
            style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
          >
            No pending suggestions
          </CollectionEmptyState>
        )
      ) : filteredMovies.length > 0 ? (
        filteredMovies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            currentUser={currentUser}
            onToggle={() => toggleWatched(movie.id)}
            onDelete={() => setMovieToDelete(movie)}
            onFixMatch={() => setMovieToFix(movie)}
            animationDelay={`${index * 0.05}s`}
          />
        )
      )) : (
        <CollectionEmptyState
          padding={spacing['2xl']}
          style={{ color: 'rgba(255,255,255,0.4)', ...typography.presets.bodySm }}
        >
          {searchQuery ? 'No matching movies found' : 'Your watchlist is empty'}
        </CollectionEmptyState>
      )}
    </CollectionGrid>
  );

  return (
    <div className="watchlist-container" style={{ position: 'relative' }}>
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      <WorkspacePanels
        isMobile={isMobile}
        first={renderControls()}
        second={renderContent()}
        firstAs="aside"
        secondAs="section"
        stickyFirst
        mobileGap={spacing.lg}
      />

      {movieToDelete && (
        <ConfirmDialog
          isOpen={!!movieToDelete}
          title="Remove Movie"
          message={`Are you sure you want to remove "${movieToDelete.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setMovieToDelete(null)}
          confirmText="Remove"
          variant="danger"
        />
      )}
    </div>
  );
};

export default memo(Watchlist);
