import { useCallback, useState } from "react";
import type { Movie, SharedMemory, User } from "@/shared/types";
import {
  compareCreatedAtAsc,
  compareCreatedAtDesc,
  normalizeMovieTitle,
  sanitizeInput,
} from "@/utils";

export const INITIAL_VISIBLE_COUNT = 6;
export const ALL_MOVIES_FILTER = "all";

export type MemorySortMode = "newest" | "oldest";
export const MEMORY_MENTION_REGEX = /(@Aaron|@Electra)\b/gi;

export interface StickyNoteTheme {
  background: string;
  border: string;
  heading: string;
  text: string;
  meta: string;
  signature: string;
  pin: string;
}

const STICKY_NOTE_THEMES: StickyNoteTheme[] = [
  {
    background:
      "linear-gradient(165deg, #fff4a6 0%, #f9e07a 72%, #efd46a 100%)",
    border: "#d0b45b",
    heading: "#4b3810",
    text: "#44330f",
    meta: "#6a5523",
    signature: "#7a3f00",
    pin: "#e45858",
  },
  {
    background:
      "linear-gradient(165deg, #b7f5ff 0%, #98e4f5 70%, #7ed2e8 100%)",
    border: "#72bccf",
    heading: "#12394a",
    text: "#113341",
    meta: "#2c5160",
    signature: "#115073",
    pin: "#f56f42",
  },
  {
    background:
      "linear-gradient(165deg, #ffd3b2 0%, #ffbf96 74%, #f8ad84 100%)",
    border: "#dd9367",
    heading: "#5e2c10",
    text: "#4e2a12",
    meta: "#754220",
    signature: "#8a3412",
    pin: "#47906f",
  },
  {
    background:
      "linear-gradient(165deg, #dcf8c5 0%, #c8ebaa 73%, #b2d78f 100%)",
    border: "#95b572",
    heading: "#2e4b1e",
    text: "#2d461d",
    meta: "#496838",
    signature: "#3f6a1f",
    pin: "#4168d6",
  },
];

const STICKY_NOTE_ROTATIONS = [-2.3, 1.8, -1.2, 2.4, -0.7, 1.1, -1.8, 2.7];

export const groupMemoriesByMovieId = (
  movies: Movie[],
  memories: SharedMemory[],
): Map<string, SharedMemory[]> => {
  const movieLookupByTitle = new Map(
    movies.map((movie) => [normalizeMovieTitle(movie.title), movie.id]),
  );
  const memoriesByMovieId = new Map<string, SharedMemory[]>();

  for (const memory of memories) {
    const targetMovieId =
      memory.movieId ??
      movieLookupByTitle.get(normalizeMovieTitle(memory.movieTitle));
    if (!targetMovieId) {
      continue;
    }

    const group = memoriesByMovieId.get(targetMovieId);
    if (group) {
      group.push(memory);
    } else {
      memoriesByMovieId.set(targetMovieId, [memory]);
    }
  }

  return memoriesByMovieId;
};

const getMemorySeed = (memory: SharedMemory): number => {
  const source = `${memory.id}|${memory.movieTitle}|${memory.author}|${memory.createdAt}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const getStickyNoteTheme = (memory: SharedMemory): StickyNoteTheme => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_THEMES[seed % STICKY_NOTE_THEMES.length];
};

export const getStickyNoteRotation = (memory: SharedMemory): number => {
  const seed = getMemorySeed(memory);
  return STICKY_NOTE_ROTATIONS[seed % STICKY_NOTE_ROTATIONS.length];
};

export const sortMemories = (
  memories: SharedMemory[],
  sortMode: MemorySortMode,
): SharedMemory[] => {
  const byDate =
    sortMode === "oldest" ? compareCreatedAtAsc : compareCreatedAtDesc;

  return [...memories].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
      return a.isPinned ? -1 : 1;
    }

    return byDate(a, b);
  });
};

export const canCreateMemory = (currentUser: string | null): boolean =>
  Boolean(currentUser);

export interface MemoryListActions {
  currentUser: User | null;
  onEditMemory: (memory: SharedMemory, note: string) => Promise<void>;
  onDeleteMemory: (memory: SharedMemory) => Promise<void>;
  onTogglePin: (memory: SharedMemory) => Promise<void>;
}

export const useMemoryListActions = ({
  currentUser,
  onEditMemory,
  onDeleteMemory,
  onTogglePin,
}: MemoryListActions) => {
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [isBusyMemoryId, setIsBusyMemoryId] = useState<string | null>(null);
  const [memoryToDelete, setMemoryToDelete] = useState<SharedMemory | null>(null);

  const confirmDeleteMemory = useCallback(async () => {
    if (!memoryToDelete) return;
    if (!currentUser || memoryToDelete.author !== currentUser) {
      setMemoryToDelete(null);
      return;
    }
    setIsBusyMemoryId(memoryToDelete.id);
    try {
      await onDeleteMemory(memoryToDelete);
      setMemoryToDelete(null);
    } finally {
      setIsBusyMemoryId(null);
    }
  }, [currentUser, memoryToDelete, onDeleteMemory]);

  const startEditing = useCallback((memory: SharedMemory) => {
    setEditingMemoryId(memory.id);
    setDraftNote(memory.note);
  }, []);

  const saveEdit = useCallback(
    async (memory: SharedMemory) => {
      const trimmedNote = sanitizeInput(draftNote.trim());
      if (!trimmedNote) return;
      setIsBusyMemoryId(memory.id);
      try {
        await onEditMemory(memory, trimmedNote);
        setEditingMemoryId(null);
        setDraftNote("");
      } finally {
        setIsBusyMemoryId(null);
      }
    },
    [draftNote, onEditMemory],
  );

  const cancelEdit = useCallback(() => {
    setEditingMemoryId(null);
    setDraftNote("");
  }, []);

  const togglePin = useCallback(
    async (memory: SharedMemory) => {
      setIsBusyMemoryId(memory.id);
      try {
        await onTogglePin(memory);
      } finally {
        setIsBusyMemoryId(null);
      }
    },
    [onTogglePin],
  );

  return {
    editingMemoryId,
    draftNote,
    setDraftNote,
    isBusyMemoryId,
    memoryToDelete,
    setMemoryToDelete,
    confirmDeleteMemory,
    startEditing,
    saveEdit,
    cancelEdit,
    togglePin,
  };
};
