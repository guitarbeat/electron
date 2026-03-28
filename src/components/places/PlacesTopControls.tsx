import React from 'react';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { PlusIcon, Spinner } from '@/common/icons';
import { colors } from '@/theme/tokens';

interface PlacesTopControlsProps {
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
  searchQuery,
  setSearchQuery,
  onSubmit,
  onSuggest,
  isAdding,
  isSuggesting,
  suggestionError,
  canEdit,
}) => {
  const isBusy = isAdding || isSuggesting;

  return (
    <section className="workspace-control-panel ui-control-surface places-top-controls">
      <div className="places-top-controls__toolbar">
        <form
          className="places-top-controls__search-form"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Add a place"
            aria-label="Place name"
            fullWidth
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            {searchQuery.trim() && canEdit && (
              <>
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  disabled={isBusy}
                  title="Add place directly"
                  aria-label="Add place"
                  style={{ minWidth: '44px' }}
                >
                  {isAdding ? <Spinner size={16} /> : <PlusIcon size={16} />}
                </Button>
                {onSuggest && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => void onSuggest()}
                    disabled={isBusy}
                    title="Suggest for review"
                    aria-label="Suggest place"
                    style={{ minWidth: '44px', border: `1px dashed ${colors.border}` }}
                  >
                    {isSuggesting ? <Spinner size={16} /> : '💡'}
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
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
