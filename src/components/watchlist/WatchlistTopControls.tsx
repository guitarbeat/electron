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
            minWidth: 0,
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
                  className="watchlist-top-controls__search-button"
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

export default WatchlistTopControls;
