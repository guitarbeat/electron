import React from 'react';
import { PlusIcon, Spinner } from '@/common/icons';
import Button from '@/ui/Button';
import { Input } from '@/ui/FormFields';
import SubNav from '@/ui/SubNav';
import { ContentTab, SortMode } from '@/types';
import { spacing, colors, typography, motion } from '@/design-system';

const MOVIE_TABS: { id: ContentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'queue', label: 'Queue' },
  { id: 'watched', label: 'Watched' },
  { id: 'suggestions', label: 'Suggestions' },
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
    <div 
      className="watchlist-top-controls" 
      style={{ 
        marginBottom: spacing.xl,
        display: 'flex', 
        flexDirection: 'column', 
        gap: spacing.lg,
        animation: `slide-in-left ${motion.duration.normal} ${motion.easing.easeOut}`,
      }}
    >
      <SubNav
        tabs={MOVIE_TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          count: tabCounts[tab.id] ?? 0,
        }))}
        activeTabId={contentTab}
        onTabChange={(id) => setContentTab(id as ContentTab)}
        chips={SORT_OPTIONS}
        activeChipId={sortMode}
        onChipChange={(id) => setSortMode(id as SortMode)}
        variant="underlined"
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          width: '100%',
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          style={{ 
            flex: 1, 
            display: 'flex', 
            gap: spacing.xs,
            alignItems: 'stretch',
          }}
        >
          <div style={{ flex: 1 }}>
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search or add a movie…"
              aria-label="Search or add a movie"
              fullWidth
            />
          </div>
          {searchQuery.trim() && (
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={isAdding || isSuggesting}
              isLoading={isAdding || isSuggesting}
              title="Add or suggest movie"
              aria-label="Add or suggest movie"
              style={{ minWidth: '44px' }}
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          )}
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={onPickRandom}
          disabled={isAdding || isSuggesting || !canSurprise}
          title="Surprise me"
          aria-label="Pick a random movie"
          style={{ 
            fontSize: '1.25rem', 
            padding: spacing.xs,
            borderRadius: '50%',
            aspectRatio: '1/1',
            minWidth: '44px',
          }}
        >
          🎲
        </Button>
      </div>

      {suggestionError && (
        <div
          role="alert"
          style={{
            marginTop: -spacing.xs,
            color: colors.error,
            fontSize: typography.fontSize.xs,
            textAlign: 'center',
            background: `${colors.error}10`,
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: '4px',
            border: `1px solid ${colors.error}30`,
          }}
        >
          {suggestionError}
        </div>
      )}
    </div>
  );
};

export default WatchlistTopControls;

