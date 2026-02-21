import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { PlusIcon, Spinner } from '../../icons';
import { SortMode, ContentTab } from '../types';
import { colors, spacing, radius, typography } from '../../../design-system/tokens';
import { useSuggestions } from '../../../hooks/useSuggestions';

interface WatchlistControlsProps {
  contentTab: ContentTab;
  setContentTab: (tab: ContentTab) => void;
  tabCounts: Record<ContentTab, number>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  showMemoriesOnly: boolean;
  setShowMemoriesOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
  memoriesCount: number;
  isMobile: boolean;
  onAddMovie?: (title: string) => void;
  isAdding?: boolean;
}

const TABS: { label: string; value: ContentTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'To Watch', value: 'to-watch' },
  { label: 'Watched', value: 'watched' },
  { label: 'For You', value: 'suggestions' },
];

export const WatchlistControls: React.FC<WatchlistControlsProps> = ({
  contentTab,
  setContentTab,
  tabCounts,
  searchQuery,
  setSearchQuery,
  sortMode,
  setSortMode,
  showMemoriesOnly,
  setShowMemoriesOnly,
  memoriesCount,
  isMobile,
  onAddMovie,
  isAdding = false,
}) => {
  const { addSuggestion } = useSuggestions();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    if (onAddMovie) {
      onAddMovie(searchQuery.trim());
      setSearchQuery('');
    } else {
      setIsSuggesting(true);
      setSuggestionError(null);
      try {
        await addSuggestion(searchQuery.trim(), 'Anonymous');
        setSearchQuery('');
        alert('Movie suggested successfully!');
      } catch (err: any) {
        setSuggestionError(err.message || 'Failed to suggest');
      } finally {
        setIsSuggesting(false);
      }
    }
  };

  return (
    <Card
      variant="elevated"
      style={{
        padding: isMobile ? spacing.sm : spacing.md,
        border: `1px solid ${colors.borderSecondary}40`,
        marginBottom: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        }}
      >
        {TABS.map(({ label, value: tabValue }) => (
          <Button
            key={tabValue}
            variant={contentTab === tabValue ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setContentTab(tabValue)}
            style={{
              width: '100%',
              justifyContent: 'center',
              border: contentTab === tabValue ? undefined : `1px solid ${colors.borderSecondary}30`,
              color: contentTab === tabValue ? colors.textPrimary : colors.textSecondary,
              minHeight: '44px',
            }}
          >
            {label} ({tabCounts[tabValue]})
          </Button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
        }}
      >
        <form 
          onSubmit={handleAddAction}
          style={{ flex: 1, display: 'flex', gap: spacing.xs, alignItems: 'center' }}
        >
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or add a movie..."
            aria-label="Search or add a movie"
            style={{
              height: '44px',
              flex: 1,
            }}
          />
          {searchQuery.trim() && (
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={isAdding || isSuggesting}
              isLoading={isAdding || isSuggesting}
              style={{ height: '44px', minWidth: '44px', padding: 0 }}
              title="Add or Suggest"
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          )}
        </form>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          aria-label="Sort movies"
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '44px',
            minWidth: isMobile ? '100%' : '160px',
            borderRadius: radius.md,
            border: `1px solid ${colors.borderSecondary}40`,
            backgroundColor: colors.surfaceElevated,
            color: colors.textPrimary,
            padding: `0 ${spacing.sm}`,
            fontFamily: typography.fontFamily.body.join(', '),
          }}
        >
          <option value="recent">Recently Added</option>
          <option value="title">Title A-Z</option>
          <option value="year">Year (Newest)</option>
        </select>
        <Button
          type="button"
          size="sm"
          variant={showMemoriesOnly ? 'secondary' : 'ghost'}
          onClick={() => setShowMemoriesOnly((prev) => !prev)}
          style={{
            minHeight: '44px',
            border: `1px solid ${colors.borderSecondary}40`,
            whiteSpace: 'nowrap',
          }}
        >
          Memories only ({memoriesCount})
        </Button>
      </div>
      {suggestionError && (
        <div style={{ color: colors.error, fontSize: '12px', marginTop: spacing.xs }}>
          {suggestionError}
        </div>
      )}
    </Card>
  );
};
