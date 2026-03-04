import React from 'react';
import Input from '../../ui/Input';
import Button from '../../ui/Button';

interface WatchlistSearchBarProps {
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
}

const WatchlistSearchBar: React.FC<WatchlistSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onAdd,
  isBusy,
  addLabel,
  topSuggestion,
  onEnterAction,
  onSelectSuggestion,
  suggestions,
  placeholder = 'Search titles…',
}) => {
  const showSuggestions = searchQuery.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="watchlist-search">
      <div className="watchlist-search__row">
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
          className="watchlist-search__input"
        />
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
        >
          + Add
        </Button>
      </div>

      {showSuggestions && (
        <ul className="watchlist-search__suggestions" role="listbox" aria-label="Search suggestions">
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

export default WatchlistSearchBar;
