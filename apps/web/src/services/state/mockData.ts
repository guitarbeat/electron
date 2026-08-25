import type {
  Movie,
  MovieSuggestion,
  Message,
  SharedMemory,
  Place,
  PlaceSuggestion,
  MatchmakerGame,
} from "../../shared/types.ts";
import type { QuizData, DailySpinRecord, PinsState } from "./stateTypes.ts";

// Mock movies data
export const mockMovies: Movie[] = [
  {
    id: "mock-1",
    title: "The Matrix",
    addedBy: "Aaron",
    watchedBy: ["Aaron"],
    createdAt: "2024-01-15T10:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg",
    year: "1999",
    plot: "A computer hacker learns about the true nature of reality and his role in the war against its controllers.",
    imdbRating: "8.7",
    runtime: "136 min",
    genre: "Action, Sci-Fi",
    director: "Lana Wachowski, Lilly Wachowski",
  },
  {
    id: "mock-2",
    title: "Inception",
    addedBy: "Electra",
    watchedBy: [],
    createdAt: "2024-01-20T14:30:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    year: "2010",
    plot: "A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea into the mind of a CEO.",
    imdbRating: "8.8",
    runtime: "148 min",
    genre: "Action, Adventure, Sci-Fi",
    director: "Christopher Nolan",
  },
  {
    id: "mock-3",
    title: "Spirited Away",
    addedBy: "Electra",
    watchedBy: ["Aaron", "Electra"],
    createdAt: "2024-01-10T09:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_SX300.jpg",
    year: "2001",
    plot: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits.",
    imdbRating: "8.6",
    runtime: "125 min",
    genre: "Animation, Adventure, Family",
    director: "Hayao Miyazaki",
  },
  {
    id: "mock-4",
    title: "Parasite",
    addedBy: "Aaron",
    watchedBy: ["Electra"],
    createdAt: "2024-02-01T18:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_SX300.jpg",
    year: "2019",
    plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    imdbRating: "8.5",
    runtime: "132 min",
    genre: "Drama, Thriller",
    director: "Bong Joon Ho",
  },
  {
    id: "mock-5",
    title: "Everything Everywhere All at Once",
    addedBy: "Electra",
    watchedBy: [],
    createdAt: "2024-02-05T12:00:00Z",
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BOWY3OTg3Y2UtYjE1NC00ZjllLWFiNTQtOGQ1NzZiMzZiMDc0XkEyXkFqcGc@._V1_SX300.jpg",
    year: "2022",
    plot: "A middle-aged Chinese immigrant is swept up into an insane adventure where she alone can save existence by exploring other universes.",
    imdbRating: "7.8",
    runtime: "139 min",
    genre: "Action, Adventure, Comedy",
    director: "Daniel Kwan, Daniel Scheinert",
  },
];

// Mock suggestions
export const mockSuggestions: MovieSuggestion[] = [
  {
    id: "sugg-1",
    title: "Dune: Part Two",
    suggestedBy: "Guest",
    reason: "The cinematography is incredible!",
    status: "pending",
    createdAt: "2024-02-10T08:00:00Z",
  },
  {
    id: "sugg-2",
    title: "Poor Things",
    suggestedBy: "Friend",
    reason: "Emma Stone is amazing in this",
    status: "pending",
    createdAt: "2024-02-08T16:00:00Z",
  },
];

// Mock messages
export const mockMessages: Message[] = [
  {
    id: "msg-1",
    author: "Aaron",
    content: "What should we watch tonight?",
    createdAt: "2024-02-10T19:00:00Z",
  },
  {
    id: "msg-2",
    author: "Electra",
    content: "I'm in the mood for something light and fun!",
    createdAt: "2024-02-10T19:05:00Z",
  },
  {
    id: "msg-3",
    author: "Aaron",
    content: "How about Everything Everywhere? We haven't watched it yet.",
    createdAt: "2024-02-10T19:08:00Z",
  },
];

// Mock memories
export const mockMemories: SharedMemory[] = [
  {
    id: "mem-1",
    movieId: "mock-3",
    movieTitle: "Spirited Away",
    author: "Electra",
    note: "This was our first movie night together! The food in this movie always makes me hungry.",
    createdAt: "2024-01-10T21:00:00Z",
    isPinned: true,
  },
  {
    id: "mem-2",
    movieId: "mock-1",
    movieTitle: "The Matrix",
    author: "Aaron",
    note: "Still can't believe how well this movie holds up after all these years.",
    createdAt: "2024-01-15T23:00:00Z",
  },
];

// Mock places
export const mockPlaces: Place[] = [
  {
    id: "place-1",
    name: "Favorite Coffee Shop",
    addedBy: "Aaron",
    notes: "Best lattes in town, great for reading",
    createdAt: "2024-01-05T10:00:00Z",
    category: "Cafe",
    rating: "4.8",
    lat: 40.7128,
    lng: -74.006,
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
  },
  {
    id: "place-2",
    name: "Sunset Park",
    addedBy: "Electra",
    notes: "Perfect for evening walks and picnics",
    createdAt: "2024-01-12T15:00:00Z",
    visitedAt: "2024-02-01T17:30:00Z",
    category: "Park",
    rating: "4.5",
    lat: 40.6501,
    lng: -74.0027,
    imageUrl: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&q=80",
  },
  {
    id: "place-3",
    name: "The Cozy Bookstore",
    addedBy: "Electra",
    notes: "Amazing selection of sci-fi and fantasy books",
    createdAt: "2024-01-20T11:00:00Z",
    category: "Bookstore",
    rating: "4.9",
    lat: 40.7484,
    lng: -73.9857,
    imageUrl: "https://images.unsplash.com/photo-1507842229452-96a92881a293?w=600&q=80",
  },
  {
    id: "place-4",
    name: "Skyline Rooftop Lounge",
    addedBy: "Aaron",
    notes: "Cocktails with an incredible downtown skyline view",
    createdAt: "2024-01-25T19:00:00Z",
    category: "Bar",
    rating: "4.7",
    lat: 40.7589,
    lng: -73.9851,
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
  },
  {
    id: "place-5",
    name: "Artisan Bakery & Cafe",
    addedBy: "Electra",
    notes: "Warm croissants and fresh sourdough on Sunday mornings",
    createdAt: "2024-02-02T09:30:00Z",
    category: "Bakery",
    rating: "4.9",
    lat: 40.7306,
    lng: -73.9352,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  },
];

// Mock place suggestions
export const mockPlaceSuggestions: PlaceSuggestion[] = [
  {
    id: "place-sugg-1",
    name: "New Ramen Place",
    suggestedBy: "Aaron",
    notes: "Heard they have amazing tonkotsu ramen",
    category: "Restaurant",
    status: "pending",
    createdAt: "2024-02-08T12:00:00Z",
  },
];

// Mock quiz data
export const mockQuizData: QuizData = {
  questions: [],
  characterDescriptions: {
    Electra: "Electra",
    Aaron: "Aaron",
    Madeleine: "Madeleine",
    "Nosferatu/Smeemo": "Nosferatu/Smeemo",
  },
  neitherDescription: "Neither",
};

// Mock matchmaker game (null = no active game)
export const mockMatchmakerGame: MatchmakerGame | null = null;

// Mock pins (both users have set up PINs)
export const mockPins: PinsState = {
  Aaron: true,
  Electra: true,
};

// Mock spin history
export const mockSpinHistory: string[] = ["mock-1", "mock-3"];

// Mock daily spin
export const mockDailySpin: DailySpinRecord | null = null;

/**
 * Check if we're in mock mode (no backend configured)
 */
export const isMockMode = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  // Mock mode is opt-in. Real deployed environments with working `/api/*`
  // routes should use the backend by default.
  return window.localStorage.getItem("useMockData") === "true";
};
