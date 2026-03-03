import { useCallback } from 'react';
import { useMessages } from './useMessages';
import { useToast } from '../context/ToastContext';

export const useChatLogic = () => {
  const { showToast } = useToast();
  const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage, toggleReaction } =
    useMessages();

  const handleSend = useCallback(
    async (author: string, content: string) => {
      try {
        await addMessage(author, content);
        showToast({ message: 'Message posted successfully!', type: 'success' });
      } catch (err: any) {
        // Rerow so component can handle UI error states if needed (e.g. keep content)
        throw new Error(err.message || 'Failed to post message. Please try again.');
      }
    },
    [addMessage, showToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Are you sure you want to delete this message?')) return;
      try {
        await deleteMessage(id);
        showToast({ message: 'Message deleted', type: 'success' });
      } catch (err: any) {
        showToast({ message: `Error deleting message: ${err.message}`, type: 'error' });
      }
    },
    [deleteMessage, showToast]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      try {
        await toggleReaction(messageId, emoji, username);
      } catch (err: any) {
        showToast({ message: 'Failed to add reaction', type: 'error' });
      }
    },
    [toggleReaction, showToast]
  );

  return {
    messages,
    isLoading,
    error,
    isSubmitting,
    handleSend,
    handleDelete,
    handleReaction,
  };
};
