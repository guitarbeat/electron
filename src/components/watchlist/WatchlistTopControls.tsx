import React from 'react';
import type { ContentTab, SortMode, User } from '@/shared/types';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import { motion, spacing } from '@/theme/tokens';
import { ShareIcon } from '@/common/icons';
import { MOVIE_TABS, SORT_OPTIONS } from './watchlistConstants';
import RecommendationComposer from './RecommendationComposer';

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
  canRecommend,
  onShare,
}) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const helperTextId = 'watchlist-controls-helper';
  const unwatchedCount = tabCounts.queue ?? 0;
  const watchedCount = tabCounts.watched ?? 0;
  const suggestionCount = tabCounts.suggestions ?? 0;
  const helperText = hasSearchQuery
    ? currentUser
      ? 'Add this title to the shared watchlist, recommend it with a note, or share a quick suggestion link.'
      : 'Pick Aaron or Electra to add this title directly, or recommend it without choosing a profile yet.'
    : canSurprise
      ? 'Surprise me picks from the movies and suggestions currently visible in this view.'
      : 'Start by typing a movie title. Once something is saved here, Surprise me will pick from it.';

  return (
    <section
      className="workspace-control-panel ui-control-surface watchlist-top-controls"
      style={{
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <div className="workspace-control-panel__header">
        <h2 className="workspace-control-panel__title">Plan next pick</h2>
      </div>

      <div className="workspace-control-panel__meta" aria-label="Watchlist overview">
        <span className="workspace-control-panel__pill">{unwatchedCount} unwatched</span>
        <span className="workspace-control-panel__pill">{watchedCount} watched</span>
        <span className="workspace-control-panel__pill">{suggestionCount} suggestions</span>
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
        mode="segmented"
      />

      <div
        className="watchlist-top-controls__toolbar"
      >
        <form
          className="watchlist-top-controls__search-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className="watchlist-top-controls__search-shell">
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
            >
              {currentUser ? (
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  disabled={isAdding || isSubmittingRecommendation || isSharing}
                  isLoading={isAdding}
                  title="Add movie"
                  aria-label="Add movie"
                  className="watchlist-top-controls__search-button"
                >
                  Add
                </Button>
              ) : null}
              {currentUser ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onRecommend}
                  disabled={isAdding || isSubmittingRecommendation || isSharing || !canRecommend}
                  title="Recommend movie"
                  aria-label="Recommend movie"
                >
                  Recommend
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="md"
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
          aria-describedby={helperTextId}
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

      <p id={helperTextId} className="watchlist-top-controls__helper" aria-live="polite">
        {helperText}
      </p>

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

export default WatchlistTopControls;
