/**
 * MemoriesView — standalone tab view for shared memories.
 * Surfaces all memories across all movies in one place with
 * sort, filter by movie, pagination, and full CRUD actions.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useUser } from "@/app/useProviders";
import { useViewport } from "@/app/ViewportContext";
import { usePolling } from "@/services/polling";
import { readScope, retryScopeSync } from "@/services/state";
import { areScopeSnapshotsEqual } from "@/services/state/stateCompare";
import {
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from "@/services/content";
import type { SharedMemory } from "@/shared/types";
import { compareCreatedAtAsc } from "@/utils";
import SyncBanner from "@/components/ui/SyncBanner";
import MemoryList from "./MemoryList";
import {
  ALL_MOVIES_FILTER,
  INITIAL_VISIBLE_COUNT,
  type MemorySortMode,
  sortMemories,
} from "./lib/memoryUtils";

const POLLING_INTERVAL = 15_000;

export interface MemoriesViewProps {
  /** Called when the user taps "Jump to movie" — navigates to the Movies tab. */
  onJumpToMovies?: () => void;
}

const MemoriesView: React.FC<MemoriesViewProps> = ({ onJumpToMovies }) => {
  const { currentUser } = useUser();
  const { isMobile } = useViewport();

  // ── Data fetching ────────────────────────────────────────────────────────
  const readMemories = useCallback(() => readScope("memories"), []);

  const {
    data: memoriesSnapshot,
    isLoading,
    refresh: refreshMemories,
  } = usePolling(readMemories, POLLING_INTERVAL, areScopeSnapshotsEqual, {
    key: "memories-tab",
  });

  const memories = useMemo(
    () => [...(memoriesSnapshot?.data ?? [])].sort(compareCreatedAtAsc),
    [memoriesSnapshot],
  );

  // ── Local UI state ───────────────────────────────────────────────────────
  const [sortMode, setSortMode] = useState<MemorySortMode>("newest");
  const [activeMovieFilter, setActiveMovieFilter] =
    useState<string>(ALL_MOVIES_FILTER);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  // ── Derived data ─────────────────────────────────────────────────────────
  const sortedMemories = useMemo(
    () => sortMemories(memories, sortMode),
    [memories, sortMode],
  );

  const filteredMemories = useMemo(() => {
    if (activeMovieFilter === ALL_MOVIES_FILTER) return sortedMemories;
    return sortedMemories.filter(
      (m) =>
        m.movieId === activeMovieFilter ||
        m.movieTitle === activeMovieFilter,
    );
  }, [sortedMemories, activeMovieFilter]);

  const visibleMemories = useMemo(
    () => filteredMemories.slice(0, visibleCount),
    [filteredMemories, visibleCount],
  );

  const movieFilterOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; title: string }> = [];
    for (const m of memories) {
      const key = m.movieId ?? m.movieTitle;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({ id: key, title: m.movieTitle });
      }
    }
    return options;
  }, [memories]);

  const memoriesError = useMemo(
    () =>
      memoriesSnapshot && "error" in memoriesSnapshot && memoriesSnapshot.error
        ? String((memoriesSnapshot as { error: unknown }).error)
        : null,
    [memoriesSnapshot],
  );

  const isDegraded = memoriesSnapshot?.degraded ?? false;
  const isSyncBlocked = memoriesSnapshot?.blocked ?? false;
  const syncWarning = memoriesSnapshot?.warning;

  // ── Mutation helpers ─────────────────────────────────────────────────────
  const withRefresh = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const result = await fn();
      await refreshMemories();
      return result;
    },
    [refreshMemories],
  );

  const handleEditMemory = useCallback(
    async (memory: SharedMemory, note: string) => {
      await withRefresh(() => updateMemoryService(memory.id, { note }));
    },
    [withRefresh],
  );

  const handleDeleteMemory = useCallback(
    async (memory: SharedMemory) => {
      await withRefresh(() => deleteMemoryService(memory.id));
    },
    [withRefresh],
  );

  const handleTogglePin = useCallback(
    async (memory: SharedMemory) => {
      await withRefresh(() => toggleMemoryPinService(memory.id));
    },
    [withRefresh],
  );

  const handleJumpToMovie = useCallback(
    (_memory: SharedMemory) => {
      onJumpToMovies?.();
    },
    [onJumpToMovies],
  );

  const handleShowMore = useCallback(() => {
    setVisibleCount((c) => c + INITIAL_VISIBLE_COUNT);
  }, []);

  const handleShowLess = useCallback(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  // ── Filter reset on sort change ──────────────────────────────────────────
  const handleSortModeChange = useCallback((next: MemorySortMode) => {
    setSortMode(next);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  const handleMovieFilterChange = useCallback((next: string) => {
    setActiveMovieFilter(next);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  return (
    <div className="workspace-container memories-container" style={{ position: "relative" }}>
      {(isDegraded || isSyncBlocked) ? (
        <SyncBanner
          isBlocked={isSyncBlocked}
          label={syncWarning ?? undefined}
          onRetry={() => void retryScopeSync("memories")}
        />
      ) : null}

      <MemoryList
        memories={memories}
        visibleMemories={visibleMemories}
        sortedMemories={filteredMemories}
        movieFilterOptions={movieFilterOptions}
        activeMovieFilter={activeMovieFilter}
        onActiveMovieFilterChange={handleMovieFilterChange}
        sortMode={sortMode}
        onSortModeChange={handleSortModeChange}
        onShowMore={handleShowMore}
        onShowLess={handleShowLess}
        visibleCount={visibleCount}
        isLoading={isLoading}
        memoriesError={memoriesError}
        isMobile={isMobile}
        currentUser={currentUser}
        onJumpToMovie={handleJumpToMovie}
        onEditMemory={handleEditMemory}
        onDeleteMemory={handleDeleteMemory}
        onTogglePin={handleTogglePin}
      />
    </div>
  );
};

export default MemoriesView;
