import createGistService from './createGistService.ts';
import type { Message } from '@/types.ts';

const mockMessages: Message[] = [];

const { fetchData, saveData } = createGistService<Message>({
  filename: 'messages.json',
  mockData: mockMessages,
  typeName: 'Message',
});

export const getMessages = fetchData;
export const saveMessages = saveData;
