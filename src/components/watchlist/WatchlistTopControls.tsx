import React from 'react';
import type { User } from '@/shared/types';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { motion } from '@/theme/tokens';
import { PlusIcon, Spinner } from '@/common/icons';
import RecommendationComposer from './RecommendationComposer';

interface WatchlistTopControlsProps {
  currentUser: User | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onRecommend: () => void;
  onSubmitRecommendation: () => Promise<void> | void;
  onCancelRecommendation: () => void;
  recommendationReason: string;
  setRecommendationReason: (value: string) => void;
  showRecommendationComposer: boolean;
  isAdding: boolean;
  isSubmittingRecommendation: boolean;
  suggestionError: string | null;
  canRecommend: boolean;
}

const WatchlistTopControls: React.FC<WatchlistTopControlsProps> = ({
  currentUser,
  searchQuery,
  setSearchQuery,
  onSubmit,
  onRecommend,
  onSubmitRecommendation,
  onCancelRecommendation,
  recommendationReason,
  setRecommendationReason,
  showRecommendationComposer,
  isAdding,
  isSubmittingRecommendation,
  suggestionError,
  canRecommend,
}) => {
  const hasSearchQuery = Boolean(searchQuery.trim());
  const isBusy = isAdding || isSubmittingRecommendation;

  return (
    <section
      className="workspace-control-panel ui-control-surface watchlist-top-controls"
      style={{
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
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
              placeholder="Add a movie title"
              aria-label="Movie title"
              fullWidth
            />
          </div>
          {hasSearchQuery && currentUser && (
            <div className="watchlist-top-controls__search-actions">
              <Button
                type="submit"
                variant="secondary"
                size="md"
                disabled={isBusy}
                title="Add movie"
                aria-label="Add movie"
                className="watchlist-top-controls__search-button"
                style={{ minWidth: '44px' }}
              >
                {isAdding ? <Spinner /> : <PlusIcon />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onRecommend}
                disabled={isBusy || !canRecommend}
                title="Recommend movie"
                aria-label="Recommend movie"
              >
                Recommend
              </Button>
            </div>
          )}
        </form>
      </div>

      {showRecommendationComposer && hasSearchQuery && (
        <RecommendationComposer
          currentUser={currentUser}
          movieTitle={searchQuery.trim()}
          reason={recommendationReason}
          error={suggestionError}
          isSubmitting={isSubmittingRecommendation}
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
