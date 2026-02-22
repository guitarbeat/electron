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
  { label: 'Queue', value: 'to-watch' },
  { label: 'Watched', value: 'watched' },
  { label: 'Suggestions', value: 'suggestions' },
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
        background: 'rgba(23, 33, 58, 0.4)',
        backdropFilter: 'blur(8px)',
        fontFamily: typography.fontFamily.body.join(', '),
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: spacing.xs,
          marginBottom: spacing.md,
          overflowX: 'auto',
          paddingBottom: spacing.xs,
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setContentTab(tab.value)}
            style={{
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: radius.full,
              border: 'none',
              background: contentTab === tab.value ? colors.accent : 'transparent',
              color: contentTab === tab.value ? '#000' : colors.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.wider,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: '10px',
                opacity: 0.7,
                background: contentTab === tab.value ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                padding: '2px 6px',
                borderRadius: radius.sm,
              }}
            >
              {tabCounts[tab.value] || 0}
            </span>
          </button>
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
            fontFamily: typography.fontFamily.heading.join(', '),
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wide,
            fontSize: typography.fontSize.xs,
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
            fontFamily: typography.fontFamily.heading.join(', '),
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wide,
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
