import React from 'react';
import type { PlaceContentTab, PlaceSortMode } from '@/shared/types';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import { MagicWandIcon, PlusIcon, Spinner } from '@/common/icons';
import { PLACE_TABS, PLACE_SORT_OPTIONS } from './placesConstants';

interface PlacesTopControlsProps {
  contentTab: PlaceContentTab;
  setContentTab: (tab: PlaceContentTab) => void;
  sortMode: PlaceSortMode;
  setSortMode: (mode: PlaceSortMode) => void;
  tabCounts: Record<PlaceContentTab, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSubmit: () => Promise<void> | void;
  onPickRandom: () => void;
  canSurprise: boolean;
  isAdding: boolean;
  isSuggesting: boolean;
  suggestionError: string | null;
  canEdit: boolean;
}

const PlacesTopControls: React.FC<PlacesTopControlsProps> = ({
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
  canEdit,
}) => {
  const isBusy = isAdding || isSuggesting;

  return (
    <section className="workspace-control-panel ui-control-surface places-top-controls">
      <SubNav
        tabs={PLACE_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tabCounts[tab.id] ?? 0,
        }))}
        activeTabId={contentTab}
        onTabChange={(id) => setContentTab(id as PlaceContentTab)}
        chips={PLACE_SORT_OPTIONS}
        activeChipId={sortMode}
        onChipChange={(id) => setSortMode(id as PlaceSortMode)}
        variant="underlined"
        mode="segmented"
      />

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
            placeholder="Place name"
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

        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={onPickRandom}
            disabled={isBusy || !canSurprise}
            title="Surprise me"
            aria-label="Pick a random place"
            className="places-top-controls__surprise"
            style={{
              opacity: canSurprise && !isBusy ? 1 : 0.5,
            }}
          >
            <MagicWandIcon style={{ width: 18, height: 18 }} />
          </Button>
        )}
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
