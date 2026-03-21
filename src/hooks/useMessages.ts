import { useCallback, useMemo, useState } from 'react';
import { useUser } from '@/context';
import type { Message } from '@/types';
import { areDeeplyEqual, sanitizeInput } from '@/utils';
import { addMessage as addMessageService, deleteMessage as deleteMessageService, getMessages } from '@/services/messageService';
import { usePolling } from '@/services/polling';

const POLLING_INTERVAL = 5000;

export const useMessages = () => {
  const { currentUser } = useUser();
  const {
    data,
    error,
    isLoading,
    refresh,
  } = usePolling<Message[]>(getMessages, POLLING_INTERVAL, areDeeplyEqual, {
    key: 'messages',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messages = useMemo(() => data ?? [], [data]);

  const addMessage = useCallback(
    async (content: string) => {
      const trimmedContent = sanitizeInput(content);

      if (!currentUser) {
        throw new Error('Choose Aaron or Electra to send a message.');
      }

      if (!trimmedContent) {
        throw new Error('Please enter a message.');
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
    [currentUser, refresh]
  );

  const deleteMessage = useCallback(
    async (message: Message) => {
      if (!currentUser) {
        throw new Error('Choose Aaron or Electra to delete a message.');
      }

      if (message.author !== currentUser) {
        throw new Error('You can only delete your own messages.');
      }

      setIsSubmitting(true);
      try {
        await deleteMessageService(message.id);
        refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUser, refresh]
  );

  return {
    currentUser,
    messages,
    error,
    isLoading,
    isSubmitting,
    addMessage,
    deleteMessage,
    refresh,
  };
};
