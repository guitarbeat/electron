import { useCallback } from 'react';
import { Message } from '@/types;
import { usePolling } from './usePolling';
import { getMessages, saveMessages } from '@/services/messageService;
import { validateAndThrow, validateMessage } from '@/utils/validation;
import { sanitizeInput } from '@/config/security;

export const MESSAGE_POLLING_INTERVAL = 10000;

export const useMessages = () => {
  const {
    data: messages,
    error,
    isLoading,
    refresh,
  } = usePolling(
    getMessages,
    MESSAGE_POLLING_INTERVAL,
    (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
    {
      key: 'messages',
    }
  );

  const addMessage = useCallback(
    async (author: string, content: string) => {
      // Validate input
      validateAndThrow(validateMessage, { author, content });

      const cleanAuthor = sanitizeInput(author) || 'Anonymous';
      const cleanContent = sanitizeInput(content);

      const newMessage: Message = {
        id: crypto.randomUUID(),
        author: cleanAuthor,
        content: cleanContent,
        createdAt: new Date().toISOString(),
      };

      const latestMessages = await getMessages();
      await saveMessages([newMessage, ...latestMessages]);
      refresh();
    },
    [refresh]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const latestMessages = await getMessages();
      const updatedMessages = latestMessages.filter((msg) => msg.id !== messageId);
      await saveMessages(updatedMessages);
      refresh();
    },
    [refresh]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      const latestMessages = await getMessages();
      const updatedMessages = latestMessages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = { ...(msg.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes(username)) {
          // Remove reaction
          reactions[emoji] = users.filter((u) => u !== username);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          // Add reaction
          reactions[emoji] = [...users, username];
        }

        return { ...msg, reactions };
      });

      await saveMessages(updatedMessages);
      refresh();
    },
    [refresh]
  );

  return {
    messages,
    isLoading,
    isSubmitting: false,
    error,
    addMessage,
    deleteMessage,
    toggleReaction,
  };
};
