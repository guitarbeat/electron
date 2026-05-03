import React, { useRef } from 'react';
import { Input } from '@/ui/FormFields';
import { PlusIcon, Spinner } from '@/common/Icons';
import type { PlaceSuggestion } from '@/shared/types';

interface PlacesTopControlsProps {
  queueCount: number;
  visitedCount: number;
  pinnedCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  suggestionAutocompleteResults?: PlaceSuggestion[];
  onSubmit: () => Promise<void> | void;
  onSuggest?: () => Promise<void> | void;
  isAdding: boolean;
  isSuggesting?: boolean;
  suggestionError: string | null;
  canEdit: boolean;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  searchQuery,
  setSearchQuery,
  suggestionAutocompleteResults = [],
  onSubmit,
  onSuggest,
  isAdding,
  isSuggesting,
  suggestionError,
  canEdit,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isAdding || Boolean(isSuggesting);
  const hasQuery = searchQuery.trim().length > 0;
  const autocompleteSuggestions = suggestionAutocompleteResults.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const showAddAction = hasQuery && canEdit;
  const showSuggestAction = hasQuery && Boolean(onSuggest);

  return (
    <section className="workspace-control-panel watchlist-top-controls">
      <div className="watchlist-top-controls__stage">
        <form
          className="watchlist-top-controls__search-form"
          onSubmit={(e) => {
            e.preventDefault();
            inputRef.current?.blur();
            if (!canEdit && onSuggest) {
              void onSuggest();
              return;
            }
            void onSubmit();
          }}
        >
          <div className="watchlist-top-controls__search-shell watchlist-top-controls__search-shell--with-icon">
            <span className="watchlist-top-controls__search-icon" aria-hidden="true">📍</span>
            <Input
              ref={inputRef}
              className="watchlist-top-controls__search-field places-add-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add a place or destination"
              aria-label="Place name"
              autoComplete="off"
              fullWidth
            />
            {hasQuery && autocompleteSuggestions.length > 0 && (
              <div className="watchlist-top-controls__autocomplete is-open" role="listbox" aria-label="Place suggestions">
                {autocompleteSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    role="option"
                    className="watchlist-top-controls__autocomplete-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery(suggestion.name);
                    }}
                  >
                    <span className="watchlist-top-controls__autocomplete-copy">
                      <span className="watchlist-top-controls__autocomplete-title">{suggestion.name}</span>
                      <span className="watchlist-top-controls__autocomplete-meta">Suggested place</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {(showAddAction || showSuggestAction) && (
            <div className="watchlist-top-controls__search-actions">
              {showAddAction && (
                <button
                  type="submit"
                  className="watchlist-top-controls__search-button ui-button ui-button--primary ui-button--md"
                  disabled={isBusy}
                  aria-label="Add place"
                  title="Add directly to list"
                >
                  {isAdding ? <Spinner size={16} /> : <><PlusIcon size={14} /> Add</>}
                </button>
              )}
              {showSuggestAction && onSuggest && (
                <button
                  type="button"
                  className="watchlist-top-controls__search-button ui-button ui-button--ghost ui-button--md"
                  onClick={() => void onSuggest()}
                  disabled={isBusy}
                  aria-label="Suggest place"
                  title="Suggest for review"
                  style={{ borderStyle: 'dashed' }}
                >
                  {isSuggesting ? <Spinner size={16} /> : <>💡 Suggest</>}
                </button>
              )}
            </div>
          )}
        </form>

        {suggestionError && (
          <div className="places-top-controls__error" role="alert">
            {suggestionError}
          </div>
        )}
      </div>
    </section>
  );
};

export default PlacesTopControls;
