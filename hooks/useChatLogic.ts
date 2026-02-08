import { useState, useCallback, useEffect } from 'react';
import { useMessages } from './useMessages';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export const useChatLogic = () => {
  const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage, toggleReaction } =
    useMessages();
  const [toast, setToast] = useState<ToastState | null>(null);

  // * Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSend = useCallback(
    async (author: string, content: string) => {
      try {
        await addMessage(author, content);
        setToast({ message: 'Message posted successfully!', type: 'success' });
      } catch (err: any) {
        // Rerow so component can handle UI error states if needed (e.g. keep content)
        throw new Error(err.message || 'Failed to post message. Please try again.');
      }
    },
    [addMessage]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this message?')) return;
      try {
        await deleteMessage(id);
        setToast({ message: 'Message deleted', type: 'success' });
      } catch (err: any) {
        setToast({ message: `Error deleting message: ${err.message}`, type: 'error' });
      }
    },
    [deleteMessage]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      try {
        await toggleReaction(messageId, emoji, username);
      } catch (err: any) {
        setToast({ message: 'Failed to add reaction', type: 'error' });
      }
    },
    [toggleReaction]
  );

  return {
    messages,
    isLoading,
    error,
    isSubmitting,
    handleSend,
    handleDelete,
    handleReaction,
    toast,
  };
};
