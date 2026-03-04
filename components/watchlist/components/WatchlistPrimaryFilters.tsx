import React from 'react';
import { ContentTab } from '../types';

const FILTERS: { id: ContentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'to-watch', label: 'Queue' },
  { id: 'watched', label: 'Watched' },
  { id: 'suggestions', label: 'Suggestions' },
];

interface WatchlistPrimaryFiltersProps {
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  tabCounts: Record<ContentTab, number>;
}

const WatchlistPrimaryFilters: React.FC<WatchlistPrimaryFiltersProps> = ({
  contentTab,
  setContentTab,
  tabCounts,
}) => {
  return (
    <div className="watchlist-filters" role="tablist" aria-label="Movie status filters">
      {FILTERS.map((filter) => {
        const isActive = contentTab === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`watchlist-filters__btn${isActive ? ' is-active' : ''}`}
            onClick={() => setContentTab(filter.id)}
          >
            <span>{filter.label}</span>
            <span className="watchlist-filters__count">{tabCounts[filter.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
};

export default WatchlistPrimaryFilters;
