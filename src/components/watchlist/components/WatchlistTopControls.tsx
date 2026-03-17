import React from 'react';
import { PlusIcon, Spinner } from '@/common/icons';
import Button from '@/ui/Button';
import Input from '@/ui/Input';
import SubNav from '@/ui/SubNav';
import { ContentTab, SortMode } from '@/types';
import { colors, spacing, typography } from '@/design-system';

const MOVIE_TABS: { id: ContentTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🎬' },
  { id: 'to-watch', label: 'Queue', icon: '📋' },
  { id: 'watched', label: 'Watched', icon: '✅' },
  { id: 'suggestions', label: 'Suggestions', icon: '💡' },
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
  isAdding: boolean;
  isSuggesting: boolean;
  isMobile: boolean;
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
  isAdding,
  isSuggesting,
  isMobile,
  suggestionError,
}) => {
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <div className="watchlist-top-controls">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? spacing.md : spacing.lg,
        }}
      >
        <SubNav
          ariaLabel="Movies: filter and sort"
          scrollClassName="watchlist-tabs-scroll"
          tabs={MOVIE_TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            count: tabCounts[tab.id] ?? 0,
          }))}
          activeId={contentTab}
          onSelect={(id) => setContentTab(id as ContentTab)}
          chips={SORT_OPTIONS}
          activeChipId={sortMode}
          onChipSelect={(id) => setSortMode(id as SortMode)}
          chipLabel="Sort by"
        />

        <form
          onSubmit={handleFormSubmit}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 28%), rgba(20, 22, 38, 0.72)',
            borderRadius: '2px',
            border: `2px solid ${colors.borderSecondary}70`,
            overflow: 'hidden',
            minHeight: '48px',
            boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 0 rgba(255,255,255,0.08)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search or add a movie…"
            aria-label="Search or add a movie"
            style={{
              minHeight: '48px',
              flex: 1,
              border: 'none',
              background: 'transparent',
              paddingLeft: spacing.lg,
              paddingRight: spacing.sm,
              fontSize: typography.fontSize.sm,
            }}
          />
          {searchQuery.trim() ? (
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isAdding || isSuggesting}
              isLoading={isAdding || isSuggesting}
              style={{
                minHeight: '48px',
                minWidth: '56px',
                borderRadius: 0,
                borderLeft: `1px solid ${colors.borderSecondary}45`,
                boxShadow: 'none',
              }}
              title="Add or suggest movie"
              aria-label="Add or suggest movie"
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          ) : (
            <div
              style={{
                padding: `0 ${spacing.md}`,
                display: 'flex',
                alignItems: 'center',
                color: colors.textTertiary,
                opacity: 0.6,
              }}
              aria-hidden
            >
              <PlusIcon style={{ width: 20, height: 20 }} />
            </div>
          )}
        </form>
      </div>

      {suggestionError && (
        <div
          style={{
            color: colors.error,
            fontSize: typography.fontSize.xs,
            marginTop: spacing.xs,
          }}
        >
          {suggestionError}
        </div>
      )}
    </div>
  );
};

export default WatchlistTopControls;
