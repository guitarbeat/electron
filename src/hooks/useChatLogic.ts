import { useCallback } from 'react';
import { useMessages } from './useMessages';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/utils/errorHandling';

export const useChatLogic = () => {
  const { showToast } = useToast();
  const { messages, isLoading, error, isSubmitting, addMessage, deleteMessage, toggleReaction } =
    useMessages();

  const handleSend = useCallback(
    async (author: string, content: string) => {
      try {
        await addMessage(author, content);
        showToast({ message: 'Message posted successfully!', type: 'success' });
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Failed to post message. Please try again.'));
      }
    },
    [addMessage, showToast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMessage(id);
        showToast({ message: 'Message deleted', type: 'success' });
      } catch (error) {
        showToast({
          message: `Error deleting message: ${getErrorMessage(error, 'Unknown error')}`,
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
      } catch (error) {
        showToast({
          message: getErrorMessage(error, 'Failed to add reaction'),
          type: 'error',
        });
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
