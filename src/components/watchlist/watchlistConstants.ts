import type { ContentTab, SortMode } from '@/shared/types';

export const MOVIE_TABS: { id: ContentTab; label: string }[] = [
  { id: 'queue', label: 'Unwatched' },
  { id: 'watched', label: 'Watched' },
  { id: 'suggestions', label: 'Suggestions' },
];

export const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'title', label: 'A-Z' },
  { id: 'year', label: 'Year' },
];

export const MAX_MOVIE_NOTE_LENGTH = 280;
export const MAX_RECOMMENDATION_REASON_LENGTH = 280;
