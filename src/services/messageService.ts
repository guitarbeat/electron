import { parseJsonContent, sanitizeInput } from '../utils.ts';
import type { Message } from '@/types';
import {
  canWriteGist,
  GIST_MESSAGES_FILENAME,
  readGistJsonFile,
  readStoredJson,
  saveGistJson,
  setLocalOverride,
  writeStoredJson,
} from './gistClient.ts';

const MESSAGES_LOCAL_STORAGE_KEY = 'movieList.localMessages';

export const cloneMessages = (messages: Message[]): Message[] =>
  messages.map((message) => ({
    ...message,
  }));

export const isMessageRecord = (value: unknown): value is Message => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<Message>;

  return (
    typeof message.id === 'string' &&
    typeof message.author === 'string' &&
    typeof message.content === 'string' &&
    typeof message.createdAt === 'string'
  );
};

export const parseMessagesContent = (content: string | undefined): Message[] => {
  if (!content) {
    return [];
  }

  const parsed = parseJsonContent(content, 'messages');
  return Array.isArray(parsed) ? parsed.filter(isMessageRecord).map((message) => ({ ...message })) : [];
};

const readStoredLocalMessages = (): Message[] | null =>
  readStoredJson({
    storageKey: MESSAGES_LOCAL_STORAGE_KEY,
    validate: (value): value is Message[] => Array.isArray(value) && value.every(isMessageRecord),
    clone: cloneMessages,
    label: 'local messages fallback',
  });

const getFallbackMessages = (): Message[] => readStoredLocalMessages() ?? [];

const saveLocalMessages = (messages: Message[]): void => {
  writeStoredJson({
    storageKey: MESSAGES_LOCAL_STORAGE_KEY,
    value: messages,
    clone: cloneMessages,
    label: 'local messages fallback',
  });
  setLocalOverride('messages', true);
};

export const getMessages = async (): Promise<Message[]> => {
  try {
    const messages = await readGistJsonFile({
      scope: 'messages',
      filename: GIST_MESSAGES_FILENAME,
      fallback: getFallbackMessages,
      onMissingFileWhenWritable: () => [],
      parse: parseMessagesContent,
    });

    return [...messages].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching messages from Gist:', error);
    return getFallbackMessages();
  }
};

export const saveMessages = async (messages: Message[]): Promise<void> => {
  await saveGistJson(GIST_MESSAGES_FILENAME, 'messages', messages, saveLocalMessages);
};

export const addMessage = async (author: string, content: string): Promise<Message> => {
  const messages = await getMessages();

  const nextMessage: Message = {
    id: `message-${crypto.randomUUID()}`,
    author: sanitizeInput(author),
    content: sanitizeInput(content),
    createdAt: new Date().toISOString(),
  };

  messages.push(nextMessage);
  await saveMessages(messages);
  return nextMessage;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const messages = await getMessages();
  const nextMessages = messages.filter((message) => message.id !== messageId);

  if (nextMessages.length === messages.length) {
    throw new Error('Message not found');
  }

  if (!canWriteGist) {
    saveLocalMessages(nextMessages);
    return;
  }

  await saveMessages(nextMessages);
};
