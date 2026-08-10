import { useCallback, useState } from "react";
import type { SharedMemory, User } from "@/shared/types";
import { sanitizeInput } from "@/utils";

interface MemoryListActions {
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
