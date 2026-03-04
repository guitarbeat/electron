import createGistService from './createGistService';
import { Message } from '../types';

const mockMessages: Message[] = [];

const { fetchData, saveData } = createGistService<Message>({
  filename: 'messages.json',
  mockData: mockMessages,
  typeName: 'Message',
});

export const getMessages = fetchData;
export const saveMessages = saveData;
