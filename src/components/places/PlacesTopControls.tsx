import React from 'react';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import { PlusIcon, Spinner } from '@/common/icons';

interface PlacesTopControlsProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  isAdding: boolean;
  suggestionError: string | null;
  canEdit: boolean;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
  searchQuery,
  setSearchQuery,
  onSubmit,
  isAdding,
  suggestionError,
  canEdit,
}) => {
  const isBusy = isAdding;

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
          {searchQuery.trim() && canEdit && (
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={isBusy}
              title="Add or suggest place"
              aria-label="Add or suggest place"
              style={{ minWidth: '44px' }}
            >
              {isBusy ? <Spinner /> : <PlusIcon />}
            </Button>
          )}
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
