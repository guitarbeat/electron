import { z } from "zod";
import type { Message, Movie, SharedMemory } from "../../shared/types.ts";
import {
  consoleError,
  isUser,
  isValidUrl,
  sanitizeInput,
} from "../../utils/shared.js";
import {
  compareCreatedAtAsc,
  compareCreatedAtDesc,
} from "../../utils/shared.js";
import { mutateScope, readScope } from "../state";
import {
  cloneMemories,
  cloneMessages,
  isMessageRecord,
  parseMessagesContent,
} from "../state";
import {
  normalizeOptionalString,
  normalizeRecordList,
  normalizeRequiredDate,
  normalizeRequiredString,
} from "../state";

// Message Service

export { cloneMessages, isMessageRecord, parseMessagesContent };

const sortMessages = (messages: Message[]): Message[] =>
  [...messages].sort(compareCreatedAtAsc);

export const getMessages = async (): Promise<Message[]> => {
  const snapshot = await readScope("messages");
  return sortMessages(snapshot.data);
};

export const addMessage = async (
  author: string,
  content: string,
): Promise<Message> => {
  const latestMessages = await getMessages();
  const nextMessage: Message = {
    id: `message-${crypto.randomUUID()}`,
    author: sanitizeInput(author),
    content: sanitizeInput(content),
    createdAt: new Date().toISOString(),
  };

  await mutateScope("messages", {
    op: "add_message",
    payload: {
      id: nextMessage.id,
      content: nextMessage.content,
    },
    optimisticData: [...latestMessages, nextMessage],
  });

  return nextMessage;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const latestMessages = await getMessages();
  const nextMessages = latestMessages.filter(
    (message) => message.id !== messageId,
  );

  if (nextMessages.length === latestMessages.length) {
    throw new Error("Message not found");
  }

  await mutateScope("messages", {
    op: "delete_message",
    payload: { messageId },
    optimisticData: nextMessages,
  });
};

// Memory Service

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

// Movie Records

const normalizePosterUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = sanitizeInput(value);
  if (!normalized || !isValidUrl(normalized)) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
};

export const cloneMovies = (movies: Movie[]): Movie[] =>
  movies.map((movie) => ({
    ...movie,
    watchedBy: [...movie.watchedBy],
  }));

export const normalizeMovieRecord = (value: unknown): Movie | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const movie = value as Partial<Movie>;
  const id = normalizeRequiredString(movie.id);
  const title = normalizeRequiredString(movie.title);
  const createdAt = normalizeRequiredDate(movie.createdAt);

  if (!id || !title || !isUser(movie.addedBy) || !createdAt) {
    return null;
  }

  const watchedBy = Array.isArray(movie.watchedBy)
    ? [...new Set(movie.watchedBy.filter(isUser))]
    : [];

  return {
    id,
    title,
    addedBy: movie.addedBy,
    watchedBy,
    createdAt,
    posterUrl: normalizePosterUrl(movie.posterUrl),
    year: normalizeOptionalString(movie.year),
    plot: normalizeOptionalString(movie.plot),
    imdbRating: normalizeOptionalString(movie.imdbRating),
    runtime: normalizeOptionalString(movie.runtime),
    genre: normalizeOptionalString(movie.genre),
    director: normalizeOptionalString(movie.director),
    category: normalizeOptionalString(movie.category),
  };
};

export const isMovieRecord = (value: unknown): value is Movie =>
  normalizeMovieRecord(value) !== null;

export const normalizeMovies = (value: unknown): Movie[] =>
  normalizeRecordList(value, normalizeMovieRecord);

const METADATA_FIELDS = [
  "posterUrl",
  "year",
  "plot",
  "imdbRating",
  "runtime",
  "genre",
  "director",
] as const satisfies readonly (keyof Movie)[];

export const mergeMissingMovieMetadata = (
  existing: Movie,
  incoming: Partial<Movie>,
): Partial<Movie> | null => {
  const patch: Partial<Movie> = {};

  for (const field of METADATA_FIELDS) {
    const nextValue = incoming[field];
    if (nextValue && !existing[field]) {
      patch[field] = nextValue;
    }
  }

  return Object.keys(patch).length > 0 ? patch : null;
};

// Pin Helpers

export interface UserPins {
  Aaron?: string;
  Electra?: string;
}

type SerialTaskRunner = <T>(task: () => Promise<T>) => Promise<T>;

export const clonePins = (pins: UserPins): UserPins => ({ ...pins });

export const normalizeUserPins = (value: unknown): UserPins | null => {
  if (value === null || (typeof value !== "object" && !Array.isArray(value))) {
    return null;
  }

  const result: UserPins = {
    Aaron: undefined,
    Electra: undefined,
  };

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record.Aaron === "string") {
      const trimmed = record.Aaron.trim();
      if (trimmed.length > 0) {
        result.Aaron = trimmed;
      }
    }
    if (typeof record.Electra === "string") {
      const trimmed = record.Electra.trim();
      if (trimmed.length > 0) {
        result.Electra = trimmed;
      }
    }
  }

  return result;
};

export const isUserPinsRecord = (value: unknown): value is UserPins =>
  normalizeUserPins(value) !== null;

export const parsePinsContent = (fileContent: string | undefined): UserPins => {
  if (!fileContent) {
    return {};
  }

  try {
    const parsed = JSON.parse(fileContent);
    return normalizeUserPins(parsed) ?? {};
  } catch (parseError) {
    consoleError("Error parsing PIN file:", parseError);
    return {};
  }
};

export const createSerialTaskRunner = (): SerialTaskRunner => {
  let pendingTask = Promise.resolve();

  return async <T>(task: () => Promise<T>): Promise<T> => {
    const nextTask = pendingTask.then(task, task);
    pendingTask = nextTask.then(
      () => undefined,
      () => undefined,
    );
    return nextTask;
  };
};

const PinRecordSchema = z.record(z.string(), z.string().trim().min(1));

export type PinRecord = z.infer<typeof PinRecordSchema>;

export const normalizePinRecord = (value: unknown): PinRecord => {
  const result = PinRecordSchema.safeParse(value);
  if (!result.success) {
    return {};
  }

  const normalized: PinRecord = {};
  for (const [key, pinValue] of Object.entries(result.data)) {
    normalized[key] = sanitizeInput(pinValue);
  }

  return normalized;
};

export const isPinRecord = (value: unknown): value is PinRecord => {
  const result = PinRecordSchema.safeParse(value);
  return result.success && Object.keys(result.data).length > 0;
};
