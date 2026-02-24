export type User = 'Aaron' | 'Electra';
export type MainTab = 'queue' | 'spin' | 'games' | 'quiz' | 'messages' | 'agent';

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;

  // Metadata
  posterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  category?: string; // e.g. "Humor", "Action", "Drama"
}

export interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of usernames who reacted
}

export interface DailySpin {
  date: string; // ISO date string (YYYY-MM-DD)
  movieId: string;
  movieTitle: string;
  spunBy: User;
  createdAt: string; // ISO timestamp
}

export interface SpinEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  movieId: string;
  movieTitle: string;
  spunBy: User;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

export type SpinHistory = SpinEntry[];

export interface MovieSuggestion {
  id: string;
  title: string;
  suggestedBy: string; // Any name (not restricted to User type)
  reason?: string; // Optional: "You'd love this because..."
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  respondedBy?: User; // Aaron or Electra
}

export interface SharedMemory {
  id: string;
  movieId?: string;
  movieTitle: string;
  author: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
  isPinned?: boolean;
}
