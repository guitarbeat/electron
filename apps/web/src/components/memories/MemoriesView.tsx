import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser, useViewport } from "@/app/providerContexts";
import { useSyncedScope } from "@/hooks";
import { warmServiceWorkerMedia } from "@/services/swMediaCache";
import {
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from "@/services/content";
import type { SharedMemory } from "@/shared/types";
import { compareCreatedAtAsc } from "@/utils";
import { SyncBanner } from "@/components/ui";
import {
  INITIAL_VISIBLE_COUNT,
  ALL_MOVIES_FILTER,
  type MemorySortMode,
  sortMemories,
  MemoryList,
  type MemoriesViewProps,
} from "./shared";

const POLLING_INTERVAL = 15_000;

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  onJumpToMovies,
}) => {
  const { currentUser } = useUser();
  const { isMobile } = useViewport();

  const {
    data: remoteMemories,
    error: memoriesError,
    isLoading,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh: refreshMemories,
    retrySync,
  } = useSyncedScope("memories", {
    pollingInterval: POLLING_INTERVAL,
  });

  const memories = useMemo(
    () => [...(remoteMemories ?? [])].sort(compareCreatedAtAsc),
    [remoteMemories],
  );

  useEffect(() => {
    if (memories && memories.length > 0) {
      const imageUrls = memories
        .map((m) => m.imageUrl)
        .filter((url): url is string => Boolean(url));
      warmServiceWorkerMedia(imageUrls);
    }
  }, [memories]);

  const [sortMode, setSortMode] = useState<MemorySortMode>("newest");
  const [activeMovieFilter, setActiveMovieFilter] =
    useState<string>(ALL_MOVIES_FILTER);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const sortedMemories = useMemo(
    () => sortMemories(memories, sortMode),
    [memories, sortMode],
  );

  const filteredMemories = useMemo(() => {
    if (activeMovieFilter === ALL_MOVIES_FILTER) return sortedMemories;
    return sortedMemories.filter(
      (m) =>
        m.movieId === activeMovieFilter || m.movieTitle === activeMovieFilter,
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

  const handleSortModeChange = useCallback((next: MemorySortMode) => {
    setSortMode(next);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  const handleMovieFilterChange = useCallback((next: string) => {
    setActiveMovieFilter(next);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, []);

  return (
    <div
      className="workspace-container memories-container"
      style={{ position: "relative" }}
    >
      {isDegraded || isSyncBlocked ? (
        <SyncBanner
          isBlocked={isSyncBlocked}
          label={syncWarning ?? undefined}
          onRetry={() => void retrySync()}
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
        memoriesError={memoriesError?.message ?? null}
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
