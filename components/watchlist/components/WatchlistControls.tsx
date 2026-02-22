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
              border: `1px solid ${contentTab === tab.value ? colors.accent : 'transparent'}`,
              background: contentTab === tab.value ? colors.accent : 'rgba(255, 255, 255, 0.05)',
              color: contentTab === tab.value ? '#000' : colors.textSecondary,
              fontSize: typography.fontSize.xs,
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              boxShadow: contentTab === tab.value ? `0 0 12px ${colors.accent}40` : 'none',
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: '10px',
                fontWeight: '800',
                background: contentTab === tab.value ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                padding: '2px 8px',
                borderRadius: radius.sm,
                minWidth: '20px',
                textAlign: 'center',
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
          style={{ 
            flex: 1, 
            display: 'flex', 
            gap: 0, 
            alignItems: 'center',
            background: colors.surfaceElevated,
            borderRadius: radius.md,
            border: `1px solid ${colors.borderSecondary}40`,
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
          }}
        >
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or add a movie..."
            aria-label="Search or add a movie"
            style={{
              height: '48px',
              flex: 1,
              border: 'none',
              background: 'transparent',
              paddingLeft: spacing.md,
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
                height: '48px', 
                minWidth: '60px', 
                borderRadius: 0,
                borderLeft: `1px solid ${colors.borderSecondary}40`,
              }}
              title="Add or Suggest"
            >
              {isAdding || isSuggesting ? <Spinner /> : <PlusIcon />}
            </Button>
          ) : (
            <div style={{ paddingRight: spacing.md, color: colors.textTertiary, opacity: 0.5 }}>
              <PlusIcon style={{ width: '18px', height: '18px' }} />
            </div>
          )}
        </form>
        
        <div style={{ display: 'flex', gap: spacing.sm, flex: isMobile ? 'none' : '0 0 auto' }}>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="Sort movies"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '48px',
              minWidth: isMobile ? '50%' : '160px',
              flex: 1,
              borderRadius: radius.md,
              border: `1px solid ${colors.borderSecondary}40`,
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              padding: `0 ${spacing.sm}`,
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textSecondary)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '32px',
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
              height: '48px',
              flex: 1,
              minWidth: isMobile ? '50%' : '160px',
              border: `1px solid ${showMemoriesOnly ? colors.accent : colors.borderSecondary + '40'}`,
              whiteSpace: 'nowrap',
              fontFamily: typography.fontFamily.heading.join(', '),
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              fontSize: '11px',
              fontWeight: '600',
              background: showMemoriesOnly ? colors.accent : 'rgba(255, 255, 255, 0.03)',
              color: showMemoriesOnly ? '#000' : colors.textPrimary,
            }}
          >
            Memories ({memoriesCount})
          </Button>
        </div>
      </div>
      {suggestionError && (
        <div style={{ color: colors.error, fontSize: '12px', marginTop: spacing.xs }}>
          {suggestionError}
        </div>
      )}
    </Card>
  );
};
