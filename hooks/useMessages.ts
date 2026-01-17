import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { usePolling } from './usePolling';
import { getMessages, saveMessages } from '../services/messageService';

export const useMessages = () => {
  const { data: messages, error, isLoading, refresh } = usePolling(getMessages, 5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // * Use a ref to track submission status without triggering re-renders of the performMutation callback.
  // * This ensures that addMessage/deleteMessage are stable and don't cause child components to re-render.
  const isSubmittingRef = useRef(false);

  const performMutation = useCallback(async (mutationFn: (latestMessages: Message[]) => Message[]) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
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
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [refresh]);

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
    // * Note: Redundant confirmation check is preserved to match original behavior,
    // * though the UI component also handles confirmation.
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    await performMutation(latestMessages => latestMessages.filter(msg => msg.id !== messageId));
  }, [performMutation]);
  
  return { messages, isLoading, error, isSubmitting, addMessage, deleteMessage };
};
