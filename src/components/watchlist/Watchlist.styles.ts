// Consolidated styles and constants for watchlist component

// Skeleton keys for loading states
export const SKELETON_KEYS = {
  MOBILE: ['mobile-1', 'mobile-2', 'mobile-3', 'mobile-4'],
  DESKTOP: [
    'desktop-1',
    'desktop-2',
    'desktop-3',
    'desktop-4',
    'desktop-5',
    'desktop-6',
    'desktop-7',
    'desktop-8',
  ],
} as const;

// Animation delays for staggered effects
export const ANIMATION_DELAYS = {
  MOVIE_CARD: 0.05, // seconds per card
  CONFETTI_DURATION: 3000, // milliseconds
  SUCCESS_HIGHLIGHT: 2000, // milliseconds
} as const;

// Grid configurations
export const GRID_CONFIG = {
  MOBILE: {
    MIN_WIDTH: '140px',
  },
  DESKTOP: {
    MIN_WIDTH: '200px',
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  MEMORY_FILTER: 'queueMemoryFilter',
} as const;

// Default messages
export const MESSAGES = {
  EMPTY_STATE: {
    all: 'Your watchlist is empty',
    'to-watch': 'No movies to watch',
    watched: 'No watched movies yet',
    suggestions: 'No suggestions pending',
  },
  SEARCH_PLACEHOLDER: 'Search or plan your next movie night...',
  SEARCH_EMPTY: 'Search for a title and plan your next date-night watch.',
  ADD_LABELS: {
    USER: 'Add movie',
    GUEST: 'Suggest movie',
  },
} as const;

// Filter constants
export const FILTERS = {
  ALL_MOVIES: 'all',
  MEMORY_FILTER_DEFAULT: 'all',
} as const;

// Tab configurations
export const TAB_CONFIG = [
  { id: 'all' as const, label: 'All' },
  { id: 'to-watch' as const, label: 'To Watch' },
  { id: 'watched' as const, label: 'Watched' },
  { id: 'suggestions' as const, label: 'Suggestions' },
] as const;

// Sort options
export const SORT_OPTIONS = [
  { id: 'recent' as const, label: 'Recent' },
  { id: 'title' as const, label: 'Title' },
  { id: 'year' as const, label: 'Year' },
] as const;

// Content type for type safety
export type ContentTab = 'all' | 'to-watch' | 'watched' | 'suggestions';
export type SortMode = 'recent' | 'title' | 'year';
