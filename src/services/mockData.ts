import { Movie, SharedMemory, MovieSuggestion } from '@/types';

export const MOCK_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The Last Unicorn',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    year: '1982',
    genre: 'Fantasy, Animation',
    posterUrl: 'https://images.unsplash.com/photo-1533991511200-be0254ff29af?w=300&h=450&fit=crop',
  },
  {
    id: '2',
    title: 'Renfield',
    addedBy: 'Aaron',
    watchedBy: ['Aaron'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    year: '2023',
    genre: 'Horror, Comedy',
  },
  {
    id: '3',
    title: 'Easy A',
    addedBy: 'Electra',
    watchedBy: ['Aaron', 'Electra'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    year: '2010',
    genre: 'Comedy, Drama',
  },
  {
    id: '4',
    title: 'The Lego Movie',
    addedBy: 'Electra',
    watchedBy: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    year: '2014',
    genre: 'Animation, Comedy',
  },
  {
    id: '5',
    title: 'Beetlejuice',
    addedBy: 'Aaron',
    watchedBy: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    year: '1988',
    genre: 'Comedy, Fantasy',
  },
];

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
