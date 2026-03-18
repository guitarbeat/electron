import React from 'react';
import { PlusIcon, Spinner } from '@/common/icons';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import SubNav from '@/ui/SubNav';
import { ContentTab, SortMode } from '@/types';

const MOVIE_TABS: { id: ContentTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎬' },
  { id: 'to-watch', label: 'Queue', icon: '📋' },
  { id: 'watched', label: 'Watched', icon: '✅' },
  { id: 'suggestions', label: 'Suggestions', icon: '💡' },
];

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'A–Z' },
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
    <div className="watchlist-top-controls">
      <div className="watchlist-top-controls__row">
        <div className="watchlist-top-controls__filters">
          <SubNav
            ariaLabel="Movies: filter and sort"
            scrollClassName="watchlist-tabs-scroll"
            tabs={MOVIE_TABS.map((tab) => ({
              id: tab.id,
              label: tab.label,
              icon: tab.icon,
              count: tabCounts[tab.id] ?? 0,
            }))}
            activeId={contentTab}
            onSelect={(id) => setContentTab(id as ContentTab)}
            chips={SORT_OPTIONS}
            activeChipId={sortMode}
            onChipSelect={(id) => setSortMode(id as SortMode)}
            chipLabel="Sort by"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="watchlist-top-controls__surprise"
          onClick={onPickRandom}
          disabled={isAdding || isSuggesting || !canSurprise}
          title="Surprise me"
          aria-label="Pick a random movie"
        >
          🎲
        </Button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          className="watchlist-top-controls__search-form"
        >
          <div className="watchlist-top-controls__search-shell">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search or add a movie…"
              aria-label="Search or add a movie"
              className="watchlist-top-controls__search-field"
            />
          </div>
          {searchQuery.trim() ? (
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              className="watchlist-top-controls__search-button"
              disabled={isAdding || isSuggesting}
              isLoading={isAdding || isSuggesting}
              title="Add or suggest movie"
              aria-label="Add or suggest movie"
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          ) : (
            <div className="watchlist-top-controls__search-empty" aria-hidden>
              <PlusIcon style={{ width: 20, height: 20 }} />
            </div>
          )}
        </form>
      </div>

      {suggestionError && (
        <div className="watchlist-top-controls__suggestion-error">
          {suggestionError}
        </div>
      )}
    </div>
  );
};

export default WatchlistTopControls;
