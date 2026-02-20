import React from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import MemoryList from '../../memories/MemoryList';
import { SharedMemory, Movie, User } from '../../../types';
import { colors, spacing, typography } from '../../../design-system/tokens';

interface WatchlistMemoriesProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  memories: SharedMemory[];
  watchedMovies: Movie[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  onAddMemory: (
    movieId: string | undefined,
    movieTitle: string,
    author: string,
    note: string
  ) => Promise<SharedMemory>;
  onUpdateMemory: (memoryId: string, updates: { note?: string }) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
  onTogglePin: (memoryId: string) => Promise<void>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onJumpToMovie: (memory: SharedMemory) => void;
  memorySectionRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
}

export const WatchlistMemories: React.FC<WatchlistMemoriesProps> = ({
  isCollapsed,
  setIsCollapsed,
  memories,
  watchedMovies,
  currentUser,
  isLoading,
  error,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onTogglePin,
  activeFilter,
  onFilterChange,
  onJumpToMovie,
  memorySectionRef,
  isMobile,
}) => {
  return (
    <div
      ref={memorySectionRef}
      style={{
        marginTop: spacing.xl,
        scrollMarginTop: isMobile ? '88px' : '110px',
      }}
    >
      <Card
        variant="elevated"
        style={{
          padding: isMobile ? spacing.sm : spacing.md,
          border: `1px solid ${colors.borderSecondary}40`,
          marginBottom: spacing.md,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: colors.textPrimary,
                fontSize: typography.fontSize.base,
              }}
            >
              Memories ({memories.length})
            </h3>
            <p
              style={{
                margin: `${spacing.xs} 0 0`,
                color: colors.textTertiary,
                fontSize: typography.fontSize.xs,
              }}
            >
              Pinned, editable, and linked to your watched movies.
            </p>
          </div>
          <Button
            type="button"
            variant={isCollapsed ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed ? 'Show Memories' : 'Hide Memories'}
          </Button>
        </div>
      </Card>

      {!isCollapsed && (
        <MemoryList
          memories={memories}
          visibleMemories={memories}
          sortedMemories={memories}
          currentUser={currentUser}
          isMobile={isMobile}
          onEditMemory={async (memory, note) => {
            await onUpdateMemory(memory.id, { note });
          }}
          onDeleteMemory={async (memory) => {
            await onDeleteMemory(memory.id);
          }}
          onTogglePin={async (memory) => {
            await onTogglePin(memory.id);
          }}
          movieFilterOptions={watchedMovies.map(m => ({ id: m.id, title: m.title }))}
          activeMovieFilter={activeFilter}
          onActiveMovieFilterChange={onFilterChange}
          onJumpToMovie={onJumpToMovie}
          sortMode="newest"
          onSortModeChange={() => {}}
          onShowMore={() => {}}
          onShowLess={() => {}}
          visibleCount={100}
          isLoading={isLoading}
          memoriesError={error}
        />
      )}
    </div>
  );
};
