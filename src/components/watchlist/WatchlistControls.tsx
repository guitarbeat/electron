import React from 'react';
import { ContentTab, SortMode } from '@/types';
import Input from '@/ui/Input';
import Button from '@/ui/Button';
import { PlusIcon, SearchIcon } from '@/common/icons';
import { typography, spacing } from '@/design-system/tokens';

// Types
interface WatchlistControlsProps {
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

// Search Bar Component
const WatchlistSearchBar: React.FC<{
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAdd: () => void;
  isBusy: boolean;
  addLabel: string;
  topSuggestion?: string | null;
  onEnterAction: 'selectTopResult' | 'addExact';
  onSelectSuggestion?: (idOrTitle: string) => void;
  suggestions: string[];
  placeholder?: string;
}> = ({
  searchQuery,
  setSearchQuery,
  onAdd,
  isBusy,
  addLabel,
  topSuggestion,
  onEnterAction,
  onSelectSuggestion,
  suggestions,
  placeholder = 'Search titles...',
}) => {
  const showSuggestions = searchQuery.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="watchlist-search">
      <div className="watchlist-search__row">
        <div className="ui-control-input-shell watchlist-search__input-wrap">
          <SearchIcon className="ui-control-input-icon watchlist-search__input-icon" aria-hidden />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={placeholder}
            aria-label="Search movies"
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              if (onEnterAction === 'selectTopResult' && topSuggestion) {
                event.preventDefault();
                setSearchQuery(topSuggestion);
                onSelectSuggestion?.(topSuggestion);
              }
            }}
            className="ui-control-input watchlist-search__input"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAdd}
          disabled={isBusy || !searchQuery.trim()}
          isLoading={isBusy}
          loadingText=""
          className="watchlist-search__add"
          aria-label={addLabel}
          title={addLabel}
          style={{ fontFamily: typography.fontFamily.body.join(', ') }}
        >
          <span className="watchlist-search__add-content">
            <PlusIcon size={16} aria-hidden />
            <span>Add</span>
          </span>
        </Button>
      </div>

      {showSuggestions && (
        <ul
          className="watchlist-search__suggestions"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="watchlist-search__suggestion-btn"
                onClick={() => {
                  setSearchQuery(suggestion);
                  onSelectSuggestion?.(suggestion);
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Primary Filters Component
const WatchlistPrimaryFilters: React.FC<{
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  tabCounts: Record<ContentTab, number>;
}> = ({ contentTab, setContentTab, tabCounts }) => {
  const filters = [
    { id: 'all' as ContentTab, label: 'All' },
    { id: 'to-watch' as ContentTab, label: 'To Watch' },
    { id: 'watched' as ContentTab, label: 'Watched' },
    { id: 'suggestions' as ContentTab, label: 'Suggestions' },
  ];

  return (
    <div className="watchlist-filters" role="tablist">
      {filters.map((filter) => {
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
            <span className="watchlist-filters__count">{tabCounts[filter.id]}</span>
          </button>
        );
      })}
    </div>
  );
};

// More Menu Component
const WatchlistMoreMenu: React.FC<{
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  isMobile: boolean;
}> = ({ sortMode, setSortMode, isMobile }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const sortOptions = [
    { id: 'recent' as SortMode, label: 'Recent' },
    { id: 'title' as SortMode, label: 'Title' },
    { id: 'year' as SortMode, label: 'Year' },
  ];

  return (
    <div className="watchlist-more-menu">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="watchlist-more-menu__trigger"
        aria-label="More options"
        aria-expanded={isOpen}
      >
        ⋯
      </Button>
      
      {isOpen && (
        <div className="watchlist-more-menu__dropdown">
          <div className="watchlist-more-menu__section">
            <div className="watchlist-more-menu__label">Sort by</div>
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`watchlist-more-menu__option${
                  sortMode === option.id ? ' is-active' : ''
                }`}
                onClick={() => {
                  setSortMode(option.id);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Controls Component
const WatchlistControls: React.FC<WatchlistControlsProps> = ({
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
    <section
      className={`ui-control-surface watchlist-controls-pane${compact ? ' is-compact' : ''}`}
    >
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

export default WatchlistControls;
