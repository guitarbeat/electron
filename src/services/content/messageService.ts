import { mutateScope, readScope } from '../state/index.ts';
import { cloneMessages, isMessageRecord, parseMessagesContent } from '../state/stateSchemas.ts';
import type { Message } from '../../shared/types.ts';
import { sanitizeInput } from '../../utils/shared.ts';

export { cloneMessages, isMessageRecord, parseMessagesContent };

const sortMessages = (messages: Message[]): Message[] =>
  [...messages].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

export const getMessages = async (): Promise<Message[]> => {
  const snapshot = await readScope('messages');
  return sortMessages(snapshot.data);
};

export const addMessage = async (
  author: string,
  content: string
): Promise<Message> => {
  const latestMessages = await getMessages();
  const nextMessage: Message = {
    id: `message-${crypto.randomUUID()}`,
    author: sanitizeInput(author),
    content: sanitizeInput(content),
    createdAt: new Date().toISOString(),
  };

  await mutateScope('messages', {
    op: 'add_message',
    payload: {
      id: nextMessage.id,
      content: nextMessage.content,
    },
    optimisticData: [...latestMessages, nextMessage],
  });

  return nextMessage;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const latestMessages = await getMessages();
  const nextMessages = latestMessages.filter((message) => message.id !== messageId);

  if (nextMessages.length === latestMessages.length) {
    throw new Error('Message not found');
  }

  await mutateScope('messages', {
    op: 'delete_message',
    payload: { messageId },
    optimisticData: nextMessages,
  });
};
