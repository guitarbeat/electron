export type User = 'Aaron' | 'Electra';

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;
}

export interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface DailySpin {
  date: string; // ISO date string (YYYY-MM-DD)
  movieId: string;
  movieTitle: string;
  spunBy: User;
  createdAt: string; // ISO timestamp
}
