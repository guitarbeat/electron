import React, { useState } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { PlusIcon, Spinner } from '../../icons';
import { SortMode, ContentTab } from '../types';
import { colors, spacing, radius, typography, shadows } from '../../../design-system/tokens';
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
  viewMode: 'list' | 'grid' | 'dial';
  setViewMode: (mode: 'list' | 'grid' | 'dial') => void;
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
  viewMode,
  setViewMode,
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

        <div style={{ display: 'flex', gap: spacing.sm, flex: isMobile ? 'none' : '0 0 auto', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: radius.md, padding: '4px', border: `1px solid ${colors.borderSecondary}40` }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? colors.surfaceElevated : 'transparent',
                border: 'none',
                borderRadius: radius.sm,
                padding: '8px',
                color: viewMode === 'list' ? colors.accent : colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'list' ? shadows.card : 'none'
              }}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? colors.surfaceElevated : 'transparent',
                border: 'none',
                borderRadius: radius.sm,
                padding: '8px',
                color: viewMode === 'grid' ? colors.accent : colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'grid' ? shadows.card : 'none'
              }}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('dial')}
              style={{
                background: viewMode === 'dial' ? colors.surfaceElevated : 'transparent',
                border: 'none',
                borderRadius: radius.sm,
                padding: '8px',
                color: viewMode === 'dial' ? colors.accent : colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: viewMode === 'dial' ? shadows.card : 'none'
              }}
              title="Dial View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="Sort movies"
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '48px',
              minWidth: isMobile ? '100%' : '160px',
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
