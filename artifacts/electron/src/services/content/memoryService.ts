import type { SharedMemory } from "@/shared/types";
import { mutateScope, readScope } from "../state/index.ts";
import { cloneMemories } from "../state/stateSchemas.ts";
import { sanitizeInput } from "../../utils/shared.ts";
import { compareCreatedAtDesc } from "../../utils/workspace.ts";

const sortMemories = (memories: SharedMemory[]): SharedMemory[] =>
  [...memories].sort(compareCreatedAtDesc);

export const getMemories = async (): Promise<SharedMemory[]> => {
  const snapshot = await readScope("memories");
  return sortMemories(snapshot.data);
};

const getOptimisticMemories = async (): Promise<SharedMemory[]> =>
  cloneMemories(await getMemories());

export const addMemory = async (
  movieId: string | undefined,
  movieTitle: string,
  author: string,
  note: string,
  createdAt?: string,
  imageUrl?: string,
): Promise<SharedMemory> => {
  const memories = await getOptimisticMemories();
  const newMemory: SharedMemory = {
    id: `memory-${crypto.randomUUID()}`,
    movieId,
    movieTitle: sanitizeInput(movieTitle),
    author: sanitizeInput(author),
    note: sanitizeInput(note),
    createdAt: createdAt || new Date().toISOString(),
    imageUrl: imageUrl ? sanitizeInput(imageUrl) : undefined,
  };

  await mutateScope("memories", {
    op: "add_memory",
    payload: {
      id: newMemory.id,
      movieId: newMemory.movieId,
      movieTitle: newMemory.movieTitle,
      note: newMemory.note,
      imageUrl: newMemory.imageUrl,
    },
    optimisticData: [newMemory, ...memories],
  });

  return newMemory;
};

const findMemoryIndex = (memories: SharedMemory[], memoryId: string): number =>
  memories.findIndex((memory) => memory.id === memoryId);

export const updateMemory = async (
  memoryId: string,
  updates: {
    note?: string;
    movieId?: string;
    movieTitle?: string;
  },
): Promise<SharedMemory> => {
  const memories = await getOptimisticMemories();
  const memoryIndex = findMemoryIndex(memories, memoryId);

  if (memoryIndex < 0) {
    throw new Error("Memory not found");
  }

  const nextMemory: SharedMemory = {
    ...memories[memoryIndex],
    ...updates,
    note: updates.note
      ? sanitizeInput(updates.note)
      : memories[memoryIndex].note,
    movieTitle: updates.movieTitle
      ? sanitizeInput(updates.movieTitle)
      : memories[memoryIndex].movieTitle,
    updatedAt: new Date().toISOString(),
  };

  const nextMemories = memories.map((memory) =>
    memory.id === memoryId ? nextMemory : memory,
  );

  await mutateScope("memories", {
    op: "update_memory",
    payload: {
      memoryId,
      updates,
    },
    optimisticData: nextMemories,
  });

  return nextMemory;
};

export const updateMemoriesBatch = async (
  updates: Array<{
    memoryId: string;
    updates: {
      note?: string;
      movieId?: string;
      movieTitle?: string;
    };
  }>,
): Promise<SharedMemory[]> => {
  const memories = await getOptimisticMemories();

  const updatesMap = new Map(updates.map((u) => [u.memoryId, u.updates]));

  const nextMemories = memories.map((memory) => {
    const upd = updatesMap.get(memory.id);
    if (!upd) return memory;

    return {
      ...memory,
      ...upd,
      note: upd.note ? sanitizeInput(upd.note) : memory.note,
      movieTitle: upd.movieTitle
        ? sanitizeInput(upd.movieTitle)
        : memory.movieTitle,
      updatedAt: new Date().toISOString(),
    };
  });

  await mutateScope("memories", {
    op: "update_memories_batch",
    payload: { updates },
    optimisticData: nextMemories,
  });

  return nextMemories;
};

export const deleteMemory = async (memoryId: string): Promise<void> => {
  const memories = await getOptimisticMemories();
  const nextMemories = memories.filter((memory) => memory.id !== memoryId);

  if (nextMemories.length === memories.length) {
    throw new Error("Memory not found");
  }

  await mutateScope("memories", {
    op: "delete_memory",
    payload: { memoryId },
    optimisticData: nextMemories,
  });
};

export const toggleMemoryPin = async (
  memoryId: string,
): Promise<SharedMemory> => {
  const memories = await getOptimisticMemories();
  const memoryIndex = findMemoryIndex(memories, memoryId);

  if (memoryIndex < 0) {
    throw new Error("Memory not found");
  }

  const nextMemory: SharedMemory = {
    ...memories[memoryIndex],
    isPinned: !memories[memoryIndex].isPinned,
    updatedAt: new Date().toISOString(),
  };

  await mutateScope("memories", {
    op: "toggle_memory_pin",
    payload: { memoryId },
    optimisticData: memories.map((memory) =>
      memory.id === memoryId ? nextMemory : memory,
    ),
  });

  return nextMemory;
};
