import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';
import { usePolling } from './usePolling';
import { getMessages, saveMessages } from '../services/messageService';

export const useMessages = () => {
  const { data: messages, error, isLoading, refresh } = usePolling(getMessages, 5000);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    await performMutation(latestMessages => latestMessages.filter(msg => msg.id !== messageId));
  }, [performMutation]);
  
  return { messages, isLoading, error, isSubmitting, addMessage, deleteMessage };
};
