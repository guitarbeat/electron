export type User = 'Aaron' | 'Electra';
export type MainTab = 'queue' | 'places';

export interface Place {
  id: string;
  name: string;
  addedBy?: User;
  notes?: string;
  createdAt: string;
  visitedAt?: string; // optional: when you went (ISO string)
  lat?: number;
  lng?: number;
  category?: string; // e.g. "Restaurant", "Park", "Museum"
  rating?: string; // e.g. "4.5", "3.8"
  description?: string; // detailed description
  imageUrl?: string; // optional photo
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  suggestedBy: User;
  createdAt: string;
  notes?: string;
  category?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;
}

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

export interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
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
  imageUrl?: string;
}

export interface MatchmakerGame {
  id: string;
  moviePool: string[]; // Array of movie IDs
  aaronLikes: string[]; // Array of movie IDs
  electraLikes: string[]; // Array of movie IDs
  aaronDislikes: string[]; // Array of movie IDs
  electraDislikes: string[]; // Array of movie IDs
  status: 'active' | 'completed';
  createdAt: string;
  startedBy: User;
}

export type ContentTab = 'all' | 'queue' | 'watched' | 'suggestions';
export type PlaceContentTab = 'all' | 'queue' | 'visited';
export type SortMode = 'recent' | 'title' | 'year';
export type PlaceSortMode = 'recent' | 'name';

export interface WatchlistProps {
  isPaused?: boolean;
  isMobile?: boolean;
}

export type { QuizCharacter } from './components/quiz/types.ts';
export { CHARACTERS } from './components/quiz/types.ts';
