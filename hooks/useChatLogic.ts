import { useCallback } from 'react';
import { useMessages } from './useMessages';
import { useToast } from '../context/ToastContext';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const useChatLogic = () => {
  const { showToast } = useToast();
  const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage, toggleReaction } =
    useMessages();

  const handleSend = useCallback(
    async (author: string, content: string) => {
      try {
        await addMessage(author, content);
        showToast({ message: 'Message posted successfully!', type: 'success' });
      } catch (caughtError: unknown) {
        throw new Error(getErrorMessage(caughtError, 'Failed to post message. Please try again.'));
      }
    },
    [addMessage, showToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMessage(id);
        showToast({ message: 'Message deleted', type: 'success' });
      } catch (caughtError: unknown) {
        showToast({
          message: `Error deleting message: ${getErrorMessage(caughtError, 'Unknown error')}`,
          type: 'error',
        });
      }
    },
    [deleteMessage, showToast]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      try {
        await toggleReaction(messageId, emoji, username);
      } catch {
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
