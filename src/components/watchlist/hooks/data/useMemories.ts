import { useCallback, useMemo } from 'react';
import { usePolling } from '../../../hooks/usePolling';
import {
  addMemory as addMemoryService,
  deleteMemory as deleteMemoryService,
  getMemories,
  toggleMemoryPin as toggleMemoryPinService,
  updateMemory as updateMemoryService,
} from '../../../services/memoryService';
import { SharedMemory } from '../../../types';

const POLLING_INTERVAL = 30000;

const memoriesEqual = (prev: SharedMemory[] | undefined, next: SharedMemory[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

export const useMemories = (isPaused: boolean = false) => {
  const {
    data: memories,
    isLoading,
    error,
    refresh,
  } = usePolling<SharedMemory[]>(getMemories, POLLING_INTERVAL, memoriesEqual, {
    key: 'memories',
    isPaused,
  });

  const sortedMemories = useMemo(() => {
    return [...(memories || [])].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [memories]);

  const addMemory = useCallback(
    async (movieId: string | undefined, movieTitle: string, author: string, note: string) => {
      const result = await addMemoryService(movieId, movieTitle, author, note);
      refresh();
      return result;
    },
    [refresh]
  );

  const updateMemory = useCallback(
    async (memoryId: string, updates: { note?: string; movieId?: string; movieTitle?: string }) => {
      const result = await updateMemoryService(memoryId, updates);
      refresh();
      return result;
    },
    [refresh]
  );

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      await deleteMemoryService(memoryId);
      refresh();
    },
    [refresh]
  );

  const toggleMemoryPin = useCallback(
    async (memoryId: string) => {
      const result = await toggleMemoryPinService(memoryId);
      refresh();
      return result;
    },
    [refresh]
  );

  return {
    memories: sortedMemories,
    isLoading,
    error,
    refresh,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleMemoryPin,
  };
};
