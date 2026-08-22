import { useCallback, useMemo, useState } from "react";
import { useUser } from "@/app/useProviders";
import type { Message } from "@/shared/types";
import { compareCreatedAtAsc, sanitizeInput } from "@/utils";
import {
  addMessage as addMessageService,
  deleteMessage as deleteMessageService,
} from "@/services/content";
import { useSyncedScope } from "./useSyncedScope";

const POLLING_INTERVAL = 15000;

export const useMessages = () => {
  const { currentUser } = useUser();
  const {
    data: remoteMessages,
    error,
    isLoading,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    refresh,
    retrySync,
  } = useSyncedScope("messages", {
    pollingInterval: POLLING_INTERVAL,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = useMemo(
    () => [...(remoteMessages ?? [])].sort(compareCreatedAtAsc),
    [remoteMessages],
  );

  const addMessage = useCallback(
    async (content: string) => {
      const trimmedContent = sanitizeInput(content);

      if (!currentUser) {
        throw new Error("Choose Aaron or Electra to send a message.");
      }

      if (!trimmedContent) {
        throw new Error("Please enter a message.");
      }

      setIsSubmitting(true);
      try {
        const result = await addMessageService(currentUser, trimmedContent);
        refresh();
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh],
  );

  const deleteMessage = useCallback(
    async (message: Message) => {
      if (!currentUser) {
        throw new Error("Choose Aaron or Electra to delete a message.");
      }

      if (message.author !== currentUser) {
        throw new Error("You can only delete your own messages.");
      }

      setIsSubmitting(true);
      try {
        await deleteMessageService(message.id);
        refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh],
  );

  return {
    currentUser,
    messages,
    error,
    isLoading,
    isSubmitting,
    isDegraded,
    isSyncBlocked,
    syncWarning,
    addMessage,
    deleteMessage,
    refresh,
    retrySync,
  };
};
