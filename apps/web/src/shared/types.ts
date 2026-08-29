export type User = "Aaron" | "Electra";

export const USER_PHOTOS: Record<User, string> = {
  Aaron: "/aaron-avatar.png",
  Electra: "https://cataas.com/cat/cute?width=200&height=200",
};

export const MAIN_TABS = ["movies", "places", "memories", "messages"] as const;

export type MainTab = (typeof MAIN_TABS)[number];

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
  suggestedBy: string; // Any name (not restricted to User type)
  createdAt: string;
  notes?: string;
  category?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;
  status: "pending" | "accepted" | "rejected";
  respondedAt?: string;
  respondedBy?: User; // Aaron or Electra
}

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;

  // Metadata
  posterUrl?: string;
  customPosterUrl?: string;
  year?: string;
  plot?: string;
  imdbRating?: string;
  runtime?: string;
  genre?: string;
  director?: string;
  category?: string; // e.g. "Humor", "Action", "Drama"
  mediaType?: "movie" | "series" | "youtube";
  youtubeUrl?: string;
}

export interface MovieSuggestion {
  id: string;
  title: string;
  suggestedBy: string; // Any name (not restricted to User type)
  reason?: string; // Optional: "You'd love this because..."
  notes?: string;
  imdbID?: string;
  type?: "movie" | "series" | "youtube";
  youtubeUrl?: string;
  status: "pending" | "accepted" | "rejected";
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
  aaronSwipeOrder?: string[]; // Ordered history of Aaron's swipes
  electraSwipeOrder?: string[]; // Ordered history of Electra's swipes
  status: "active" | "completed";
  createdAt: string;
  startedBy: User;
}

export interface MoviesViewProps {
  isPaused?: boolean;
  hideSearch?: boolean;
}

export type {
  QuizCharacter,
  QuizQuestion,
  QuizAnswer,
  QuizResult,
  CharacterScores,
  MultipleChoiceQuestion,
  AgreeDisagreeQuestion,
  ImageChoiceQuestion,
  XYAxisQuestion,
  SavedQuizProgress,
} from "./quizData.js";
export {
  CHARACTERS,
  quizQuestions,
  characterDescriptions,
  neitherDescription,
  calculateQuizResults,
  buildQuizProgressStorageKey,
  readSavedQuizProgress,
  writeSavedQuizProgress,
  clearSavedQuizProgress,
} from "./quizData.js";
