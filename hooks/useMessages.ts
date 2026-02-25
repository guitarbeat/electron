import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { usePolling } from './usePolling';
import { getMessages, saveMessages } from '../services/messageService';
import { sanitizeInput, MAX_MESSAGE_LENGTH, MAX_AUTHOR_LENGTH } from '../config/security';

export const MESSAGE_POLLING_INTERVAL = 10000;

export const useMessages = () => {
  // * Use JSON.stringify for deep equality check to prevent unnecessary re-renders
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const performMutation = useCallback(
    async (mutationFn: (latestMessages: Message[]) => Message[]) => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        const latestMessages = await getMessages();
        const updatedMessages = mutationFn(latestMessages);
        await saveMessages(updatedMessages);
        refresh();
      } catch (err) {
        console.error('Message mutation failed:', err);
        throw err;
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [refresh]
  );

  const addMessage = useCallback(
    async (author: string, content: string) => {
      const cleanAuthor = sanitizeInput(author);
      const cleanContent = sanitizeInput(content);

      if (!cleanContent) {
        throw new Error('Message cannot be empty');
      }

      if (cleanContent.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
      }

      if (cleanAuthor.length > MAX_AUTHOR_LENGTH) {
        throw new Error(`Author name exceeds maximum length of ${MAX_AUTHOR_LENGTH} characters`);
      }

      const newMessage: Message = {
        id: crypto.randomUUID(),
        author: cleanAuthor || 'Anonymous',
        content: cleanContent,
        createdAt: new Date().toISOString(),
      };
      await performMutation((latestMessages) => [newMessage, ...latestMessages]);
    },
    [performMutation]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await performMutation((latestMessages) =>
        latestMessages.filter((msg) => msg.id !== messageId)
      );
    },
    [performMutation]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      await performMutation((latestMessages) =>
        latestMessages.map((msg) => {
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
        })
      );
    },
    [performMutation]
  );

  return { messages, isLoading, error, isSubmitting, addMessage, deleteMessage, toggleReaction };
};
