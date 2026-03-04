import createGistService from './createGistService';
import type { Movie } from '../types';

// Mock data fallback for development/testing
const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Shawshank Redemption',
    addedBy: 'Aaron',
    year: '1994',
    posterUrl: 'https://via.placeholder.com/200x300?text=Shawshank',
    genre: 'Drama',
    category: 'Drama',
    runtime: '142',
    watchedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'The Godfather',
    addedBy: 'Aaron',
    year: '1972',
    posterUrl: 'https://via.placeholder.com/200x300?text=Godfather',
    genre: 'Crime, Drama',
    category: 'Drama',
    runtime: '175',
    watchedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Inception',
    addedBy: 'Aaron',
    year: '2010',
    posterUrl: 'https://via.placeholder.com/200x300?text=Inception',
    genre: 'Sci-Fi, Action',
    category: 'Sci-Fi',
    runtime: '148',
    watchedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    addedBy: 'Aaron',
    year: '1994',
    posterUrl: 'https://via.placeholder.com/200x300?text=PulpFiction',
    genre: 'Crime, Drama',
    category: 'Drama',
    runtime: '154',
    watchedBy: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'The Dark Knight',
    addedBy: 'Aaron',
    year: '2008',
    posterUrl: 'https://via.placeholder.com/200x300?text=DarkKnight',
    genre: 'Action, Crime, Drama',
    category: 'Action',
    runtime: '152',
    watchedBy: [],
    createdAt: new Date().toISOString(),
  },
];

const { fetchData, saveData } = createGistService<Movie>({
  filename: 'movies.json',
  mockData: mockMovies,
  typeName: 'Movie',
});

export const getMovies = fetchData;
export const saveMovies = saveData;
