import React from 'react';
import { ContentTab, SortMode } from '../types';
import WatchlistSearchBar from './WatchlistSearchBar';
import WatchlistPrimaryFilters from './WatchlistPrimaryFilters';
import WatchlistMoreMenu from './WatchlistMoreMenu';

interface WatchlistControlsPaneProps {
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  tabCounts: Record<ContentTab, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAdd: () => void;
  isBusy: boolean;
  addLabel: string;
  topSuggestion?: string | null;
  onEnterAction: 'selectTopResult' | 'addExact';
  onSelectSuggestion?: (idOrTitle: string) => void;
  suggestions: string[];
  isMobile: boolean;
  compact?: boolean;
}

const WatchlistControlsPane: React.FC<WatchlistControlsPaneProps> = ({
  contentTab,
  setContentTab,
  sortMode,
  setSortMode,
  tabCounts,
  searchQuery,
  setSearchQuery,
  onAdd,
  isBusy,
  addLabel,
  topSuggestion,
  onEnterAction,
  onSelectSuggestion,
  suggestions,
  isMobile,
  compact = false,
}) => {
  return (
    <section className={`ui-control-surface watchlist-controls-pane${compact ? ' is-compact' : ''}`}>
      <div className="ui-control-surface__top watchlist-controls-pane__top">
        <WatchlistSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAdd={onAdd}
          isBusy={isBusy}
          addLabel={addLabel}
          topSuggestion={topSuggestion}
          onEnterAction={onEnterAction}
          onSelectSuggestion={onSelectSuggestion}
          suggestions={suggestions}
          placeholder="Search or plan your next movie night..."
        />
        <WatchlistMoreMenu sortMode={sortMode} setSortMode={setSortMode} isMobile={isMobile} />
      </div>

      <WatchlistPrimaryFilters
        contentTab={contentTab}
        setContentTab={setContentTab}
        tabCounts={tabCounts}
      />
    </section>
  );
};

export default WatchlistControlsPane;
