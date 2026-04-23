import React, { useRef } from 'react';
import { Input } from '@/ui/FormFields';
import { PlusIcon, Spinner } from '@/common/Icons';
import WorkspaceSummary from '@/components/ui/WorkspaceSummary';

interface PlacesTopControlsProps {
  queueCount: number;
  visitedCount: number;
  pinnedCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onSuggest?: () => Promise<void> | void;
  isAdding: boolean;
  isSuggesting?: boolean;
  suggestionError: string | null;
  canEdit: boolean;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  queueCount,
  visitedCount,
  pinnedCount,
  searchQuery,
  setSearchQuery,
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
  const showAddAction = hasQuery && canEdit;
  const showSuggestAction = hasQuery && Boolean(onSuggest);
  const title =
    queueCount === 0 && visitedCount === 0
      ? 'Start the list'
      : queueCount > 0
        ? `${queueCount} place${queueCount === 1 ? '' : 's'} to try`
        : `${visitedCount} place${visitedCount === 1 ? '' : 's'} visited`;
  const lead =
    pinnedCount > 0
      ? `${pinnedCount} place${pinnedCount === 1 ? '' : 's'} pinned on the map.`
      : 'Add the next place.';
  const stats = [
    { label: 'Queue', value: queueCount },
    { label: 'Visited', value: visitedCount },
    { label: 'Pinned', value: pinnedCount },
  ];

  return (
    <section className="workspace-control-panel watchlist-top-controls">
      <div className="watchlist-top-controls__intro">
        <WorkspaceSummary
          eyebrow="Places"
          title={title}
          lead={lead}
          stats={stats}
        />
      </div>

      <div className="watchlist-top-controls__input-block">
        <div className="watchlist-top-controls__toolbar">
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
        </div>
      </div>

      {suggestionError && (
        <div className="places-top-controls__error" role="alert">
          {suggestionError}
        </div>
      )}
    </section>
  );
};

export default PlacesTopControls;
