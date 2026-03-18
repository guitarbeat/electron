import type { SharedMemory, MovieSuggestion } from '@/types';

export const MOCK_MEMORIES: SharedMemory[] = [
  {
    id: 'mem1',
    movieTitle: 'Easy A',
    author: 'Aaron',
    note: 'This movie is absolutely hilarious. Emma Stone is amazing in this.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isPinned: true,
  },
  {
    id: 'mem2',
    movieTitle: 'The Lego Movie',
    author: 'Electra',
    note: 'Perfect feel-good movie. Everything is awesome!',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_SUGGESTIONS: MovieSuggestion[] = [
  {
    id: 'sug1',
    title: 'Knives Out',
    suggestedBy: 'Aaron',
    reason: 'A fun mystery movie with great characters',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sug2',
    title: 'Paddington 2',
    suggestedBy: 'Electra',
    reason: 'Wholesome and delightful',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];
