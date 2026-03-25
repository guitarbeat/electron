import React from 'react';
import type { ContentTab, SortMode, User } from '@/shared/types';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import SubNav from '@/components/ui/SubNav';
import { motion } from '@/theme/tokens';
import { ShareIcon, PlusIcon, Spinner } from '@/common/icons';
import SurpriseButton from '@/common/SurpriseButton';
import RecommendationComposer from './RecommendationComposer';
import { MOVIE_TABS, SORT_OPTIONS } from './watchlistConstants';

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
        mode="segmented"
      />

      <div className="watchlist-top-controls__toolbar">
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
            <div className="watchlist-top-controls__search-actions">
              {currentUser ? (
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  disabled={isAdding || isSubmittingRecommendation || isSharing}
                  title="Add movie"
                  aria-label="Add movie"
                  className="watchlist-top-controls__search-button"
                  style={{ minWidth: '44px' }}
                >
                  {isAdding ? <Spinner /> : <PlusIcon />}
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

        <SurpriseButton
          onClick={onPickRandom}
          isBusy={isAdding || isSubmittingRecommendation}
          canSurprise={canSurprise}
          className="watchlist-top-controls__surprise"
          ariaLabel="Pick a random movie"
        />
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

      {suggestionError && !showRecommendationComposer && (
        <div className="places-top-controls__error" role="alert">
          {suggestionError}
        </div>
      )}
    </section>
  );
};

export default WatchlistTopControls;
