import { useCallback, useMemo } from 'react';
import { usePolling } from './usePolling';
import { addMemory as addMemoryService, getMemories } from '../services/memoryService';
import { SharedMemory } from '../types';

const POLLING_INTERVAL = 30000;

const memoriesEqual = (prev: SharedMemory[] | undefined, next: SharedMemory[]) => {
  if (!prev) return false;
  if (prev.length !== next.length) return false;
  return JSON.stringify(prev) === JSON.stringify(next);
};

export const useMemories = () => {
  const {
    data: memories,
    isLoading,
    error,
    refresh,
  } = usePolling<SharedMemory[]>(getMemories, POLLING_INTERVAL, memoriesEqual);

  const sortedMemories = useMemo(() => {
    return [...(memories || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [memories]);

  const addMemory = useCallback(
    async (movieId: string | undefined, movieTitle: string, author: string, note: string) => {
      const result = await addMemoryService(movieId, movieTitle, author, note);
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
  };
};
