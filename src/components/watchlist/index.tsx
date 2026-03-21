import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  buildSharedSuggestionUrl,
  clearCurrentSharedSuggestionParams,
  parseSharedSuggestionIntent,
  type SharedSuggestionIntent,
} from '@/app/sharedSuggestion';
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
import { Input, Textarea } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import SyncBanner from '@/components/ui/SyncBanner';
import MemoryList from '@/memories/MemoryList';
import MemoryComposer from '@/memories/MemoryComposer';
import SharedSuggestionPrompt from './SharedSuggestionPrompt';
import {
  CheckIcon,
  CrossIcon,
  EyeIcon,
  EyeOffIcon,
  ShareIcon,
  TrashIcon,
} from '@/common/icons';
import { colors, motion, radius, spacing, typography } from '@/design-system';
import { trackMetric } from '@/services/analyticsService';

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

const MAX_MOVIE_NOTE_LENGTH = 280;
const MAX_RECOMMENDATION_REASON_LENGTH = 280;

const normalizeMovieTitle = (title: string): string => title.trim().toLowerCase();

const copyTextToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallbackField = document.createElement('textarea');
  fallbackField.value = value;
  fallbackField.setAttribute('readonly', 'true');
  fallbackField.style.position = 'fixed';
  fallbackField.style.opacity = '0';
  fallbackField.style.pointerEvents = 'none';

  document.body.appendChild(fallbackField);
  fallbackField.focus();
  fallbackField.select();

  const didCopy = document.execCommand('copy');
  document.body.removeChild(fallbackField);

  if (!didCopy) {
    throw new Error('Clipboard unavailable');
  }
};

const shareSuggestionLink = async (
  title: string,
  suggestedBy: string,
  url: string
): Promise<'native' | 'copy'> => {
  const shareData = {
    title: `Movie night pick: ${title}`,
    text:
      suggestedBy === 'Someone'
        ? `Save "${title}" into the watchlist suggestions.`
        : `${suggestedBy} wants to save "${title}" into the watchlist.`,
    url,
  };

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(shareData);
      return 'native';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  await copyTextToClipboard(url);
  return 'copy';
};

interface RecommendationComposerProps {
  currentUser: User | null;
  movieTitle: string;
  guestName: string;
  reason: string;
  error: string | null;
  isSubmitting: boolean;
  onGuestNameChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
}

const RecommendationComposer: React.FC<RecommendationComposerProps> = ({
  currentUser,
  movieTitle,
  guestName,
  reason,
  error,
  isSubmitting,
  onGuestNameChange,
  onReasonChange,
  onSubmit,
  onCancel,
}) => {
  const remainingChars = MAX_RECOMMENDATION_REASON_LENGTH - reason.length;

  return (
    <Card
      variant="default"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.borderSecondary}`,
        background:
          'radial-gradient(circle at top right, rgba(255, 127, 198, 0.18), transparent 54%), linear-gradient(180deg, rgba(26, 18, 43, 0.94), rgba(11, 18, 34, 0.96))',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <p style={{ margin: 0, ...typography.presets.eyebrow, color: colors.accentLight }}>
          Recommendation
        </p>
        <h3
          style={{
            margin: 0,
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.heading.join(', '),
            fontSize: typography.fontSize.lg,
            lineHeight: typography.lineHeight.snug,
          }}
        >
          {movieTitle}
        </h3>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {currentUser
            ? `Send this to Suggestions as ${currentUser}.`
            : 'Add a name if you want the duo to know who pitched it.'}
        </p>
      </div>

      {!currentUser && (
        <Input
          label="Your Name"
          value={guestName}
          onChange={(event) => onGuestNameChange(event.target.value)}
          placeholder="Anonymous"
          maxLength={50}
        />
      )}

      <Textarea
        label="Why This One? (Optional)"
        value={reason}
        onChange={(event) =>
          onReasonChange(event.target.value.slice(0, MAX_RECOMMENDATION_REASON_LENGTH))
        }
        placeholder="A quick reason, vibe, or inside joke."
        maxLength={MAX_RECOMMENDATION_REASON_LENGTH}
        rows={3}
        style={{ minHeight: '88px' }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSize.xs,
          }}
        >
          {remainingChars} characters left
        </span>

        <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => void onSubmit()} isLoading={isSubmitting}>
            Send recommendation
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            color: colors.error,
            fontSize: typography.fontSize.xs,
            background: `${colors.error}10`,
            border: `1px solid ${colors.error}30`,
            borderRadius: radius.md,
            padding: `${spacing.xs} ${spacing.sm}`,
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
};

interface WatchlistTopControlsProps {
  currentUser: User | null;
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  tabCounts: Record<ContentTab, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onRecommend: () => void;
  onSubmitRecommendation: () => Promise<void> | void;
  onCancelRecommendation: () => void;
  recommendationGuestName: string;
  setRecommendationGuestName: (value: string) => void;
  recommendationReason: string;
  setRecommendationReason: (value: string) => void;
  showRecommendationComposer: boolean;
  onPickRandom: () => void;
  canSurprise: boolean;
  isAdding: boolean;
  isSubmittingRecommendation: boolean;
  isSharing: boolean;
  suggestionError: string | null;
  memoryCount: number;
  memoryMovieCount: number;
  canRecommend: boolean;
  onShare: () => Promise<void> | void;
}

const WatchlistTopControls: React.FC<WatchlistTopControlsProps> = ({
  currentUser,
  contentTab,
  setContentTab,
  sortMode,
  setSortMode,
  tabCounts,
  searchQuery,
  setSearchQuery,
  onSubmit,
  onRecommend,
  onSubmitRecommendation,
  onCancelRecommendation,
  recommendationGuestName,
  setRecommendationGuestName,
  recommendationReason,
  setRecommendationReason,
  showRecommendationComposer,
  onPickRandom,
  canSurprise,
  isAdding,
  isSubmittingRecommendation,
  isSharing,
  suggestionError,
  memoryCount,
  memoryMovieCount,
  canRecommend,
  onShare,
}) => {
  const hasSearchQuery = Boolean(searchQuery.trim());

  return (
    <section
      className="workspace-control-panel ui-control-surface watchlist-top-controls"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <div className="workspace-control-panel__header">
        <p className="workspace-control-panel__eyebrow">Movies</p>
        <h2 className="workspace-control-panel__title">Plan the next movie</h2>
      </div>

      <div className="workspace-control-panel__meta" aria-label="Watchlist overview">
        <span className="workspace-control-panel__pill">{tabCounts.queue} queued</span>
        <span className="workspace-control-panel__pill">
          {memoryCount} note{memoryCount === 1 ? '' : 's'} on {memoryMovieCount} title{memoryMovieCount === 1 ? '' : 's'}
        </span>
      </div>

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
        className="watchlist-top-controls__toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
        }}
      >
        <form
          className="watchlist-top-controls__search-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          style={{
            flex: 1,
            display: 'flex',
            gap: spacing.xs,
            alignItems: 'stretch',
            flexWrap: 'wrap',
          }}
        >
          <div className="watchlist-top-controls__search-shell" style={{ flex: '1 1 220px', minWidth: 0 }}>
            <Input
              className="watchlist-top-controls__search-field"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Movie title"
              aria-label="Movie title"
              fullWidth
            />
          </div>
          {hasSearchQuery && (
            <div
              className="watchlist-top-controls__search-actions"
              style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}
            >
              {currentUser ? (
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  disabled={isAdding || isSubmittingRecommendation || isSharing}
                  isLoading={isAdding}
                  title="Add movie"
                  aria-label="Add movie"
                >
                  Add
                </Button>
              ) : null}
              <Button
                type="button"
                variant={currentUser ? 'ghost' : 'secondary'}
                size="sm"
                onClick={onRecommend}
                disabled={isAdding || isSubmittingRecommendation || isSharing || !canRecommend}
                title="Recommend movie"
                aria-label="Recommend movie"
              >
                {canRecommend ? 'Recommend' : 'Pick a profile'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void onShare()}
                disabled={isAdding || isSubmittingRecommendation || isSharing}
                isLoading={isSharing}
                title="Share movie suggestion link"
                aria-label="Share movie suggestion link"
                className="watchlist-top-controls__share-button"
              >
                <ShareIcon size={14} /> Share
              </Button>
            </div>
          )}
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={onPickRandom}
          disabled={isAdding || isSubmittingRecommendation || !canSurprise}
          title="Surprise me"
          aria-label="Pick a random movie"
          className="watchlist-top-controls__surprise"
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

      {showRecommendationComposer && hasSearchQuery && (
        <RecommendationComposer
          currentUser={currentUser}
          movieTitle={searchQuery.trim()}
          guestName={recommendationGuestName}
          reason={recommendationReason}
          error={suggestionError}
          isSubmitting={isSubmittingRecommendation}
          onGuestNameChange={setRecommendationGuestName}
          onReasonChange={setRecommendationReason}
          onSubmit={onSubmitRecommendation}
          onCancel={onCancelRecommendation}
        />
      )}
    </section>
  );
};

interface SuggestionCardProps {
  suggestion: MovieSuggestion;
  onAccept: () => void;
  onReject: () => void;
  canRespond?: boolean;
  disableActions?: boolean;
  isProcessing?: boolean;
  animationDelay?: string;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onReject,
  canRespond = true,
  disableActions = false,
  isProcessing = false,
  animationDelay = '0s',
}) => {
  const actionsDisabled = isProcessing || disableActions;

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
          disabled={actionsDisabled}
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
          disabled={actionsDisabled}
          fullWidth
          style={{ gap: spacing.xs, color: colors.error }}
        >
          <CrossIcon style={{ width: 14, height: 14 }} />
          Reject
        </Button>
      </div>

      {!canRespond && (
        <p
          style={{
            margin: 0,
            ...typography.presets.caption,
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          Pick a profile to review suggestions.
        </p>
      )}

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
  animationDelay,
  memories = [],
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  isHighlighted = false,
}) => {
  const [showMemories, setShowMemories] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const isMobile = useMediaQuery(mediaBreakpoints.sm);
  const isGuest = !currentUser;

  const watchedByCurrentUser = currentUser ? movie.watchedBy.includes(currentUser) : false;
  const watchedByBoth = movie.watchedBy.length === 2;
  const hasSharedMemories = memories.length > 0;
  const canOpenNotes = hasSharedMemories || Boolean(currentUser);
  const memoryCountText = `${memories.length} note${memories.length === 1 ? '' : 's'}`;

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
        data-movie-id={movie.id}
        style={{
          padding: 0,
          marginBottom: 0,
          animationDelay,
          borderColor: watchedByBoth ? colors.accent : colors.border,
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

            {canOpenNotes && (
              <button
                type="button"
                onClick={handleToggleMemories}
                className="movie-item-memory-toggle"
                aria-label={
                  hasSharedMemories
                    ? `View notes for "${movie.title}"`
                    : `Add note to "${movie.title}"`
                }
              >
                {hasSharedMemories ? memoryCountText : 'Add note'}
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
}) => {
  const isGuest = !currentUser;
  const primaryActionLabel = watchedByCurrentUser ? 'Unwatch' : 'Mark watched';
  const primaryActionLabelShort = watchedByCurrentUser ? 'Unwatch' : 'Watch';

  const stopActionPropagation = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePrimaryAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    executeAction(onToggle);
  };

  const handleDeleteAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopActionPropagation(event);
    executeAction(onDelete);
  };

  const primaryActionVisualStyle: React.CSSProperties = watchedByCurrentUser
    ? {
        color: '#f2fff3',
        background:
          'radial-gradient(circle at 20% 0%, rgba(126, 224, 140, 0.24) 0%, transparent 58%), linear-gradient(180deg, rgba(34, 106, 50, 0.92) 0%, rgba(18, 56, 30, 0.95) 100%)',
        border: '1px solid color-mix(in srgb, var(--color-success) 46%, transparent)',
        boxShadow:
          '0 10px 20px rgba(0, 0, 0, 0.32), 0 0 18px rgba(126, 224, 140, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.07)',
      }
    : {
        color: '#f5f9ff',
        background:
          'radial-gradient(circle at 20% 0%, rgba(179, 232, 255, 0.22) 0%, transparent 55%), linear-gradient(180deg, rgba(12, 22, 40, 0.92) 0%, rgba(8, 14, 24, 0.94) 100%)',
        border: '1px solid rgba(173, 210, 255, 0.56)',
        boxShadow:
          '0 10px 20px rgba(0, 0, 0, 0.32), 0 0 18px rgba(149, 220, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
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
        ...primaryActionVisualStyle,
        opacity: isGuest ? 0.5 : 1,
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

  return (
    <div className={`movie-actions${isMobile ? ' movie-actions--touch' : ''}`}>
      {primaryButton}

      <div className="movie-secondary-actions">
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
  const [draftNote, setDraftNote] = React.useState('');
  const noteInputRef = React.useRef<HTMLTextAreaElement>(null);
  const remainingChars = MAX_MOVIE_NOTE_LENGTH - draftNote.length;
  const canSubmitNote = !isSubmittingMemory && draftNote.trim().length > 0 && remainingChars >= 0;

  const handleMemorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddMemory) return;
    const trimmedNote = draftNote.trim();
    if (!trimmedNote) return;

    setIsSubmittingMemory(true);
    try {
      await onAddMemory(trimmedNote);
      setDraftNote('');
      noteInputRef.current?.focus();
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
        borderRadius: '0 0 16px 16px',
        background:
          'linear-gradient(180deg, rgba(39, 24, 44, 0.94) 0%, rgba(23, 26, 46, 0.95) 36%, rgba(22, 37, 55, 0.96) 100%)',
        border: '1px solid rgba(255, 182, 214, 0.22)',
        borderTop: 'none',
        borderLeft: '3px solid rgba(255, 184, 146, 0.38)',
        boxShadow: '0 18px 34px rgba(6, 11, 24, 0.24)',
      }}
    >
      <div
        style={{
          marginBottom: spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}
      >
        <p
          style={{
            margin: 0,
            ...typography.presets.eyebrow,
            color: '#ffbed7',
          }}
        >
          Notes on this movie
        </p>
        <h4
          style={{
            margin: 0,
            color: '#fff3f7',
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          {movie.title}
        </h4>
        <p
          style={{
            margin: 0,
            color: '#d8e6ff',
            fontSize: typography.fontSize.sm,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          Quotes, reactions, and tiny thoughts worth keeping with this one.
        </p>
      </div>

      {currentUser && onAddMemory && (
        <div style={{ marginBottom: spacing.md }}>
          <MemoryComposer
            watchedMovieOptions={[movie]}
            selectedMovieId={movie.id}
            onSelectedMovieIdChange={() => {}}
            currentUser={currentUser}
            onSubmit={handleMemorySubmit}
            isSubmitting={isSubmittingMemory}
            canSubmit={canSubmitNote}
            isMobile={isMobile}
            note={draftNote}
            onNoteChange={(nextNote) => setDraftNote(nextNote.slice(0, MAX_MOVIE_NOTE_LENGTH))}
            isComposerOpen
            onComposerToggle={() => {}}
            remainingChars={remainingChars}
            error={null}
            successMessage={null}
            noteInputRef={noteInputRef}
          />
        </div>
      )}

      {memories.length > 0 ? (
        <MemoryList
          memories={memories}
          visibleMemories={memories}
          sortedMemories={memories}
          contextMovieTitle={movie.title}
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
          No notes on this movie yet. Leave the first one above.
        </p>
      )}
    </div>
  );
};

const Watchlist: React.FC<WatchlistProps> = ({ isPaused = false }) => {
  const { currentUser } = useUser();
  const [sharedSuggestion, setSharedSuggestion] = useState<SharedSuggestionIntent | null>(() =>
    typeof window === 'undefined' ? null : parseSharedSuggestionIntent(window.location.search)
  );
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingSharedSuggestion, setIsSavingSharedSuggestion] = useState(false);

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
    isSubmittingRecommendation,
    contentTab,
    setContentTab,
    sortMode,
    setSortMode,
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
    pendingSuggestions,
    submitRecommendation,
    acceptSuggestionToWatchlist,
    rejectPendingSuggestion,
    memories,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
    isWatchlistDegraded,
    isWatchlistSyncBlocked,
    retryWatchlistSync,
    filteredMovies,
    filteredSuggestions,
    tabCounts,
  } = useWatchlist({ currentUser, isPaused });

  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isRecommendationComposerOpen, setIsRecommendationComposerOpen] = useState(false);
  const [recommendationGuestName, setRecommendationGuestName] = useState('');
  const [recommendationReason, setRecommendationReason] = useState('');
  
  const skeletonKeys = isMobile
    ? ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4']
    : ['desktop-1', 'desktop-2', 'desktop-3', 'desktop-4', 'desktop-5', 'desktop-6', 'desktop-7', 'desktop-8'];

  const movieMemories = React.useMemo(() => {
    const memoriesByMovieId = new Map<string, SharedMemory[]>();

    movies.forEach((movie) => {
      const normalizedTitle = movie.title.trim().toLowerCase();
      const relatedMemories = memories.filter((memory) => {
        if (memory.movieId === movie.id) {
          return true;
        }

        return !memory.movieId && memory.movieTitle.trim().toLowerCase() === normalizedTitle;
      });

      if (relatedMemories.length > 0) {
        memoriesByMovieId.set(movie.id, relatedMemories);
      }
    });

    return memoriesByMovieId;
  }, [memories, movies]);

  const isSharedSuggestionAlreadySaved = React.useMemo(() => {
    if (!sharedSuggestion) {
      return false;
    }

    const normalizedTitle = normalizeMovieTitle(sharedSuggestion.title);

    return (
      movies.some((movie) => normalizeMovieTitle(movie.title) === normalizedTitle) ||
      pendingSuggestions.some((suggestion) => normalizeMovieTitle(suggestion.title) === normalizedTitle)
    );
  }, [movies, pendingSuggestions, sharedSuggestion]);

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

  const resetRecommendationComposer = useCallback(() => {
    setIsRecommendationComposerOpen(false);
    setRecommendationGuestName('');
    setRecommendationReason('');
    setSuggestionError(null);
  }, []);

  const handleRecommendationGuestNameChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationGuestName(value);
  }, []);

  const handleRecommendationReasonChange = useCallback((value: string) => {
    setSuggestionError(null);
    setRecommendationReason(value);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncSharedSuggestion = () => {
      setSharedSuggestion(parseSharedSuggestionIntent(window.location.search));
    };

    window.addEventListener('popstate', syncSharedSuggestion);
    return () => window.removeEventListener('popstate', syncSharedSuggestion);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      resetRecommendationComposer();
    }
  }, [resetRecommendationComposer, searchQuery]);

  // Event handlers
  const openRecommendationComposer = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add to shared suggestions.',
        type: 'info',
      });
      return;
    }

    setSuggestionError(null);
    setIsRecommendationComposerOpen(true);
  }, [currentUser, searchQuery, setToast]);

  const handleAddAction = useCallback(async () => {
    const title = searchQuery.trim();
    if (!title) return;

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add movies to the shared watchlist.',
        type: 'info',
      });
      return;
    }

    setIsAdding(true);
    try {
      await addMovie(title);
      setSearchQuery('');
      setToast({ message: `"${title}" added to watchlist!`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to add movie', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [searchQuery, currentUser, addMovie, setIsAdding, setSearchQuery, setToast]);

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

  const handleSubmitRecommendation = useCallback(async () => {
    const title = searchQuery.trim();
    if (!title) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to add to shared suggestions.',
        type: 'info',
      });
      return;
    }

    setSuggestionError(null);

    try {
      await submitRecommendation({
        title,
        suggestedBy: recommendationGuestName,
        reason: recommendationReason,
      });
      resetRecommendationComposer();
      setToast({ message: `"${title}" suggested for review!`, type: 'success' });
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Failed to add suggestion');
      setToast({ message: 'Failed to add suggestion', type: 'error' });
    }
  }, [
    recommendationGuestName,
    recommendationReason,
    currentUser,
    resetRecommendationComposer,
    searchQuery,
    setToast,
    submitRecommendation,
  ]);

  const dismissSharedSuggestion = useCallback(() => {
    clearCurrentSharedSuggestionParams();
    setSharedSuggestion(null);
  }, []);

  const handleShareAction = useCallback(async () => {
    const title = searchQuery.trim();

    if (!title || typeof window === 'undefined') {
      return;
    }

    setIsSharing(true);

    try {
      const shareUrl = buildSharedSuggestionUrl(window.location.href, {
        title,
        suggestedBy: currentUser ?? 'Someone',
      });
      const shareMethod = await shareSuggestionLink(title, currentUser ?? 'Someone', shareUrl);

      trackMetric('watchlist_share_clicked');
      setToast({
        message:
          shareMethod === 'native'
            ? `Share sheet opened for "${title}".`
            : `Share link copied for "${title}".`,
        type: 'success',
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setToast({ message: 'Failed to share movie link', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  }, [currentUser, searchQuery, setToast]);

  const handleSaveSharedSuggestion = useCallback(async () => {
    if (!sharedSuggestion) {
      return;
    }

    if (!currentUser) {
      setToast({
        message: 'Pick Aaron or Electra to save shared suggestions.',
        type: 'info',
      });
      return;
    }

    if (isSharedSuggestionAlreadySaved) {
      setToast({
        message: `"${sharedSuggestion.title}" is already in your watchlist flow.`,
        type: 'info',
      });
      dismissSharedSuggestion();
      return;
    }

    setIsSavingSharedSuggestion(true);
    setSuggestionError(null);

    try {
      await submitRecommendation({
        title: sharedSuggestion.title,
        suggestedBy: sharedSuggestion.suggestedBy,
        preserveSuggestedBy: true,
      });
      trackMetric('shared_suggestion_saved');
      setSearchQuery(sharedSuggestion.title);
      resetRecommendationComposer();
      setToast({
        message: `"${sharedSuggestion.title}" saved to suggestions.`,
        type: 'success',
      });
      dismissSharedSuggestion();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to save shared suggestion',
        type: 'error',
      });
    } finally {
      setIsSavingSharedSuggestion(false);
    }
  }, [
    dismissSharedSuggestion,
    currentUser,
    isSharedSuggestionAlreadySaved,
    resetRecommendationComposer,
    setSearchQuery,
    setToast,
    sharedSuggestion,
    submitRecommendation,
  ]);

  const handleAcceptSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      try {
        await acceptSuggestionToWatchlist(suggestion.id);
        setToast({ message: `"${suggestion.title}" added to watchlist!`, type: 'success' });
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to accept suggestion',
          type: 'error',
        });
      }
    },
    [acceptSuggestionToWatchlist, setToast]
  );

  const handleRejectSuggestion = useCallback(
    async (suggestion: MovieSuggestion) => {
      try {
        await rejectPendingSuggestion(suggestion.id);
        setToast({ message: `"${suggestion.title}" rejected.`, type: 'info' });
      } catch (error) {
        setToast({
          message: error instanceof Error ? error.message : 'Failed to reject suggestion',
          type: 'error',
        });
      }
    },
    [rejectPendingSuggestion, setToast]
  );

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
      {isWatchlistDegraded && (
        <SyncBanner
          isBlocked={isWatchlistSyncBlocked}
          onRetry={() => void retryWatchlistSync()}
          label={
            isWatchlistSyncBlocked
              ? 'A shared watchlist change conflicted with local edits. Refresh and retry.'
              : 'Watchlist changes are being kept locally until shared sync recovers.'
          }
        />
      )}
      {sharedSuggestion && (
        <SharedSuggestionPrompt
          intent={sharedSuggestion}
          isSaving={isSavingSharedSuggestion}
          isAlreadySaved={isSharedSuggestionAlreadySaved}
          canSave={Boolean(currentUser)}
          onSave={() => void handleSaveSharedSuggestion()}
          onDismiss={dismissSharedSuggestion}
        />
      )}
      <WatchlistTopControls
        currentUser={currentUser}
        contentTab={contentTab}
        setContentTab={setContentTab}
        sortMode={sortMode}
        setSortMode={setSortMode}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleAddAction}
        onRecommend={openRecommendationComposer}
        onSubmitRecommendation={handleSubmitRecommendation}
        onCancelRecommendation={resetRecommendationComposer}
        recommendationGuestName={recommendationGuestName}
        setRecommendationGuestName={handleRecommendationGuestNameChange}
        recommendationReason={recommendationReason}
        setRecommendationReason={handleRecommendationReasonChange}
        showRecommendationComposer={isRecommendationComposerOpen}
        onPickRandom={handleRandomMoviePick}
        canSurprise={filteredMovies.length > 0 || filteredSuggestions.length > 0}
        isAdding={isAdding}
        isSubmittingRecommendation={isSubmittingRecommendation}
        isSharing={isSharing}
        suggestionError={suggestionError}
        memoryCount={memories.length}
        memoryMovieCount={movieMemories.size}
        canRecommend={Boolean(currentUser)}
        onShare={handleShareAction}
      />
    </div>
  );

  const renderContent = () => (
    <CollectionGrid
      className="watchlist-content"
      minColumnWidth="clamp(10.5rem, 24vw, 13rem)"
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
              onAccept={() => void handleAcceptSuggestion(suggestion)}
              onReject={() => void handleRejectSuggestion(suggestion)}
              canRespond={Boolean(currentUser)}
              disableActions={Boolean(processingSuggestionId) || !currentUser}
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
            animationDelay={`${index * 0.05}s`}
            memories={movieMemories.get(movie.id) ?? []}
            onAddMemory={
              currentUser
                ? async (note) => {
                    await addMemory(movie.id, movie.title, currentUser, note);
                  }
                : undefined
            }
            onUpdateMemory={async (memoryId, note) => {
              await updateMemory(memoryId, { note });
            }}
            onDeleteMemory={async (memoryId) => {
              await deleteMemoryRecord(memoryId);
            }}
            onTogglePin={async (memoryId) => {
              await toggleMemoryPin(memoryId);
            }}
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
        first={renderControls()}
        second={renderContent()}
        firstAs="aside"
        secondAs="section"
        stickyFirst
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
