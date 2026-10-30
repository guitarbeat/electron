export type User = "Aaron" | "Electra" | "Guest";

export type MainTab = "movies" | "places" | "messages" | "quiz" | "spin";

export type WatchStatus = "queue" | "watching" | "seen";

export interface Movie {
  id: string;
  title: string;
  year?: string;
  posterUrl?: string;
  imageUrl?: string;
  customPosterUrl?: string;
  rating?: string;
  genre?: string;
  overview?: string;
  status: WatchStatus;
  watchedBy: User[];
  watched?: boolean;
  addedBy?: User;
  mediaType?: "movie" | "series" | "youtube";
  youtubeUrl?: string;
  createdAt?: string;
}

export interface MovieSuggestion {
  id: string;
  title: string;
  reason?: string;
  suggestedBy?: string;
  meta?: {
    imdbID?: string;
    type?: string;
  };
  createdAt?: string;
}

export interface Place {
  id: string;
  name: string;
  address?: string;
  category?: string;
  notes?: string;
  rating?: number;
  visitedBy?: User[];
  addedBy?: User;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  reason?: string;
  suggestedBy?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  avatarUrl?: string;
}
