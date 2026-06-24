import { useCallback, useMemo, useState } from "react";
import { useUser } from "@/app/useProviders";
import type { Message } from "@/shared/types";
import { compareCreatedAtAsc, sanitizeInput } from "@/utils";
import { areScopeSnapshotsEqual } from "@/services/state/stateCompare";
import {
  addMessage as addMessageService,
  deleteMessage as deleteMessageService,
} from "@/services/content";
import { usePolling } from "@/services/polling";
import { readScope, retryScopeSync } from "@/services/state";

const POLLING_INTERVAL = 15000;

export const useMessages = () => {
  const { currentUser } = useUser();
  const readMessages = useCallback(() => readScope("messages"), []);
  const {
    data: snapshot,
    error,
    isLoading,
    refresh,
  } = usePolling(readMessages, POLLING_INTERVAL, areScopeSnapshotsEqual, {
    key: "messages",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = useMemo(
    () => [...(snapshot?.data ?? [])].sort(compareCreatedAtAsc),
    [snapshot],
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

  const retrySync = useCallback(async () => {
    await retryScopeSync("messages");
    refresh();
  }, [refresh]);

  return {
    currentUser,
    messages,
    error,
    isLoading,
    isSubmitting,
    isDegraded: snapshot?.degraded ?? false,
    isSyncBlocked: snapshot?.blocked ?? false,
    syncWarning: snapshot?.warning,
    addMessage,
    deleteMessage,
    refresh,
    retrySync,
  };
};
