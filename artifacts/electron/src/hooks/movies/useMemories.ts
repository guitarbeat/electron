import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from "../../services/content/memoryService.ts";
import { compareCreatedAtDesc } from "../../utils/index.ts";
import { readScope } from "../../services/state/index.ts";

const POLLING_INTERVAL = 30000;

export const useMemories = (isPaused: boolean) => {
  const queryClient = useQueryClient();
  const readMemories = useCallback(() => readScope("memories"), []);

  const { data: memoriesSnapshot, refetch: refreshMemoriesQuery } = useQuery({
    queryKey: ["memories"],
    queryFn: readMemories,
    refetchInterval: isPaused ? false : POLLING_INTERVAL,
    refetchOnWindowFocus: !isPaused,
    structuralSharing: false,
  });

  const memories = useMemo(() => {
    return [...(memoriesSnapshot?.data || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return compareCreatedAtDesc(a, b);
    });
  }, [memoriesSnapshot]);

  const withMemoryRefresh = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const result = await operation();
      // Invalidate so all subscribers (MovieDetailsModal, MemoryList) pick up fresh data.
      void queryClient.invalidateQueries({ queryKey: ["memories"] });
      return result;
    },
    [queryClient],
  );

  const addMemory = useCallback(
    async (
      movieId: string | undefined,
      movieTitle: string,
      author: string,
      note: string,
    ) =>
      withMemoryRefresh(() =>
        addMemoryService(movieId, movieTitle, author, note),
      ),
    [withMemoryRefresh],
  );

  const updateMemory = useCallback(
    async (
      memoryId: string,
      updates: { note?: string; movieId?: string; movieTitle?: string },
    ) => withMemoryRefresh(() => updateMemoryService(memoryId, updates)),
    [withMemoryRefresh],
  );

  const deleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await withMemoryRefresh(() => deleteMemoryService(memoryId));
    },
    [withMemoryRefresh],
  );

  const toggleMemoryPin = useCallback(
    async (memoryId: string) =>
      withMemoryRefresh(() => toggleMemoryPinService(memoryId)),
    [withMemoryRefresh],
  );

  return {
    memories,
    memoriesSnapshot,
    refreshMemoriesQuery,
    addMemory,
    updateMemory,
    deleteMemoryRecord,
    toggleMemoryPin,
  };
};
