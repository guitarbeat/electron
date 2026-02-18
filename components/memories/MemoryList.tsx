import React from 'react';
import { SharedMemory } from '../../types';
import Button from '../ui/Button';
import { colors, radius, spacing, typography } from '../../design-system/tokens';
import {
  ALL_MOVIES_FILTER,
  INITIAL_VISIBLE_COUNT,
  MemorySortMode,
  formatMemoryTimestamp,
  getMemoryMovieKey,
  getStickyNoteRotation,
  getStickyNoteTheme,
} from './memoryUtils';

interface MemoryListProps {
  memories: SharedMemory[];
  visibleMemories: SharedMemory[];
  sortedMemories: SharedMemory[];
  movieFilterOptions: Array<{ id: string; title: string }>;
  activeMovieFilter: string;
  onActiveMovieFilterChange: (nextFilter: string) => void;
  sortMode: MemorySortMode;
  onSortModeChange: (nextSort: MemorySortMode) => void;
  onShowMore: () => void;
  onShowLess: () => void;
  visibleCount: number;
  isLoading: boolean;
  memoriesError: string | null;
  isMobile: boolean;
}

const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  visibleMemories,
  sortedMemories,
  movieFilterOptions,
  activeMovieFilter,
  onActiveMovieFilterChange,
  sortMode,
  onSortModeChange,
  onShowMore,
  onShowLess,
  visibleCount,
  isLoading,
  memoriesError,
  isMobile,
}) => {
  return (
    <div
      style={{
        marginTop: spacing.lg,
        padding: isMobile ? spacing.sm : spacing.md,
        borderRadius: radius.md,
        border: '1px solid rgba(255, 228, 177, 0.34)',
        background:
          'linear-gradient(165deg, rgba(57, 34, 18, 0.45) 0%, rgba(38, 22, 11, 0.55) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
          marginBottom: spacing.sm,
        }}
      >
        <h4
          style={{
            margin: 0,
            color: '#ffe3b1',
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.heading.join(', '),
            letterSpacing: typography.letterSpacing.normal,
          }}
        >
          Latest Memories
        </h4>
        <span style={{ color: '#f7ddba', fontSize: typography.fontSize.xs }}>
          {sortedMemories.length} pinned
        </span>
      </div>

      {memories.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            gap: spacing.sm,
            marginBottom: spacing.sm,
            padding: spacing.sm,
            border: '1px dashed rgba(255, 227, 172, 0.3)',
            borderRadius: radius.sm,
            background: 'rgba(18, 25, 43, 0.32)',
          }}
        >
          <label style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
            Filter by movie
            <select
              value={activeMovieFilter}
              onChange={(e) => onActiveMovieFilterChange(e.target.value)}
              style={{
                marginTop: spacing.xs,
                width: '100%',
                height: '40px',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}40`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                padding: `0 ${spacing.sm}`,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              <option value={ALL_MOVIES_FILTER}>All movies</option>
              {movieFilterOptions.map((movieOption) => (
                <option key={movieOption.id} value={movieOption.id}>
                  {movieOption.title}
                </option>
              ))}
            </select>
          </label>

          <label style={{ color: colors.textSecondary, fontSize: typography.fontSize.xs }}>
            Sort
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as MemorySortMode)}
              style={{
                marginTop: spacing.xs,
                width: '100%',
                minWidth: isMobile ? '100%' : '170px',
                height: '40px',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderSecondary}40`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                padding: `0 ${spacing.sm}`,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      )}

      {isLoading && memories.length === 0 && (
        <p style={{ margin: 0, color: colors.textSecondary }}>Loading memories...</p>
      )}

      {memoriesError && memories.length === 0 && (
        <p style={{ margin: 0, color: colors.error, fontSize: typography.fontSize.sm }}>
          Couldn&apos;t load memories right now. Try again in a few seconds.
        </p>
      )}

      {!isLoading && !memoriesError && visibleMemories.length === 0 && (
        <p style={{ margin: 0, color: '#f6e4cb' }}>
          {activeMovieFilter === ALL_MOVIES_FILTER
            ? 'No memories yet. Add your first one after your next shared watch.'
            : 'No memories match this movie yet.'}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: spacing.md,
        }}
      >
        {visibleMemories.map((memory) => {
          const noteTheme = getStickyNoteTheme(memory);
          const noteRotation = getStickyNoteRotation(memory);

          return (
            <div
              key={memory.id}
              style={{
                position: 'relative',
                border: `1px solid ${noteTheme.border}`,
                borderRadius: radius.sm,
                padding: `${spacing.md} ${spacing.sm} ${spacing.sm}`,
                background: noteTheme.background,
                boxShadow: '0 10px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.45)',
                minHeight: isMobile ? 'auto' : '190px',
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.xs,
                transform: isMobile ? 'none' : `rotate(${noteRotation}deg)`,
                transformOrigin: 'top center',
              }}
            >
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: radius.full,
                  background: noteTheme.pin,
                  border: '1px solid rgba(0,0,0,0.22)',
                  boxShadow: '0 3px 5px rgba(0,0,0,0.35)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: spacing.sm,
                  flexWrap: 'wrap',
                }}
              >
                <strong style={{ color: noteTheme.heading, fontSize: typography.fontSize.sm }}>
                  {memory.movieTitle}
                </strong>
                <span style={{ color: noteTheme.meta, fontSize: typography.fontSize.xs }}>
                  {formatMemoryTimestamp(memory.createdAt)}
                </span>
              </div>
              <p
                style={{
                  margin: `${spacing.xs} 0`,
                  color: noteTheme.text,
                  fontSize: typography.fontSize.sm,
                  lineHeight: typography.lineHeight.normal,
                  whiteSpace: 'pre-wrap',
                  flex: 1,
                }}
              >
                {memory.note}
              </p>
              <span
                style={{
                  color: noteTheme.signature,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                - {memory.author}
              </span>
            </div>
          );
        })}
      </div>

      {sortedMemories.length > visibleCount && (
        <div style={{ marginTop: spacing.sm, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onShowMore}
            style={{
              border: `1px solid ${colors.borderSecondary}40`,
              color: colors.textPrimary,
            }}
          >
            Show More
          </Button>
        </div>
      )}

      {sortedMemories.length <= visibleCount && visibleCount > INITIAL_VISIBLE_COUNT && (
        <div style={{ marginTop: spacing.sm, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onShowLess}
            style={{
              border: `1px solid ${colors.borderSecondary}40`,
              color: colors.textPrimary,
            }}
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
};

export default MemoryList;
