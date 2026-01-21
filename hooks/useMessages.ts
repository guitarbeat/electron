import { useState, useCallback } from 'react';
import { Message } from '../types';
import { usePolling } from './usePolling';
import { getMessages, saveMessages } from '../services/messageService';

export const useMessages = () => {
  const { data: messages, error, isLoading, refresh } = usePolling(
    getMessages,
    5000,
    // * Prevent unnecessary re-renders by comparing content, as getMessages returns new references
    (prev, next) => JSON.stringify(prev) === JSON.stringify(next)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performMutation = useCallback(async (mutationFn: (latestMessages: Message[]) => Message[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const latestMessages = await getMessages();
      const updatedMessages = mutationFn(latestMessages);
      await saveMessages(updatedMessages);
      refresh();
    } catch (err) {
      console.error("Message mutation failed:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, refresh]);

  const addMessage = useCallback(async (author: string, content: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      author: author.trim() || 'Anonymous',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    await performMutation(latestMessages => [newMessage, ...latestMessages]);
  }, [performMutation]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    await performMutation(latestMessages => latestMessages.filter(msg => msg.id !== messageId));
  }, [performMutation]);
  
  return { messages, isLoading, error, isSubmitting, addMessage, deleteMessage };
};
