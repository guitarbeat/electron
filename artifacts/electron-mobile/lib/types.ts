export type User = "Aaron" | "Electra";

export const USER_PHOTOS: Record<User, string> = {
  Aaron: "https://cataas.com/cat/black?width=200&height=200",
  Electra: "https://cataas.com/cat/cute?width=200&height=200",
};

export const USERS: User[] = ["Aaron", "Electra"];

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;
  posterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  category?: string;
}

export interface Place {
  id: string;
  name: string;
  addedBy?: User;
  notes?: string;
  createdAt: string;
  visitedAt?: string;
  lat?: number;
  lng?: number;
  category?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;
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

export interface StateEnvelope<T> {
  data: T;
  version: string;
  degraded: boolean;
  warning?: string;
}

export interface OmdbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}
